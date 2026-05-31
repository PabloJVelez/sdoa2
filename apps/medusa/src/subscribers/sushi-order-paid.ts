import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { releaseSushiRequestReservations } from "../lib/sushi/inventory-reservation"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"

type OrderPlacedPayload = {
  id: string
}

type OrderRow = {
  id: string
  cart_id?: string | null
  items?: Array<{ metadata?: Record<string, unknown> | null }> | null
}

export default async function sushiOrderPaidHandler({
  event,
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const sushiSvc = container.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService

  const orderId = event.data?.id
  if (!orderId) {
    return
  }

  try {
    const { data } = (await query.graph({
      entity: "order",
      fields: ["id", "cart_id", "items.metadata"],
      filters: { id: orderId },
    })) as { data?: OrderRow[] }

    const order = data?.[0]
    if (!order) {
      return
    }

    let requestId: string | null = null

    for (const item of order.items ?? []) {
      const metadata = (item.metadata ?? {}) as Record<string, unknown>
      if (typeof metadata.sushi_order_request_id === "string") {
        requestId = metadata.sushi_order_request_id
        break
      }
    }

    if (!requestId && order.cart_id) {
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: ["metadata"],
        filters: { id: order.cart_id },
      })
      const cartMetadata = (carts?.[0]?.metadata ?? {}) as Record<string, unknown>
      if (typeof cartMetadata.sushi_order_request_id === "string") {
        requestId = cartMetadata.sushi_order_request_id
      }
    }

    if (!requestId) {
      return
    }

    const request = await sushiSvc.retrieveSushiOrderRequest(requestId)
    if (!request || request.status === "paid") {
      return
    }

    const reservationIds = Array.isArray(request.reservation_ids)
      ? (request.reservation_ids as string[])
      : null

    await releaseSushiRequestReservations(container, request.id, reservationIds)

    await sushiSvc.updateSushiOrderRequests({
      id: request.id,
      status: "paid",
      order_id: orderId,
      reservation_ids: null as never,
    })

    logger.info(
      `[sushi-order-paid] order ${orderId} linked to request ${requestId}`,
    )
  } catch (error) {
    logger.warn(
      `[sushi-order-paid] order ${orderId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
