import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "zod"
import { ensureSushiProductStoreReady } from "../../../lib/sushi/ensure-sushi-product-store"
import { getVariantAvailableQuantity } from "../../../lib/sushi/variant-inventory"
import { createSushiProductWorkflow } from "../../../workflows/create-sushi-product"

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().default(""),
  price_cents: z.number().int().positive("Price must be greater than zero"),
  inventory_quantity: z.number().int().min(0).default(0),
  images: z.array(z.string().min(1)).optional(),
  thumbnail: z.string().min(1).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "images.id",
      "images.url",
      "images.rank",
      "status",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.prices.amount",
      "variants.inventory_quantity",
    ],
  })

  const sushiProducts = (products ?? []).filter((product) => {
    const metadata = (product as { metadata?: Record<string, unknown> }).metadata
    return metadata?.order_flow === "sushi"
  })

  const enriched = await Promise.all(
    sushiProducts.map(async (product) => {
      try {
        await ensureSushiProductStoreReady(req.scope, product.id as string)
      } catch {
        // Listing should still work if repair fails for a single row.
      }

      const variants = (product as { variants?: Array<Record<string, unknown>> }).variants
      if (!variants?.length) {
        return product
      }

      const withInventory = await Promise.all(
        variants.map(async (variant) => {
          const sku = variant.sku as string | undefined
          const manageInventory = variant.manage_inventory === true
          const inventory_quantity =
            sku && manageInventory
              ? await getVariantAvailableQuantity(req.scope, { variantSku: sku })
              : (variant.inventory_quantity as number | undefined)

          return { ...variant, inventory_quantity }
        }),
      )

      return { ...product, variants: withInventory }
    }),
  )

  res.status(200).json({ products: enriched })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  try {
    const { result } = await createSushiProductWorkflow(req.scope).run({
      input: parsed.data,
    })

    res.status(201).json({ product: result })
  } catch (error) {
    const message =
      error instanceof MedusaError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to create sushi product"

    const status =
      error instanceof MedusaError &&
      (error.type === MedusaError.Types.INVALID_DATA ||
        error.type === MedusaError.Types.NOT_ALLOWED)
        ? 400
        : 500

    res.status(status).json({ message })
  }
}
