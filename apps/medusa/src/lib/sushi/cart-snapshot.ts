import { SUSHI_DELIVERY_FEE_SKU, SUSHI_DELIVERY_FEE_LINE_KIND } from "./constants"
import { isSushiDeliveryFeeLine } from "./product"

export type CartSnapshotLineItem = {
  variant_id: string
  quantity: number
  unit_price?: number
  title?: string
}

export type CartSnapshot = {
  id?: string
  region_id?: string
  email?: string
  metadata?: Record<string, unknown>
  shipping_address?: Record<string, unknown>
  items?: Array<{
    id?: string
    variant_id?: string
    quantity?: number
    unit_price?: number
    title?: string
    metadata?: Record<string, unknown>
  }>
}

type CartLike = {
  id?: string
  email?: string | null
  region_id?: string
  metadata?: Record<string, unknown> | null
  shipping_address?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  items?: Array<{
    id?: string
    variant_id?: string | null
    quantity?: number | string
    unit_price?: number | string
    title?: string
    product_title?: string
    variant_sku?: string | null
    sku?: string | null
    metadata?: Record<string, unknown> | null
  }> | null
}

export function buildCartSnapshot(cart: CartLike): CartSnapshot {
  const items = (cart.items ?? [])
    .filter((item) => item?.variant_id && !isSushiDeliveryFeeLine(item))
    .map((item) => ({
      id: item.id,
      variant_id: String(item.variant_id),
      quantity: Math.max(1, Number(item.quantity) || 1),
      unit_price:
        item.unit_price != null ? Number(item.unit_price) : undefined,
      title: item.title ?? item.product_title,
      metadata: (item.metadata ?? {}) as Record<string, unknown>,
    }))

  return {
    id: cart.id,
    region_id: cart.region_id,
    email: cart.email ?? undefined,
    metadata: (cart.metadata ?? {}) as Record<string, unknown>,
    shipping_address:
      cart.shipping_address ?? cart.billing_address ?? undefined,
    items,
  }
}

export function computeFoodSubtotalCents(
  items: Array<{
    unit_price?: number
    quantity?: number
    metadata?: Record<string, unknown>
    variant_sku?: string | null
    sku?: string | null
  }> | null | undefined,
): number {
  if (!items?.length) return 0

  let total = 0
  for (const item of items) {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>
    if (metadata.kind === SUSHI_DELIVERY_FEE_LINE_KIND) continue

    const sku = item.variant_sku ?? item.sku ?? ""
    if (sku === SUSHI_DELIVERY_FEE_SKU) continue

    const price = typeof item.unit_price === "number" ? item.unit_price : 0
    const qty =
      typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1
    total += Math.round(price * qty * 100)
  }

  return total
}

export function parseCartSnapshot(raw: unknown): CartSnapshot {
  if (!raw || typeof raw !== "object") {
    return {}
  }
  return raw as CartSnapshot
}

export function getCartSnapshotLineItems(
  snapshot: CartSnapshot,
): CartSnapshotLineItem[] {
  const items = snapshot.items ?? []
  return items
    .filter(
      (item) =>
        typeof item.variant_id === "string" && item.variant_id.length > 0,
    )
    .map((item) => ({
      variant_id: item.variant_id!,
      quantity:
        typeof item.quantity === "number" && item.quantity > 0
          ? item.quantity
          : 1,
      unit_price: item.unit_price,
      title: item.title,
    }))
}

export function getCartSnapshotSubtotalCents(
  snapshot: CartSnapshot | unknown,
): number {
  const parsed =
    snapshot && typeof snapshot === "object" && "items" in snapshot
      ? (snapshot as CartSnapshot)
      : parseCartSnapshot(snapshot)
  return computeFoodSubtotalCents(parsed.items)
}
