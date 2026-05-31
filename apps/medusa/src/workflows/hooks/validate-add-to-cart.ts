import { MedusaError } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getSystemChargeVariantId } from "../../lib/system-charge-variant"
import {
  cartContainsEventItems,
  cartContainsSushiItems,
} from "../../lib/sushi/product"
import { SUSHI_DELIVERY_FEE_LINE_KIND } from "../../lib/sushi/constants"
import { getSushiDeliveryFeeVariantId } from "../../lib/sushi/delivery-fee-variant"

const CHARGE_LINE_KIND = "chef_event_additional_charge"

type IncomingItem = {
  variant_id?: string | null
  quantity?: number
  metadata?: Record<string, unknown> | null
}

type ExistingItem = {
  variant_sku?: string | null
  metadata?: Record<string, unknown> | null
}

addToCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const incomingItems = (
    (input as { items?: IncomingItem[] | null })?.items ?? []
  ).filter((item): item is IncomingItem => !!item)
  if (incomingItems.length === 0) {
    return
  }

  const existingItems = (
    (cart as { items?: ExistingItem[] | null })?.items ?? []
  ).filter((item): item is ExistingItem => !!item)

  const existingEventIds = new Set<string>()
  for (const item of existingItems) {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>
    const eventId =
      typeof metadata.chef_event_id === "string"
        ? metadata.chef_event_id
        : null
    const isEventTicket =
      typeof item.variant_sku === "string" &&
      item.variant_sku.startsWith("EVENT-")
    if (isEventTicket && eventId) {
      existingEventIds.add(eventId)
      continue
    }
    if (metadata.kind === CHARGE_LINE_KIND && eventId) {
      existingEventIds.add(eventId)
    }
  }

  const systemChargeVariantId = await getSystemChargeVariantId(container)
  const sushiDeliveryFeeVariantId = await getSushiDeliveryFeeVariantId(container)
  const hasEventItems = cartContainsEventItems(existingItems)
  const hasSushiItems = cartContainsSushiItems(existingItems)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const incomingVariantIds = incomingItems
    .map((item) => item.variant_id)
    .filter((id): id is string => typeof id === "string")

  let incomingIncludesSushi = false
  if (incomingVariantIds.length) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "product.metadata"],
      filters: { id: incomingVariantIds },
    })
    incomingIncludesSushi = (variants ?? []).some((variant) => {
      const metadata = (variant as { product?: { metadata?: Record<string, unknown> } })
        .product?.metadata
      return metadata?.order_flow === "sushi"
    })
  }

  for (const item of incomingItems) {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>
    const isChargeLine =
      metadata.kind === CHARGE_LINE_KIND ||
      (systemChargeVariantId !== null &&
        item.variant_id === systemChargeVariantId)
    const isDeliveryFeeLine =
      metadata.kind === SUSHI_DELIVERY_FEE_LINE_KIND ||
      (sushiDeliveryFeeVariantId !== null &&
        item.variant_id === sushiDeliveryFeeVariantId)

    if (isDeliveryFeeLine) {
      if (!hasSushiItems && !incomingIncludesSushi) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Delivery fee lines are only allowed in sushi carts",
        )
      }
      continue
    }

    if (isChargeLine) {
      if (item.variant_id !== systemChargeVariantId) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Additional charge lines must use the system charge variant",
        )
      }
      if (
        metadata.kind !== CHARGE_LINE_KIND ||
        metadata.via_event_checkout !== true
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Additional charge lines can only be added through event checkout initialization",
        )
      }
      if (item.quantity !== 1) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Additional charge quantity must always be 1",
        )
      }
    }

    const incomingEventId =
      typeof metadata.chef_event_id === "string"
        ? metadata.chef_event_id
        : null

    if (incomingIncludesSushi && (hasEventItems || existingEventIds.size > 0)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "SUSHI_EVENT_CART_CONFLICT",
      )
    }

    if (
      (hasSushiItems || incomingIncludesSushi) &&
      (hasEventItems || existingEventIds.size > 0 || incomingEventId)
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "SUSHI_EVENT_CART_CONFLICT",
      )
    }

    if (existingEventIds.size === 0) {
      continue
    }
    if (!incomingEventId) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Event checkout carts cannot be mixed with regular products",
      )
    }
    const [existingEventId] = Array.from(existingEventIds)
    if (incomingEventId !== existingEventId) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only one chef event can exist in a cart at a time",
      )
    }
  }
})
