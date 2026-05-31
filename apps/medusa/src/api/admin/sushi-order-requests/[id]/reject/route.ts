import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { rejectSushiOrderRequestWorkflow } from "../../../../../workflows/reject-sushi-order-request"

const schema = z.object({
  rejection_reason: z.string().optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = schema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  const { result } = await rejectSushiOrderRequestWorkflow(req.scope).run({
    input: {
      order_request_id: req.params.id,
      rejection_reason: parsed.data.rejection_reason,
    },
  })

  res.status(200).json({ order_request: result.order_request })
}
