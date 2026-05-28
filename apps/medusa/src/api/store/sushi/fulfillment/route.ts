import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  deleteLineItemsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  calculateDeliveryFeeCents,
  computeDrivingDistanceMiles,
  isWithinDeliveryRadius,
  SUSHI_DELIVERY_FEE_LINE_KIND,
  SUSHI_ORDER_FLOW,
  validateScheduledSlot,
} from "../../../../lib/sushi"
import { SUSHI_DELIVERY_MODULE } from "../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../modules/sushi-delivery/service"
import { upsertSushiDeliveryFeeLineWorkflow } from "../../../../workflows/upsert-sushi-delivery-fee-line"

const schema = z.object({
  cart_id: z.string().min(1),
  fulfillment_type: z.enum(["pickup", "delivery"]),
  scheduled_at: z.string().min(1),
  delivery_address: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
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

  const scheduleCheck = validateScheduledSlot(
    parsed.data.scheduled_at,
    settings.allowed_days as never,
  )
  if (!scheduleCheck.valid) {
    return res.status(400).json({ message: scheduleCheck.reason })
  }

  if (parsed.data.fulfillment_type === "pickup" && !settings.enable_pickup) {
    return res.status(400).json({ message: "Pickup is not currently available" })
  }
  if (
    parsed.data.fulfillment_type === "delivery" &&
    !settings.enable_delivery
  ) {
    return res
      .status(400)
      .json({ message: "Delivery is not currently available" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata", "items.id", "items.metadata"],
    filters: { id: parsed.data.cart_id },
  })
  const cart = carts?.[0]
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" })
  }

  let deliveryMiles: number | null = null
  let deliveryFeeCents: number | null = null
  let inRange = true

  if (parsed.data.fulfillment_type === "delivery") {
    const address = parsed.data.delivery_address?.trim()
    if (!address) {
      return res.status(400).json({ message: "Delivery address is required" })
    }

    const distance = await computeDrivingDistanceMiles(
      settings.origin_address,
      address,
    )
    if (!distance.ok) {
      return res.status(502).json({ message: distance.error })
    }

    deliveryMiles = distance.miles
    deliveryFeeCents = calculateDeliveryFeeCents(
      distance.miles,
      settings.price_per_mile,
    )
    inRange = isWithinDeliveryRadius(
      distance.miles,
      settings.max_radius_miles,
    )

    if (!inRange) {
      const feeLineIds =
        (cart.items ?? [])
          .filter((item) => {
            if (!item?.id) return false
            const metadata = item.metadata as Record<string, unknown> | null | undefined
            return metadata?.kind === SUSHI_DELIVERY_FEE_LINE_KIND
          })
          .map((item) => item!.id) ?? []

      if (feeLineIds.length) {
        await deleteLineItemsWorkflow(req.scope).run({
          input: { cart_id: parsed.data.cart_id, ids: feeLineIds },
        })
      }

      const orderRequest = await svc.createSushiOrderRequests({
        status: "pending_confirmation",
        customer_email: parsed.data.customer_email ?? "guest@pending.local",
        customer_name: parsed.data.customer_name ?? null,
        customer_phone: parsed.data.customer_phone ?? null,
        fulfillment_type: "delivery",
        scheduled_at: new Date(parsed.data.scheduled_at),
        delivery_address: address,
        delivery_miles: deliveryMiles,
        delivery_fee_cents: deliveryFeeCents,
        cart_snapshot: cart,
        notes: "Out of delivery radius — awaiting chef confirmation",
      })

      await updateCartWorkflow(req.scope).run({
        input: {
          id: parsed.data.cart_id,
          metadata: {
            order_flow: SUSHI_ORDER_FLOW,
            sushi_fulfillment_type: "delivery",
            sushi_scheduled_at: parsed.data.scheduled_at,
            delivery_address: address,
            delivery_miles: deliveryMiles,
            delivery_fee_cents: deliveryFeeCents,
            delivery_out_of_range: true,
            sushi_order_request_id: orderRequest.id,
          },
        },
      })

      return res.status(200).json({
        in_range: false,
        order_request_id: orderRequest.id,
        miles: deliveryMiles,
        delivery_fee_cents: deliveryFeeCents,
      })
    }

    await upsertSushiDeliveryFeeLineWorkflow(req.scope).run({
      input: {
        cart_id: parsed.data.cart_id,
        delivery_fee_cents: deliveryFeeCents,
      },
    })
  } else {
    const feeLineIds = (cart.items ?? [])
      .filter((item) => {
        if (!item?.id) return false
        const metadata = item.metadata as Record<string, unknown> | null | undefined
        return metadata?.kind === SUSHI_DELIVERY_FEE_LINE_KIND
      })
      .map((item) => item!.id)

    if (feeLineIds.length) {
      await deleteLineItemsWorkflow(req.scope).run({
        input: { cart_id: parsed.data.cart_id, ids: feeLineIds },
      })
    }
  }

  const { result: updatedCart } = await updateCartWorkflow(req.scope).run({
    input: {
      id: parsed.data.cart_id,
      metadata: {
        order_flow: SUSHI_ORDER_FLOW,
        sushi_fulfillment_type: parsed.data.fulfillment_type,
        sushi_scheduled_at: parsed.data.scheduled_at,
        delivery_address: parsed.data.delivery_address ?? null,
        delivery_miles: deliveryMiles,
        delivery_fee_cents: deliveryFeeCents,
        delivery_out_of_range: false,
      },
    },
  })

  res.status(200).json({
    in_range: inRange,
    cart: updatedCart,
    miles: deliveryMiles,
    delivery_fee_cents: deliveryFeeCents,
  })
}
