import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { SUSHI_DELIVERY_MODULE } from "../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../modules/sushi-delivery/service"

const updateSchema = z.object({
  origin_address: z.string().optional(),
  price_per_mile: z.number().positive().optional(),
  max_radius_miles: z.number().positive().optional(),
  allowed_days: z
    .array(
      z.object({
        day: z.string(),
        windows: z.array(
          z.object({
            start: z.string(),
            end: z.string(),
          }),
        ),
      }),
    )
    .optional(),
  enable_pickup: z.boolean().optional(),
  enable_delivery: z.boolean().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const settings = await svc.getOrCreateSettings()
  res.status(200).json({ settings })
}

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

  const settings = await svc.updateSettings(parsed.data)
  res.status(200).json({ settings })
}
