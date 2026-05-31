import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUSHI_DELIVERY_MODULE } from "../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../modules/sushi-delivery/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const settings = await svc.getOrCreateSettings()

  res.status(200).json({
    settings: {
      enable_pickup: settings.enable_pickup,
      enable_delivery: settings.enable_delivery,
      allowed_days: settings.allowed_days,
      max_radius_miles: settings.max_radius_miles,
      price_per_mile: settings.price_per_mile,
    },
  })
}
