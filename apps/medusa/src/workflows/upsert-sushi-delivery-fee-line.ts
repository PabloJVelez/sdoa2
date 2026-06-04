import {
  addToCartWorkflow,
  deleteLineItemsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUSHI_DELIVERY_FEE_LINE_KIND } from "../lib/sushi/constants"
import { getSushiDeliveryFeeVariantId } from "../lib/sushi/delivery-fee-variant"
import { majorUnitsFromCents } from "../lib/sushi/pricing"

type UpsertInput = {
  cart_id: string
  delivery_fee_cents: number
}

const upsertSushiDeliveryFeeLineStep = createStep(
  "upsert-sushi-delivery-fee-line",
  async (input: UpsertInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: items } = await query.graph({
      entity: "line_item",
      fields: ["id", "metadata"],
      filters: { cart_id: input.cart_id },
    })

    const feeLineIds =
      items
        ?.filter((item) => {
          const metadata = item.metadata as Record<string, unknown> | null | undefined
          return metadata?.kind === SUSHI_DELIVERY_FEE_LINE_KIND
        })
        .map((item: { id: string }) => item.id) ?? []

    if (feeLineIds.length) {
      await deleteLineItemsWorkflow(container).run({
        input: { cart_id: input.cart_id, ids: feeLineIds },
      })
    }

    const variantId = await getSushiDeliveryFeeVariantId(container)
    if (!variantId) {
      throw new Error("Sushi delivery fee variant is not configured")
    }

    await addToCartWorkflow(container).run({
      input: {
        cart_id: input.cart_id,
        items: [
          {
            variant_id: variantId,
            quantity: 1,
            unit_price: majorUnitsFromCents(input.delivery_fee_cents),
            metadata: {
              kind: SUSHI_DELIVERY_FEE_LINE_KIND,
              order_flow: "sushi",
            },
          },
        ],
      },
    })

    const { result: cart } = await updateCartWorkflow(container).run({
      input: {
        id: input.cart_id,
        metadata: {
          delivery_fee_cents: input.delivery_fee_cents,
        },
      },
    })

    return new StepResponse(cart)
  },
)

export const upsertSushiDeliveryFeeLineWorkflow = createWorkflow(
  "upsert-sushi-delivery-fee-line",
  (input: UpsertInput) => {
    const cart = upsertSushiDeliveryFeeLineStep(input)
    return new WorkflowResponse(cart)
  },
)
