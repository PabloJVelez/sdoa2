import { MedusaError } from "@medusajs/framework/utils"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { releaseSushiRequestReservations } from "../lib/sushi/inventory-reservation"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"

type RejectInput = {
  order_request_id: string
  rejection_reason?: string
}

const rejectSushiOrderRequestStep = createStep(
  "reject-sushi-order-request-step",
  async (input: RejectInput, { container }) => {
    const svc = container.resolve(
      SUSHI_DELIVERY_MODULE,
    ) as SushiDeliveryModuleService

    const request = await svc.retrieveSushiOrderRequest(input.order_request_id)

    if (request.status !== "pending_confirmation") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only pending requests can be rejected",
      )
    }

    const reservationIds = Array.isArray(request.reservation_ids)
      ? (request.reservation_ids as string[])
      : null

    await releaseSushiRequestReservations(
      container,
      request.id,
      reservationIds,
    )

    const updated = await svc.updateSushiOrderRequests({
      id: request.id,
      status: "rejected",
      rejection_reason: input.rejection_reason ?? null,
      reservation_ids: null as never,
    })

    return new StepResponse({ order_request: updated })
  },
)

export const rejectSushiOrderRequestWorkflow = createWorkflow(
  "reject-sushi-order-request",
  (input: RejectInput) => {
    const result = rejectSushiOrderRequestStep(input)

    emitEventStep({
      eventName: "sushi-order-request.rejected",
      data: {
        order_request_id: result.order_request.id,
        rejection_reason: input.rejection_reason ?? null,
      },
    }).config({ name: "emit-sushi-order-request-rejected" })

    return new WorkflowResponse(result)
  },
)
