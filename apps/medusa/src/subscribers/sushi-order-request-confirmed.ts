import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { CreateNotificationDTO } from "@medusajs/types"
import { DateTime } from "luxon"
import {
  buildSushiPaymentCheckoutUrl,
  formatSushiScheduledAt,
  formatUsdFromCents,
  resolveChefBrandContact,
  splitCustomerName,
} from "../lib/sushi/email-helpers"
import { resolveOrderRequestFoodSubtotalCents } from "../lib/sushi/cart-snapshot"
import { SUSHI_DELIVERY_MODULE } from "../modules/sushi-delivery"
import type SushiDeliveryModuleService from "../modules/sushi-delivery/service"

type EventData = {
  order_request_id: string
  send_payment_email?: boolean
}

export default async function sushiOrderRequestConfirmedHandler({
  event: { data },
  container,
}: SubscriberArgs<EventData>) {
  if (data.send_payment_email === false) {
    return
  }

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
  const foodSubtotal = resolveOrderRequestFoodSubtotalCents(request)
  const deliveryFee = request.delivery_fee_cents ?? 0

  await notificationService.createNotifications({
    to: request.customer_email,
    channel: "email",
    template: "sushi-order-request-confirmed",
    data: {
      customer: {
        ...customerName,
        email: request.customer_email,
        phone: request.customer_phone ?? "Not provided",
      },
      order: {
        scheduled_at: formatSushiScheduledAt(request.scheduled_at),
        delivery_address: request.delivery_address ?? "Not provided",
        food_subtotal: formatUsdFromCents(foodSubtotal),
        delivery_fee: formatUsdFromCents(deliveryFee),
        total: formatUsdFromCents(foodSubtotal + deliveryFee),
        status: "CONFIRMED",
      },
      payment: {
        checkout_url: buildSushiPaymentCheckoutUrl(request.id),
      },
      chef,
      requestReference: request.id.slice(0, 8).toUpperCase(),
      acceptanceDate: DateTime.now().toFormat("LLL d, yyyy"),
      emailType: "customer_acceptance",
    },
  } as CreateNotificationDTO)

  logger.info(
    `Sushi order confirmation email sent to ${request.customer_email}`,
  )
}

export const config: SubscriberConfig = {
  event: "sushi-order-request.confirmed",
}
