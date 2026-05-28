import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
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
  res.status(200).json({ order_requests: requests })
}
