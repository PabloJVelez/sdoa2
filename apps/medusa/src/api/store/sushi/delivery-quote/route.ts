import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import {
  calculateDeliveryFeeCents,
  computeDrivingDistanceMiles,
  isWithinDeliveryRadius,
} from "../../../../lib/sushi"
import { SUSHI_DELIVERY_MODULE } from "../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../modules/sushi-delivery/service"

const schema = z.object({
  delivery_address: z.string().min(5),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const settings = await svc.getOrCreateSettings()

  if (!settings.origin_address.trim()) {
    return res.status(400).json({
      message: "Pickup origin address is not configured yet",
    })
  }

  const distance = await computeDrivingDistanceMiles(
    settings.origin_address,
    parsed.data.delivery_address,
  )

  if (!distance.ok) {
    return res.status(502).json({ message: distance.error })
  }

  const inRange = isWithinDeliveryRadius(
    distance.miles,
    settings.max_radius_miles,
  )
  const deliveryFeeCents = calculateDeliveryFeeCents(
    distance.miles,
    settings.price_per_mile,
  )

  res.status(200).json({
    miles: distance.miles,
    delivery_fee_cents: deliveryFeeCents,
    price_per_mile: settings.price_per_mile,
    max_radius_miles: settings.max_radius_miles,
    in_range: inRange,
  })
}
