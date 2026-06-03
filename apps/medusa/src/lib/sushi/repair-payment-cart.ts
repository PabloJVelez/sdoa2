import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  deleteLineItemsWorkflow,
} from "@medusajs/medusa/core-flows"
import { parseCartSnapshot } from "./cart-snapshot"
import { SUSHI_ORDER_FLOW } from "./constants"
import { isSushiDeliveryFeeLine } from "./product"
import {
  buildDesiredFoodLinesFromSnapshot,
  foodLineQuantitiesMatch,
  groupFoodQuantitiesByVariant,
} from "./repair-payment-cart-helpers"

export async function rebuildSushiPaymentCartFoodLines(
  container: MedusaContainer,
  cartId: string,
  cartSnapshot: unknown,
  orderRequestId?: string | null,
): Promise<void> {
  const snapshot = parseCartSnapshot(cartSnapshot)
  const metadata = {
    order_flow: SUSHI_ORDER_FLOW,
    ...(orderRequestId ? { sushi_order_request_id: orderRequestId } : {}),
  }

  const desiredLines = buildDesiredFoodLinesFromSnapshot(
    snapshot,
    orderRequestId,
    metadata,
  )

  if (!desiredLines.length) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "items.id",
      "items.variant_id",
      "items.quantity",
      "items.unit_price",
      "items.variant_sku",
      "items.metadata",
    ],
    filters: { id: cartId },
  })

  const currentItems = (carts?.[0]?.items ?? []) as Array<{
    id?: string
    variant_id?: string
    quantity?: number
    unit_price?: number
    variant_sku?: string | null
    metadata?: Record<string, unknown>
  }>

  const foodItems = currentItems.filter(
    (item) => item?.id && !isSushiDeliveryFeeLine(item),
  )

  const desiredMap = groupFoodQuantitiesByVariant(desiredLines)
  const currentMap = groupFoodQuantitiesByVariant(foodItems)

  if (foodLineQuantitiesMatch(desiredMap, currentMap)) {
    return
  }

  const foodLineIds = foodItems
    .map((item) => item.id)
    .filter((id): id is string => typeof id === "string")

  if (foodLineIds.length) {
    await deleteLineItemsWorkflow(container).run({
      input: { cart_id: cartId, ids: foodLineIds },
    })
  }

  await addToCartWorkflow(container).run({
    input: {
      cart_id: cartId,
      items: desiredLines.map((line) => ({
        variant_id: line.variant_id,
        quantity: line.quantity,
        metadata: line.metadata,
      })),
    },
  })
}

export async function syncSushiPaymentCartFoodPrices(
  container: MedusaContainer,
  cartId: string,
  cartSnapshot?: unknown,
  orderRequestId?: string | null,
): Promise<void> {
  if (cartSnapshot) {
    await rebuildSushiPaymentCartFoodLines(
      container,
      cartId,
      cartSnapshot,
      orderRequestId,
    )
  }
}
