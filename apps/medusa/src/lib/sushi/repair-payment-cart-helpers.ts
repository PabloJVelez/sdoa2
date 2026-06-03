import { isSushiDeliveryFeeLine } from "./product"
import type { CartSnapshot } from "./cart-snapshot"

export type DesiredFoodLine = {
  variant_id: string
  quantity: number
  metadata: Record<string, unknown>
}

export function groupFoodQuantitiesByVariant(
  items: Array<{ variant_id?: string | null; quantity?: number | null }>,
): Map<string, number> {
  const grouped = new Map<string, number>()

  for (const item of items) {
    if (!item.variant_id) continue
    const qty = Math.max(1, Number(item.quantity) || 1)
    grouped.set(
      item.variant_id,
      (grouped.get(item.variant_id) ?? 0) + qty,
    )
  }

  return grouped
}

export function buildDesiredFoodLinesFromSnapshot(
  snapshot: CartSnapshot,
  orderRequestId: string | null | undefined,
  metadataForLine: Record<string, unknown>,
): DesiredFoodLine[] {
  const rawItems = snapshot.items ?? []
  const foodItems = rawItems.filter(
    (item) => item?.variant_id && !isSushiDeliveryFeeLine(item),
  )

  const withMatchingRequest = orderRequestId
    ? foodItems.filter((item) => {
        const metadata = (item.metadata ?? {}) as Record<string, unknown>
        return metadata.sushi_order_request_id === orderRequestId
      })
    : []

  const sourceItems = withMatchingRequest.length ? withMatchingRequest : foodItems
  const quantities = groupFoodQuantitiesByVariant(
    sourceItems.map((item) => ({
      variant_id: String(item.variant_id),
      quantity: item.quantity,
    })),
  )

  return [...quantities.entries()].map(([variant_id, quantity]) => ({
    variant_id,
    quantity,
    metadata: metadataForLine,
  }))
}

export function foodLineQuantitiesMatch(
  desired: Map<string, number>,
  current: Map<string, number>,
): boolean {
  if (desired.size !== current.size) return false

  for (const [variantId, quantity] of desired.entries()) {
    if (current.get(variantId) !== quantity) {
      return false
    }
  }

  return true
}
