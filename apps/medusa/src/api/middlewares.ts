import {
  defineMiddlewares,
  errorHandler,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import * as Sentry from "@sentry/node"
import { isSushiDeliveryFeeLine } from "../lib/sushi/product"

let sentryInited = false
function ensureSentry() {
  if (sentryInited) return
  if (!Sentry.isInitialized()) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "",
      tracesSampleRate: 1.0,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      enableLogs: true,
      integrations: [Sentry.consoleLoggingIntegration()],
    })
  }
  sentryInited = true
}

const originalErrorHandler = errorHandler()

async function blockSushiDeliveryFeeLineItemDelete(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  if (req.method !== "DELETE") {
    return next()
  }

  const cartId = req.params.id
  const lineId = req.params.line_id

  if (!cartId || !lineId) {
    return next()
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: items } = await query.graph({
      entity: "line_item",
      fields: ["id", "metadata", "variant_sku"],
      filters: { id: lineId, cart_id: cartId },
    })

    const lineItem = items?.[0]
    if (lineItem && isSushiDeliveryFeeLine(lineItem)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Sushi delivery fee lines cannot be removed manually",
      )
    }
  } catch (error) {
    if (error instanceof MedusaError) {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }

  return next()
}

export default defineMiddlewares({
  errorHandler: (
    error: unknown,
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ) => {
    ensureSentry()
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    )
    return (
      originalErrorHandler as (
        err: unknown,
        req: MedusaRequest,
        res: MedusaResponse,
        next: MedusaNextFunction,
      ) => void
    )(error, req, res, next)
  },
  routes: [
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      middlewares: [blockSushiDeliveryFeeLineItemDelete],
    },
  ],
})
