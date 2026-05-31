import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getSushiOrderRequestWarnings } from "../../../lib/sushi"
import { SUSHI_DELIVERY_MODULE } from "../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../modules/sushi-delivery/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const requests = await svc.listSushiOrderRequests(
    {},
    { order: { created_at: "DESC" } },
  )

  const order_requests = await Promise.all(
    requests.map(async (request) => {
      if (request.status !== "pending_confirmation") {
        return request
      }

      const warnings = await getSushiOrderRequestWarnings(
        req.scope,
        request.cart_snapshot,
      )

      return {
        ...request,
        warnings,
      }
    }),
  )

  res.status(200).json({ order_requests })
}
