import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { getSushiOrderRequestWarnings } from "../../../../../lib/sushi"
import { SUSHI_DELIVERY_MODULE } from "../../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../../modules/sushi-delivery/service"
import { acceptSushiOrderRequestWorkflow } from "../../../../../workflows/accept-sushi-order-request"

const schema = z
  .object({
    delivery_fee_dollars: z.number().min(0).optional(),
    delivery_fee_cents: z.number().int().min(0).optional(),
    send_payment_email: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.delivery_fee_dollars != null || data.delivery_fee_cents != null,
    { message: "delivery_fee_dollars or delivery_fee_cents is required" },
  )

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  const delivery_fee_cents =
    parsed.data.delivery_fee_cents ??
    Math.round((parsed.data.delivery_fee_dollars ?? 0) * 100)

  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const existing = await svc.retrieveSushiOrderRequest(req.params.id)
  const warnings = await getSushiOrderRequestWarnings(
    req.scope,
    existing.cart_snapshot,
  )

  const { result } = await acceptSushiOrderRequestWorkflow(req.scope).run({
    input: {
      order_request_id: req.params.id,
      delivery_fee_cents,
      send_payment_email: parsed.data.send_payment_email,
    },
  })

  res.status(200).json({
    order_request: result.order_request,
    warnings,
  })
}
