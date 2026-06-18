import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUSHI_DELIVERY_FEE_SKU } from "./constants"

type DeliveryFeeVariantRow = {
  id?: string
  allow_backorder?: boolean
  manage_inventory?: boolean
  product_id?: string
}

/**
 * Medusa complete-cart requires every cart variant to either have inventory at a
 * sales-channel stock location or allow_backorder. The delivery fee line has no
 * inventory item, so it must allow backorder.
 */
export async function ensureSushiDeliveryFeeVariantReady(
  container: MedusaContainer,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = (await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "allow_backorder", "manage_inventory", "product_id"],
    // Medusa v2's generated filter types omit `sku` for product_variant, but the
    // remote query supports it at runtime. Suppress just this line so we keep
    // precise typing everywhere else (preferred over `as any`).
    // @ts-expect-error filter sku is valid at runtime but missing from generated types
    filters: { sku: SUSHI_DELIVERY_FEE_SKU },
  })) as { data?: DeliveryFeeVariantRow[] }

  const variant = variants?.[0]

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
