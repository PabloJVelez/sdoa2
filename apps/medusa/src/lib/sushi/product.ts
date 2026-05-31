import { SUSHI_DELIVERY_FEE_SKU, SUSHI_ORDER_FLOW } from "./constants"

type ProductLike = {
  metadata?: Record<string, unknown> | null
  collection?: { handle?: string | null } | null
  categories?: Array<{ handle?: string | null }> | null
}

type LineItemLike = {
  metadata?: Record<string, unknown> | null
  variant_sku?: string | null
  product?: ProductLike | null
}

export function isSushiProduct(product: ProductLike): boolean {
  const metadata = product.metadata ?? {}
  if (metadata.order_flow === SUSHI_ORDER_FLOW) {
    return true
  }
  if (product.collection?.handle === "sushi") {
    return true
  }
  return (
    product.categories?.some((category) => category.handle === "sushi") ?? false
  )
}

export function isSushiDeliveryFeeLine(item: LineItemLike): boolean {
  const metadata = (item.metadata ?? {}) as Record<string, unknown>
  return (
    metadata.kind === "sushi_delivery_fee" ||
    item.variant_sku === "SUSHI-DELIVERY-FEE"
  )
}

function isSushiFoodSku(sku: string | null | undefined): boolean {
  if (!sku || !sku.startsWith("SUSHI-")) return false
  return sku !== SUSHI_DELIVERY_FEE_SKU
}

export function cartContainsSushiItems(
  items: LineItemLike[] | null | undefined,
): boolean {
  if (!items?.length) return false
  return items.some((item) => {
    if (isSushiDeliveryFeeLine(item)) return false
    if (isSushiFoodSku(item.variant_sku)) return true
    const metadata = (item.metadata ?? {}) as Record<string, unknown>
    if (metadata.order_flow === SUSHI_ORDER_FLOW) return true
    return isSushiProduct(item.product ?? {})
  })
}

export function cartContainsEventItems(
  items: LineItemLike[] | null | undefined,
): boolean {
  if (!items?.length) return false

  return items.some((item) => {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>
    if (typeof metadata.chef_event_id === "string") return true
    if (metadata.kind === "chef_event_additional_charge") return true
    return (
      typeof item.variant_sku === "string" &&
      item.variant_sku.startsWith("EVENT-")
    )
  })
}
