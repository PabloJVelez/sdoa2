import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  ensureSushiCartShippingMethod,
  SUSHI_ORDER_FLOW,
  type SushiFulfillmentType,
} from "../../../../lib/sushi"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  if (!cartId) {
    return res.status(400).json({ message: "Cart id is required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata"],
    filters: { id: cartId },
  })

  const cart = carts?.[0]
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" })
  }

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  if (metadata.order_flow !== SUSHI_ORDER_FLOW) {
    return res.status(400).json({ message: "Cart is not a sushi checkout cart" })
  }

  const fulfillmentType = metadata.sushi_fulfillment_type
  if (fulfillmentType !== "pickup" && fulfillmentType !== "delivery") {
    return res
      .status(400)
      .json({ message: "Sushi fulfillment type is not set on this cart" })
  }

  await ensureSushiCartShippingMethod(
    req.scope,
    cartId,
    fulfillmentType as SushiFulfillmentType,
  )

  const { data: updated } = await query.graph({
    entity: "cart",
    fields: ["*", "shipping_methods.*"],
    filters: { id: cartId },
  })

  res.status(200).json({ cart: updated?.[0] })
}
