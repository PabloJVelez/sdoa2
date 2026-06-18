import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { releaseSushiRequestReservations } from "../lib/sushi/inventory-reservation"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"

const PENDING_EXPIRY_MS = 48 * 60 * 60 * 1000

export default async function expireSushiOrderRequestsJob(
  container: MedusaContainer,
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const sushiSvc = container.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService

  const cutoff = new Date(Date.now() - PENDING_EXPIRY_MS)
  const pending = await sushiSvc.listSushiOrderRequests(
    { status: "pending_confirmation" },
    { take: 500, order: { created_at: "ASC" } },
  )

  let expiredCount = 0

  for (const request of pending) {
    const createdAt =
      request.created_at instanceof Date
        ? request.created_at
        : new Date(String(request.created_at ?? 0))

    if (Number.isNaN(createdAt.getTime()) || createdAt > cutoff) {
      continue
    }

    const reservationIds = Array.isArray(request.reservation_ids)
      ? (request.reservation_ids as string[])
      : null

    await releaseSushiRequestReservations(container, request.id, reservationIds)

    await sushiSvc.updateSushiOrderRequests({
      id: request.id,
      status: "expired",
      reservation_ids: null as never,
    })

    expiredCount += 1
  }

  if (expiredCount > 0) {
    logger.info(
      `[job:expire-sushi-order-requests] expired ${expiredCount} pending request(s)`,
    )
  }
}

export const config = {
  name: "expire-sushi-order-requests",
  schedule: "0 * * * *",
}
