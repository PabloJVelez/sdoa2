import { model } from "@medusajs/framework/utils"

export const SushiOrderRequest = model.define("sushi_order_request", {
  id: model.id().primaryKey(),
  status: model
    .enum(["pending_confirmation", "confirmed", "rejected", "cancelled"])
    .default("pending_confirmation"),
  customer_email: model.text(),
  customer_name: model.text().nullable(),
  customer_phone: model.text().nullable(),
  fulfillment_type: model.enum(["pickup", "delivery"]).default("delivery"),
  scheduled_at: model.dateTime(),
  delivery_address: model.text().nullable(),
  delivery_miles: model.float().nullable(),
  delivery_fee_cents: model.number().nullable(),
  cart_snapshot: model.json(),
  notes: model.text().nullable(),
  rejection_reason: model.text().nullable(),
})

export default SushiOrderRequest
