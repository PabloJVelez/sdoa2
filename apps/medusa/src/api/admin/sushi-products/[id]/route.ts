import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { z } from "zod"
import {
  resolveProductThumbnail,
  toProductImageInputs,
} from "../../../../lib/sushi/product-images"
import { ensureSushiProductStoreReady } from "../../../../lib/sushi/ensure-sushi-product-store"
import { setVariantInventoryQuantity } from "../../../../lib/sushi/variant-inventory"

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  price_cents: z.number().int().positive().optional(),
  images: z.array(z.string().min(1)).optional(),
  thumbnail: z.string().min(1).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  inventory_quantity: z.number().int().min(0).optional(),
})

const productFields = [
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
  "variants.title",
  "variants.prices.amount",
  "variants.prices.id",
  "variants.inventory_quantity",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: productFields,
    filters: { id: req.params.id },
  })

  const product = data?.[0]
  if (!product) {
    return res.status(404).json({ message: "Product not found" })
  }

  res.status(200).json({ product })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.issues })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id", "variants.sku", "variants.title", "variants.prices.id"],
    filters: { id: req.params.id },
  })

  const product = data?.[0] as {
    id: string
    variants?: Array<{
      id: string
      sku?: string
      title?: string
      prices?: Array<{ id: string }>
    }>
  }
  if (!product) {
    return res.status(404).json({ message: "Product not found" })
  }

  const variant = product.variants?.[0]
  const price = variant?.prices?.[0]
  const imageUrls = parsed.data.images
  let thumbnail: string | undefined
  if (parsed.data.thumbnail !== undefined) {
    thumbnail = parsed.data.thumbnail ?? undefined
  } else if (imageUrls !== undefined) {
    thumbnail = resolveProductThumbnail(null, imageUrls)
  }

  try {
    await updateProductsWorkflow(req.scope).run({
      input: {
        products: [
          {
            id: product.id,
            ...(parsed.data.title ? { title: parsed.data.title } : {}),
            ...(parsed.data.description !== undefined
              ? { description: parsed.data.description }
              : {}),
            ...(thumbnail !== undefined ? { thumbnail } : {}),
            ...(imageUrls !== undefined
              ? { images: toProductImageInputs(imageUrls) }
              : {}),
            ...(parsed.data.status ? { status: parsed.data.status } : {}),
            ...(variant && parsed.data.price_cents
              ? {
                  variants: [
                    {
                      id: variant.id,
                      prices: [
                        {
                          ...(price?.id ? { id: price.id } : {}),
                          currency_code: "usd",
                          amount: parsed.data.price_cents,
                        },
                      ],
                    },
                  ],
                }
              : {}),
          },
        ],
      },
    })

    if (
      variant?.id &&
      variant?.sku &&
      typeof parsed.data.inventory_quantity === "number"
    ) {
      await setVariantInventoryQuantity(req.scope, {
        variantId: variant.id,
        variantSku: variant.sku,
        variantTitle: variant.title ?? "Sushi bundle",
        quantity: parsed.data.inventory_quantity,
      })
    }

    await ensureSushiProductStoreReady(req.scope, product.id)

    const refreshed = await query.graph({
      entity: "product",
      fields: productFields,
      filters: { id: req.params.id },
    })

    res.status(200).json({ product: refreshed.data?.[0] })
  } catch (error) {
    const message =
      error instanceof MedusaError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to update sushi product"

    const status =
      error instanceof MedusaError &&
      (error.type === MedusaError.Types.INVALID_DATA ||
        error.type === MedusaError.Types.NOT_ALLOWED)
        ? 400
        : 500

    res.status(status).json({ message })
  }
}
