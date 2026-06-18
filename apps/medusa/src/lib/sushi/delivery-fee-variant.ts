import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUSHI_DELIVERY_FEE_SKU } from "./constants"

type QueryClient = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data?: Array<Record<string, unknown>> }>
}

export async function getSushiDeliveryFeeVariantId(
  container: MedusaContainer,
): Promise<string | null> {
  if (process.env.SUSHI_DELIVERY_FEE_VARIANT_ID) {
    return process.env.SUSHI_DELIVERY_FEE_VARIANT_ID
  }

  const query = container.resolve(
    ContainerRegistrationKeys.QUERY,
  ) as QueryClient
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id"],
    filters: { sku: SUSHI_DELIVERY_FEE_SKU },
  })

  const variantId = data?.[0]?.id
  return typeof variantId === "string" ? variantId : null
}
