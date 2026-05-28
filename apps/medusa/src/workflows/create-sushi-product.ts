import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { SUSHI_ORDER_FLOW } from "../lib/sushi/constants"
import "./hooks/validate-add-to-cart"

export type CreateSushiProductInput = {
  title: string
  description: string
  price_cents: number
  inventory_quantity: number
  thumbnail?: string | null
  status?: "draft" | "published"
  handle?: string
}

const SUSHI_COLLECTION_HANDLE = "sushi"

const createProductStep = createStep(
  "create-sushi-product-record",
  async (input: CreateSushiProductInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const storeModule = container.resolve(Modules.STORE)
    const inventoryModule = container.resolve(Modules.INVENTORY)
    const productModule = container.resolve(Modules.PRODUCT)

    const [store] = await storeModule.listStores()
    const salesChannelId = store?.default_sales_channel_id
    if (!salesChannelId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Store default sales channel is not configured. Run init first.",
      )
    }

    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
      filters: { type: "default" },
    })
    const shippingProfileId = shippingProfiles?.[0]?.id
    if (typeof shippingProfileId !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Default shipping profile not found. Run init first.",
      )
    }

    const { data: collections } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
      filters: { handle: SUSHI_COLLECTION_HANDLE },
    })
    const sushiCollectionId = collections?.[0]?.id

    const { data: stockLocations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
    })
    const stockLocation =
      stockLocations?.find(
        (loc) => (loc as { name?: string }).name === "Main Warehouse",
      ) ?? stockLocations?.[0]
    const stockLocationId = (stockLocation as { id?: string } | undefined)?.id
    if (typeof stockLocationId !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stock location not found. Run init first.",
      )
    }

    const handle =
      input.handle ??
      input.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    if (!handle) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Product title must contain at least one letter or number.",
      )
    }

    const existing = await productModule.listProducts({ handle })
    if (existing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `A product with handle "${handle}" already exists. Use a different title.`,
      )
    }

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: input.title,
            handle,
            description: input.description,
            status: input.status ?? "published",
            thumbnail: input.thumbnail ?? undefined,
            metadata: {
              order_flow: SUSHI_ORDER_FLOW,
            },
            ...(typeof sushiCollectionId === "string"
              ? { collection_id: sushiCollectionId }
              : {}),
            shipping_profile_id: shippingProfileId,
            sales_channels: [{ id: salesChannelId }],
            options: [
              {
                title: "Default",
                values: ["Default"],
              },
            ],
            variants: [
              {
                title: "Default",
                sku: `SUSHI-${handle}`.slice(0, 60),
                manage_inventory: true,
                options: { Default: "Default" },
                prices: [
                  {
                    currency_code: "usd",
                    amount: input.price_cents,
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const product = result[0]
    const variant = product.variants?.[0]
    const quantity = Math.max(0, input.inventory_quantity)

    if (variant?.sku && quantity > 0) {
      const existingItems = await inventoryModule.listInventoryItems({
        sku: variant.sku,
      })
      let inventoryItem = existingItems[0]

      if (!inventoryItem) {
        inventoryItem = await inventoryModule.createInventoryItems({
          sku: variant.sku,
          requires_shipping: true,
          title: variant.title ?? input.title,
        })
      } else if (inventoryItem.requires_shipping !== true) {
        inventoryItem = await inventoryModule.updateInventoryItems({
          id: inventoryItem.id,
          requires_shipping: true,
        })
      }

      const existingLevels = await inventoryModule.listInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: stockLocationId,
      })

      if (existingLevels.length === 0) {
        await inventoryModule.createInventoryLevels({
          inventory_item_id: inventoryItem.id,
          location_id: stockLocationId,
          stocked_quantity: quantity,
        })
      } else {
        await inventoryModule.updateInventoryLevels({
          inventory_item_id: inventoryItem.id,
          location_id: stockLocationId,
          stocked_quantity: quantity,
        })
      }
    }

    return new StepResponse(product)
  },
)

export const createSushiProductWorkflow = createWorkflow(
  "create-sushi-product",
  (input: CreateSushiProductInput) => {
    const product = createProductStep(input)
    return new WorkflowResponse(product)
  },
)
