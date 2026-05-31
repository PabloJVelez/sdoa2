import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  getCartSnapshotLineItems,
  parseCartSnapshot,
} from "./cart-snapshot"

export type OrderRequestWarning = {
  code: "discontinued_variant"
  message: string
  variant_id?: string
  product_title?: string
}

type VariantRow = {
  id?: string
  title?: string
  product?: { id?: string; title?: string; status?: string }
}

export async function getSushiOrderRequestWarnings(
  container: MedusaContainer,
  cartSnapshot: unknown,
): Promise<OrderRequestWarning[]> {
  const snapshot = parseCartSnapshot(cartSnapshot)
  const lineItems = getCartSnapshotLineItems(snapshot)
  if (!lineItems.length) {
    return []
  }

  const variantIds = [...new Set(lineItems.map((item) => item.variant_id))]
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "product.id", "product.title", "product.status"],
    filters: { id: variantIds },
  })

  const variantMap = new Map<string, VariantRow>()
  for (const variant of (variants ?? []) as VariantRow[]) {
    if (variant.id) {
      variantMap.set(variant.id, variant)
    }
  }

  const warnings: OrderRequestWarning[] = []

  for (const line of lineItems) {
    const variant = variantMap.get(line.variant_id)
    if (!variant) {
      warnings.push({
        code: "discontinued_variant",
        message: `${line.title ?? "An item"} is no longer available`,
        variant_id: line.variant_id,
        product_title: line.title,
      })
      continue
    }

    const status = variant.product?.status
    if (status !== "published") {
      const title = variant.product?.title ?? line.title ?? "An item"
      warnings.push({
        code: "discontinued_variant",
        message: `${title} is discontinued or unpublished`,
        variant_id: line.variant_id,
        product_title: title,
      })
    }
  }

  return warnings
}
