import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"
import { prepareSushiPaymentCart } from "../../../../../../lib/sushi/prepare-payment-cart"

async function clearPendingPaymentSessions(
  scope: MedusaRequest["scope"],
  cartId: string,
): Promise<void> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.status",
    ],
    filters: { id: cartId },
  })

  const sessions =
    carts?.[0]?.payment_collection?.payment_sessions ?? []

  const pendingIds = sessions
    .filter(
      (session) =>
        session?.status === "pending" && typeof session.id === "string",
    )
    .map((session) => session.id as string)

  if (!pendingIds.length) {
    return
  }

  await deletePaymentSessionsWorkflow(scope).run({
    input: { ids: pendingIds },
  })
}

type PrepareCheckoutBody = {
  refresh_payment_sessions?: boolean
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  if (!cartId) {
    return res.status(400).json({ message: "Cart id is required" })
  }

  const body = (req.body ?? {}) as PrepareCheckoutBody

  try {
    await prepareSushiPaymentCart(req.scope, cartId)
    if (body.refresh_payment_sessions === true) {
      await clearPendingPaymentSessions(req.scope, cartId)
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to prepare sushi checkout"
    return res.status(400).json({ message })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: updated } = await query.graph({
    entity: "cart",
    fields: ["*", "shipping_methods.*", "items.*"],
    filters: { id: cartId },
  })

  res.status(200).json({ cart: updated?.[0] })
}
