import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { SUSHI_DELIVERY_MODULE } from "../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../modules/sushi-delivery/service"

const updateSchema = z.object({
  status: z.enum(["confirmed", "rejected", "cancelled"]),
  rejection_reason: z.string().optional(),
})

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const parsed = updateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  const request = await svc.updateSushiOrderRequests({
    id: req.params.id,
    status: parsed.data.status,
    rejection_reason: parsed.data.rejection_reason ?? null,
  })

  res.status(200).json({ order_request: request })
}
