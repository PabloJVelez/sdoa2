import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  addShippingMethodToCartWorkflow,
  listShippingOptionsForCartWorkflow,
} from "@medusajs/medusa/core-flows"
import type { SushiFulfillmentType } from "./constants"

function pickShippingOptionId(
  options: Array<{ id?: string; name?: string }>,
  fulfillmentType: SushiFulfillmentType,
): string | null {
  const normalized = options.filter(
    (option): option is { id: string; name?: string } =>
      typeof option.id === "string",
  )

  if (!normalized.length) {
    return null
  }

  if (fulfillmentType === "pickup") {
    const pickup = normalized.find((option) =>
      (option.name ?? "").toLowerCase().includes("sushi pickup"),
    )
    if (pickup) {
      return pickup.id
    }
  }

  if (fulfillmentType === "delivery") {
    const delivery = normalized.find((option) =>
      (option.name ?? "").toLowerCase().includes("sushi delivery"),
    )
    if (delivery) {
      return delivery.id
    }
  }

  const standard = normalized.find((option) =>
    (option.name ?? "").toLowerCase().includes("standard"),
  )
  if (standard) {
    return standard.id
  }

  return normalized[0]?.id ?? null
}

export async function ensureSushiCartShippingMethod(
  container: MedusaContainer,
  cartId: string,
  fulfillmentType: SushiFulfillmentType,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "shipping_methods.id", "shipping_methods.name"],
    filters: { id: cartId },
  })

  const cart = carts?.[0] as
    | {
        shipping_methods?: Array<{ id?: string; name?: string }>
      }
    | undefined

  if (cart?.shipping_methods?.length) {
    return
  }

  const { result: shippingOptions } = await listShippingOptionsForCartWorkflow(
    container,
  ).run({
    input: { cart_id: cartId },
  })

  const optionId = pickShippingOptionId(
    (shippingOptions ?? []) as Array<{ id?: string; name?: string }>,
    fulfillmentType,
  )

  if (!optionId) {
    throw new Error("No shipping option available for sushi checkout")
  }

  await addShippingMethodToCartWorkflow(container).run({
    input: {
      cart_id: cartId,
      options: [{ id: optionId }],
    },
  })
}
