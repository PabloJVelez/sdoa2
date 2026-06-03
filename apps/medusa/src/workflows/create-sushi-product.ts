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
import {
  resolveProductThumbnail,
  toProductImageInputs,
} from "../lib/sushi/product-images"
import { ensureDefaultSalesChannelStockLocationLink } from "../lib/sushi/ensure-sales-channel-stock-location"
import { ensureSushiProductStoreReady } from "../lib/sushi/ensure-sushi-product-store"
import { resolvePhysicalShippingProfileId } from "../lib/sushi/shipping-profile"
import { majorUnitsFromCents } from "../lib/sushi/pricing"
import { setVariantInventoryQuantity } from "../lib/sushi/variant-inventory"
import "./hooks/validate-add-to-cart"

export type CreateSushiProductInput = {
  title: string
  description: string
  price_cents: number
  inventory_quantity: number
  images?: string[]
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
    const productModule = container.resolve(Modules.PRODUCT)

    const [store] = await storeModule.listStores()
    const salesChannelId = store?.default_sales_channel_id
    if (!salesChannelId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Store default sales channel is not configured. Run init first.",
      )
    }

    const shippingProfileId = await resolvePhysicalShippingProfileId(container)

    const { data: collections } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
      filters: { handle: SUSHI_COLLECTION_HANDLE },
    })
    const sushiCollectionId = collections?.[0]?.id

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

    const imageUrls = input.images ?? []
    const thumbnail = resolveProductThumbnail(input.thumbnail, imageUrls)

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: input.title,
            handle,
            description: input.description,
            status: input.status ?? "published",
            thumbnail,
            images: toProductImageInputs(imageUrls),
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
                    amount: majorUnitsFromCents(input.price_cents),
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

    if (variant?.id && variant?.sku) {
      await ensureDefaultSalesChannelStockLocationLink(container)
      await setVariantInventoryQuantity(container, {
        variantId: variant.id,
        variantSku: variant.sku,
        variantTitle: variant.title ?? input.title,
        quantity: Math.max(0, input.inventory_quantity),
      })
    }

    await ensureSushiProductStoreReady(container, product.id)

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
