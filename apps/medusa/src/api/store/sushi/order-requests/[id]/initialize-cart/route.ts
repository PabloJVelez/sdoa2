import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { SUSHI_DELIVERY_MODULE } from "../../../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../../../modules/sushi-delivery/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService

  const request = await svc.retrieveSushiOrderRequest(req.params.id)

  if (request.status === "paid") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This order has already been paid",
    )
  }

  if (request.status === "expired") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This order request has expired",
    )
  }

  if (request.status !== "confirmed") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This order is not ready for payment yet",
    )
  }

  if (!request.payment_cart_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Payment cart is not available for this request",
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["*"],
    filters: { id: request.payment_cart_id },
  })

  const cart = carts?.[0]
  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Payment cart not found",
    )
  }

  res.status(200).json({
    cart,
    order_request_id: request.id,
  })
}
