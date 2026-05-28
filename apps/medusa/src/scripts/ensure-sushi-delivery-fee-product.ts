import type { ExecArgs } from "@medusajs/types"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  SUSHI_DELIVERY_FEE_SKU,
  SUSHI_ORDER_FLOW,
} from "../lib/sushi/constants"

const PRODUCT_HANDLE = "sushi-delivery-fee"

export default async function ensureSushiDeliveryFeeProduct({
  container,
}: Pick<ExecArgs, "container">) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data?: Array<Record<string, unknown>> }>
  }

  const { data: existing } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku"],
    filters: { sku: SUSHI_DELIVERY_FEE_SKU },
  })

  if (existing?.[0]?.id) {
    logger.info("[ensure-sushi-delivery-fee] Variant already exists")
    return
  }

  const productModule = container.resolve(Modules.PRODUCT)
  const existingProducts = await productModule.listProducts({
    handle: PRODUCT_HANDLE,
  })
  if (existingProducts.length) {
    await productModule.deleteProducts([String(existingProducts[0].id)])
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  const defaultProfileId = shippingProfiles?.[0]?.id
  if (typeof defaultProfileId !== "string") {
    throw new Error("Default shipping profile not found. Run init first.")
  }

  const storeModule = container.resolve(Modules.STORE)
  const [store] = await storeModule.listStores()
  if (!store?.default_sales_channel_id) {
    throw new Error("Store default sales channel missing")
  }

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Sushi Delivery Fee",
          handle: PRODUCT_HANDLE,
          status: "published",
          description: "Internal line item for sushi delivery mileage fees.",
          shipping_profile_id: defaultProfileId,
          sales_channels: [{ id: store.default_sales_channel_id }],
          metadata: {
            is_system_product: true,
            order_flow: SUSHI_ORDER_FLOW,
            kind: "sushi_delivery_fee",
          },
          options: [{ title: "Fee", values: ["Standard"] }],
          variants: [
            {
              title: "Delivery Fee",
              sku: SUSHI_DELIVERY_FEE_SKU,
              manage_inventory: false,
              options: { Fee: "Standard" },
              prices: [{ currency_code: "usd", amount: 0 }],
            },
          ],
        },
      ],
    },
  })

  logger.info("[ensure-sushi-delivery-fee] Created sushi delivery fee product")
}
