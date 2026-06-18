import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { CreateNotificationDTO } from "@medusajs/types"
import {
  formatSushiScheduledAt,
  formatUsdFromCents,
  resolveAdminBaseUrl,
  resolveChefBrandContact,
  splitCustomerName,
} from "../lib/sushi/email-helpers"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"

type EventData = {
  order_request_id: string
}

export default async function sushiOrderRequestCreatedHandler({
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
  const adminReviewUrl = `${resolveAdminBaseUrl().replace(/\/$/, "")}/sushi-delivery-requests`

  const emailData = {
    customer: {
      ...customerName,
      email: request.customer_email,
      phone: request.customer_phone ?? "Not provided",
    },
    order: {
      scheduled_at: formatSushiScheduledAt(request.scheduled_at),
      delivery_address: request.delivery_address ?? "Not provided",
      subtotal: formatUsdFromCents(request.subtotal_cents),
      status: "PENDING REVIEW",
    },
    chef,
    requestReference: request.id.slice(0, 8).toUpperCase(),
    adminReviewUrl,
  }

  await notificationService.createNotifications({
    to: request.customer_email,
    channel: "email",
    template: "sushi-order-request-created",
    data: {
      ...emailData,
      emailType: "customer_confirmation",
    },
  } as CreateNotificationDTO)

  const chefEmails =
    process.env.CHEF_NOTIFICATIONS_LIST?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) ?? []

  if (chefEmails.length === 0) {
    logger.warn("No chef emails configured in CHEF_NOTIFICATIONS_LIST")
    return
  }

  await Promise.all(
    chefEmails.map((to) =>
      notificationService.createNotifications({
        to,
        channel: "email",
        template: "sushi-order-request-created",
        data: {
          ...emailData,
          emailType: "chef_notification",
        },
      } as CreateNotificationDTO),
    ),
  )
}

export const config: SubscriberConfig = {
  event: "sushi-order-request.created",
}
