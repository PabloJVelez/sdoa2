import type { ExecArgs } from "@medusajs/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUSHI_DELIVERY_FEE_SKU } from "../lib/sushi/constants"

/**
 * One-time migration: sushi product prices were stored as integer cents (25000)
 * but Medusa expects major currency units (250), matching the chef event flow.
 */
export default async function migrateSushiPricesToMajorUnits({
  container,
}: Pick<ExecArgs, "container">) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.prices.id",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
  })

  let updated = 0

  for (const product of products ?? []) {
    const row = product as {
      id?: string
      metadata?: Record<string, unknown>
      variants?: Array<{
        id?: string
        sku?: string
        prices?: Array<{ id?: string; amount?: number; currency_code?: string }>
      }>
    }

    if (row.metadata?.order_flow !== "sushi" || row.metadata?.is_system_product === true) {
      continue
    }

    const variantsToUpdate: Array<{
      id: string
      prices: Array<{ id?: string; currency_code: string; amount: number }>
    }> = []

    for (const variant of row.variants ?? []) {
      if (!variant.id || variant.sku === SUSHI_DELIVERY_FEE_SKU) {
        continue
      }

      const prices = (variant.prices ?? [])
        .map((price) => {
          const amount = Number(price.amount ?? 0)
          if (!Number.isFinite(amount) || amount < 1000) {
            return null
          }

          const major = Math.round(amount) / 100
          if (major === amount) {
            return null
          }

          return {
            id: price.id,
            currency_code: price.currency_code ?? "usd",
            amount: major,
          }
        })
        .filter((price): price is NonNullable<typeof price> => price !== null)

      if (prices.length) {
        variantsToUpdate.push({ id: variant.id, prices })
      }
    }

    if (!row.id || !variantsToUpdate.length) {
      continue
    }

    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: row.id,
            variants: variantsToUpdate,
          },
        ],
      },
    })

    updated += variantsToUpdate.length
    logger.info(
      `[migrate-sushi-prices] Updated ${variantsToUpdate.length} variant(s) on product ${row.id}`,
    )
  }

  logger.info(`[migrate-sushi-prices] Updated ${updated} sushi variant price(s)`)
}
