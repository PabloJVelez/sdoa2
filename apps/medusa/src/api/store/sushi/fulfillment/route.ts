import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  deleteLineItemsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { z } from "zod"
import {
  buildCartSnapshot,
  computeFoodSubtotalCents,
  ensureSushiCartShippingMethod,
  reserveSushiCartInventory,
  SUSHI_DELIVERY_FEE_LINE_KIND,
  SUSHI_ORDER_FLOW,
  validateScheduledSlot,
} from "../../../../lib/sushi"
import { SUSHI_DELIVERY_MODULE } from "../../../../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../../../../modules/sushi-delivery/service"

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
    fields: [
      "id",
      "email",
      "currency_code",
      "region_id",
      "metadata",
      "shipping_address.*",
      "billing_address.*",
      "items.id",
      "items.variant_id",
      "items.quantity",
      "items.unit_price",
      "items.title",
      "items.product_title",
      "items.variant_sku",
      "items.metadata",
    ],
    filters: { id: parsed.data.cart_id },
  })
  const cart = carts?.[0]
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" })
  }

  if (parsed.data.fulfillment_type === "pickup") {
    const feeLineIds =
      (cart.items ?? [])
        .filter((item) => {
          if (!item?.id) return false
          const metadata = item.metadata as
            | Record<string, unknown>
            | null
            | undefined
          return metadata?.kind === SUSHI_DELIVERY_FEE_LINE_KIND
        })
        .map((item) => item!.id) ?? []

    if (feeLineIds.length) {
      await deleteLineItemsWorkflow(req.scope).run({
        input: { cart_id: parsed.data.cart_id, ids: feeLineIds },
      })
    }

    const { result: updatedCart } = await updateCartWorkflow(req.scope).run({
      input: {
        id: parsed.data.cart_id,
        metadata: {
          order_flow: SUSHI_ORDER_FLOW,
          sushi_fulfillment_type: "pickup",
          sushi_scheduled_at: parsed.data.scheduled_at,
          delivery_address: null,
          delivery_miles: null,
          delivery_fee_cents: null,
          delivery_out_of_range: false,
          sushi_order_request_id: null,
        },
      },
    })

    await ensureSushiCartShippingMethod(req.scope, parsed.data.cart_id, "pickup")

    const { data: cartsAfter } = await query.graph({
      entity: "cart",
      fields: ["*", "items.*", "shipping_methods.*"],
      filters: { id: parsed.data.cart_id },
    })

    return res.status(200).json({
      cart: cartsAfter?.[0] ?? updatedCart,
    })
  }

  const address = parsed.data.delivery_address?.trim()
  if (!address) {
    return res.status(400).json({ message: "Delivery address is required" })
  }

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

  const snapshot = buildCartSnapshot(cart as Parameters<typeof buildCartSnapshot>[0])
  const subtotalCents = computeFoodSubtotalCents(snapshot.items ?? [])

  const orderRequest = await svc.createSushiOrderRequests({
    status: "pending_confirmation",
    customer_email: parsed.data.customer_email ?? cart.email ?? "guest@pending.local",
    customer_name: parsed.data.customer_name ?? null,
    customer_phone: parsed.data.customer_phone ?? null,
    fulfillment_type: "delivery",
    scheduled_at: new Date(parsed.data.scheduled_at),
    delivery_address: address,
    delivery_miles: null,
    delivery_fee_cents: null,
    subtotal_cents: subtotalCents,
    cart_snapshot: snapshot,
    notes: null,
  })

  const reservationIds = await reserveSushiCartInventory(req.scope, {
    cartId: parsed.data.cart_id,
    requestId: orderRequest.id,
    items: (snapshot.items ?? [])
      .filter(
        (item): item is { variant_id: string; quantity: number } =>
          typeof item.variant_id === "string" && item.variant_id.length > 0,
      )
      .map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
  })

  if (reservationIds.length) {
    await svc.updateSushiOrderRequests({
      id: orderRequest.id,
      reservation_ids: reservationIds as never,
    })
  }

  await updateCartWorkflow(req.scope).run({
    input: {
      id: parsed.data.cart_id,
      metadata: {
        order_flow: SUSHI_ORDER_FLOW,
        sushi_fulfillment_type: "delivery",
        sushi_scheduled_at: parsed.data.scheduled_at,
        delivery_address: address,
        delivery_miles: null,
        delivery_fee_cents: null,
        delivery_out_of_range: false,
        sushi_order_request_id: orderRequest.id,
      },
    },
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: "sushi-order-request.created",
    data: { order_request_id: orderRequest.id },
  })

  return res.status(200).json({
    order_request_id: orderRequest.id,
    fulfillment_type: "delivery" as const,
  })
}
