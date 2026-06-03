import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  createCartWorkflow,
  emitEventStep,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import {
  ensureSushiCartShippingMethod,
  getCartSnapshotLineItems,
  parseCartSnapshot,
  resolveOrderRequestFoodSubtotalCents,
  SUSHI_ORDER_FLOW,
} from "../lib/sushi"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"
import { upsertSushiDeliveryFeeLineWorkflow } from "./upsert-sushi-delivery-fee-line"

type AcceptInput = {
  order_request_id: string
  delivery_fee_cents: number
  send_payment_email?: boolean
}

const acceptSushiOrderRequestStep = createStep(
  "accept-sushi-order-request-step",
  async (input: AcceptInput, { container }) => {
    const svc = container.resolve(
      SUSHI_DELIVERY_MODULE,
    ) as SushiDeliveryModuleService

    const request = await svc.retrieveSushiOrderRequest(input.order_request_id)

    if (request.status !== "pending_confirmation") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only pending requests can be confirmed",
      )
    }

    if (request.fulfillment_type !== "delivery") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only delivery requests use chef-confirmed fees",
      )
    }

    if (
      !Number.isFinite(input.delivery_fee_cents) ||
      input.delivery_fee_cents < 0
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Delivery fee must be zero or greater",
      )
    }

    const snapshot = parseCartSnapshot(request.cart_snapshot)
    const lineItems = getCartSnapshotLineItems(snapshot)

    if (!lineItems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Request cart snapshot has no line items",
      )
    }

    if (!snapshot.region_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Request cart snapshot is missing region",
      )
    }

    const { result: cart } = await createCartWorkflow(container).run({
      input: {
        region_id: snapshot.region_id,
        email: request.customer_email,
        metadata: {
          order_flow: SUSHI_ORDER_FLOW,
          sushi_order_request_id: request.id,
          sushi_fulfillment_type: "delivery",
          sushi_scheduled_at:
            typeof snapshot.metadata?.sushi_scheduled_at === "string"
              ? snapshot.metadata.sushi_scheduled_at
              : request.scheduled_at,
        },
      },
    })

    if (!cart?.id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to create payment cart",
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const variantIds = lineItems.map((item) => item.variant_id)
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku"],
      filters: { id: variantIds },
    })

    const variantMap = new Map<
      string,
      {
        id?: string
        sku?: string
        prices?: Array<{ amount?: number; currency_code?: string }>
      }
    >(
      (variants ?? []).map((variant) => [String(variant.id), variant as never]),
    )

    const itemsToAdd: Array<{
      variant_id: string
      quantity: number
      metadata: Record<string, unknown>
    }> = []

    for (const line of lineItems) {
      const variant = variantMap.get(line.variant_id)
      if (!variant?.id) {
        continue
      }

      itemsToAdd.push({
        variant_id: line.variant_id,
        quantity: line.quantity,
        metadata: {
          order_flow: SUSHI_ORDER_FLOW,
          sushi_order_request_id: request.id,
        },
      })
    }

    if (!itemsToAdd.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No valid variants remain for this order request",
      )
    }

    await addToCartWorkflow(container).run({
      input: {
        cart_id: cart.id,
        items: itemsToAdd,
      },
    })

    if (input.delivery_fee_cents > 0) {
      await upsertSushiDeliveryFeeLineWorkflow(container).run({
        input: {
          cart_id: cart.id,
          delivery_fee_cents: input.delivery_fee_cents,
        },
      })
    }

    const shippingAddress = snapshot.shipping_address
    if (shippingAddress && typeof shippingAddress === "object") {
      await updateCartWorkflow(container).run({
        input: {
          id: cart.id,
          shipping_address: shippingAddress as never,
          billing_address: shippingAddress as never,
        },
      })
    }

    await updateCartWorkflow(container).run({
      input: {
        id: cart.id,
        metadata: {
          order_flow: SUSHI_ORDER_FLOW,
          sushi_order_request_id: request.id,
          sushi_fulfillment_type: "delivery",
          delivery_fee_cents: input.delivery_fee_cents,
          delivery_address: request.delivery_address,
        },
      },
    })

    await ensureSushiCartShippingMethod(container, cart.id, "delivery")

    const updated = await svc.updateSushiOrderRequests({
      id: request.id,
      status: "confirmed",
      delivery_fee_cents: input.delivery_fee_cents,
      subtotal_cents: resolveOrderRequestFoodSubtotalCents({
        subtotal_cents: request.subtotal_cents,
        cart_snapshot: snapshot,
      }),
      payment_cart_id: cart.id,
      accepted_at: new Date(),
    })

    return new StepResponse({
      order_request: updated,
      payment_cart_id: cart.id,
      send_payment_email: input.send_payment_email !== false,
    })
  },
)

export const acceptSushiOrderRequestWorkflow = createWorkflow(
  "accept-sushi-order-request",
  (input: AcceptInput) => {
    const result = acceptSushiOrderRequestStep(input)

    emitEventStep({
      eventName: "sushi-order-request.confirmed",
      data: {
        order_request_id: result.order_request.id,
        payment_cart_id: result.payment_cart_id,
        send_payment_email: result.send_payment_email,
      },
    }).config({ name: "emit-sushi-order-request-confirmed" })

    return new WorkflowResponse(result)
  },
)
