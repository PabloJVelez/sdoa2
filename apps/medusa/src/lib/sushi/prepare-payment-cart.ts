import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUSHI_ORDER_FLOW, type SushiFulfillmentType } from "./constants"
import { ensureSushiCartInventoryReady } from "./ensure-sales-channel-stock-location"
import { ensureSushiDeliveryFeeVariantReady } from "./ensure-delivery-fee-variant"
import { ensureSushiCartShippingMethod } from "./ensure-sushi-cart-shipping"
import { syncSushiPaymentCartFoodPrices } from "./repair-payment-cart"
import { ensureSushiCartProductsShippingProfile, assertSushiCartShippingProfilesSatisfied } from "./shipping-profile"
import { SUSHI_DELIVERY_MODULE } from "../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../modules/sushi-delivery/service"

export async function prepareSushiPaymentCart(
  container: MedusaContainer,
  cartId: string,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata"],
    filters: { id: cartId },
  })

  const cart = carts?.[0]
  if (!cart) {
    throw new Error("Cart not found")
  }

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  if (metadata.order_flow !== SUSHI_ORDER_FLOW) {
    throw new Error("Cart is not a sushi checkout cart")
  }

  const fulfillmentType = metadata.sushi_fulfillment_type
  if (fulfillmentType !== "pickup" && fulfillmentType !== "delivery") {
    throw new Error("Sushi fulfillment type is not set on this cart")
  }

  let cartSnapshot: unknown
  let orderRequestId: string | null = null

  const requestId =
    typeof metadata.sushi_order_request_id === "string"
      ? metadata.sushi_order_request_id
      : null

  if (requestId) {
    const sushiSvc = container.resolve(
      SUSHI_DELIVERY_MODULE,
    ) as SushiDeliveryModuleService

    try {
      const request = await sushiSvc.retrieveSushiOrderRequest(requestId)
      cartSnapshot = request?.cart_snapshot
      orderRequestId = request?.id ?? requestId
    } catch {
      // Cart metadata may reference a removed request; continue without snapshot rebuild.
    }
  }

  await ensureSushiCartProductsShippingProfile(container, cartId)
  await ensureSushiDeliveryFeeVariantReady(container)
  await ensureSushiCartInventoryReady(container, cartId)
  await syncSushiPaymentCartFoodPrices(
    container,
    cartId,
    cartSnapshot,
    orderRequestId,
  )
  await ensureSushiCartShippingMethod(
    container,
    cartId,
    fulfillmentType as SushiFulfillmentType,
  )
  await assertSushiCartShippingProfilesSatisfied(container, cartId)
}
