import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUSHI_COLLECTION_HANDLE, SUSHI_ORDER_FLOW } from "../../../../lib/sushi/constants"
import { getVariantAvailableQuantity } from "../../../../lib/sushi/variant-inventory"

function isSushiStoreProduct(product: Record<string, unknown>): boolean {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  if (metadata.is_system_product === true) return false
  if (metadata.order_flow === SUSHI_ORDER_FLOW) return true
  const collection = product.collection as { handle?: string } | undefined
  if (collection?.handle === SUSHI_COLLECTION_HANDLE) return true
  return false
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handleFilter =
    typeof req.query.handle === "string" ? req.query.handle : undefined
  const idFilter = typeof req.query.id === "string" ? req.query.id : undefined

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "status",
      "metadata",
      "collection.id",
      "collection.handle",
      "collection.title",
      "images.id",
      "images.url",
      "images.rank",
      "options.id",
      "options.title",
      "variants.id",
      "variants.sku",
      "variants.manage_inventory",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "variants.options.option_id",
      "variants.options.value",
      "sales_channels.id",
    ],
  })

  let sushiProducts = (products ?? []).filter((product) => {
    const row = product as Record<string, unknown>
    return row.status === "published" && isSushiStoreProduct(row)
  })

  if (handleFilter) {
    sushiProducts = sushiProducts.filter(
      (product) =>
        (product as { handle?: string }).handle === handleFilter,
    )
  }

  if (idFilter) {
    sushiProducts = sushiProducts.filter(
      (product) => (product as { id?: string }).id === idFilter,
    )
  }

  const enriched = await Promise.all(
    sushiProducts.map(async (product) => {
      const row = product as {
        variants?: Array<{
          id?: string
          sku?: string
          manage_inventory?: boolean
          inventory_quantity?: number
          prices?: Array<{ amount: number; currency_code: string }>
        }>
      }

      const variants = await Promise.all(
        (row.variants ?? []).map(async (variant) => {
          const sku = variant.sku
          const available =
            sku && variant.manage_inventory
              ? await getVariantAvailableQuantity(req.scope, { variantSku: sku })
              : variant.inventory_quantity ?? 0

          return {
            ...variant,
            inventory_quantity: available,
          }
        }),
      )

      return { ...row, variants }
    }),
  )

  res.status(200).json({
    products: enriched,
    count: enriched.length,
  })
}
