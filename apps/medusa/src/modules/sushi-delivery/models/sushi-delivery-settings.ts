import { model } from "@medusajs/framework/utils"

export const SushiDeliverySettings = model.define("sushi_delivery_settings", {
  id: model.id().primaryKey(),
  origin_address: model.text().default(""),
  price_per_mile: model.float().default(2),
  max_radius_miles: model.float().default(15),
  allowed_days: model.json().nullable(),
  allowed_time_windows: model.json().nullable(),
  enable_pickup: model.boolean().default(true),
  enable_delivery: model.boolean().default(true),
})

export default SushiDeliverySettings
