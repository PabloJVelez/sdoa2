import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { SUSHI_DELIVERY_MODULE } from "../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../modules/sushi-delivery/service"

const schema = z.object({
  order_request_id: z.string().min(1),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parsed = schema.safeParse(req.query)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const request = await svc.retrieveSushiOrderRequest(parsed.data.order_request_id)

  res.status(200).json({ order_request: request })
}
