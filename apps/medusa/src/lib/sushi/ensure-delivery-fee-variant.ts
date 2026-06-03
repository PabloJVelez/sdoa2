import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUSHI_DELIVERY_FEE_SKU } from "./constants"

/**
 * Medusa complete-cart requires every cart variant to either have inventory at a
 * sales-channel stock location or allow_backorder. The delivery fee line has no
 * inventory item, so it must allow backorder.
 */
export async function ensureSushiDeliveryFeeVariantReady(
  container: MedusaContainer,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "allow_backorder", "manage_inventory", "product_id"],
    filters: { sku: SUSHI_DELIVERY_FEE_SKU },
  })

  const variant = variants?.[0] as
    | {
        id?: string
        allow_backorder?: boolean
        manage_inventory?: boolean
        product_id?: string
      }
    | undefined

  if (!variant?.id || !variant.product_id) {
    return
  }

  if (variant.allow_backorder === true && variant.manage_inventory === false) {
    return
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: [
        {
          id: variant.product_id,
          variants: [
            {
              id: variant.id,
              manage_inventory: false,
              allow_backorder: true,
            },
          ],
        },
      ],
    },
  })
}
