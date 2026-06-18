import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { CreateNotificationDTO } from "@medusajs/types"
import { DateTime } from "luxon"
import {
  formatSushiScheduledAt,
  resolveChefBrandContact,
  splitCustomerName,
} from "../lib/sushi/email-helpers"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"

type EventData = {
  order_request_id: string
  rejection_reason?: string
}

export default async function sushiOrderRequestRejectedHandler({
  event: { data },
  container,
}: SubscriberArgs<EventData>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const sushiSvc = container.resolve(
    SUSHI_DELIVERY_MODULE,
  ) as SushiDeliveryModuleService
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const request = await sushiSvc.retrieveSushiOrderRequest(data.order_request_id)
  if (!request) {
    logger.error(`Sushi order request not found: ${data.order_request_id}`)
    return
  }

  const chef = resolveChefBrandContact()
  const customerName = splitCustomerName(
    request.customer_name,
    request.customer_email,
  )

  await notificationService.createNotifications({
    to: request.customer_email,
    channel: "email",
    template: "sushi-order-request-rejected",
    data: {
      customer: {
        ...customerName,
        email: request.customer_email,
        phone: request.customer_phone ?? "Not provided",
      },
      order: {
        scheduled_at: formatSushiScheduledAt(request.scheduled_at),
        delivery_address: request.delivery_address ?? "Not provided",
        status: "NOT AVAILABLE",
      },
      rejection: {
        reason:
          data.rejection_reason ??
          request.rejection_reason ??
          "We are unable to fulfill this delivery request at this time.",
      },
      chef,
      requestReference: request.id.slice(0, 8).toUpperCase(),
      rejectionDate: DateTime.now().toFormat("LLL d, yyyy"),
      emailType: "customer_rejection",
    },
  } as CreateNotificationDTO)

  logger.info(`Sushi order rejection email sent to ${request.customer_email}`)
}

export const config: SubscriberConfig = {
  event: "sushi-order-request.rejected",
}
