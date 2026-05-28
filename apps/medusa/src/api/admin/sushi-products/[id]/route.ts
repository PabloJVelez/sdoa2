import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { z } from "zod"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price_cents: z.number().int().positive().optional(),
  thumbnail: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  inventory_quantity: z.number().int().min(0).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "status",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.prices.*",
      "variants.inventory_quantity",
    ],
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
    fields: ["id", "variants.id", "variants.prices.id"],
    filters: { id: req.params.id },
  })

  const product = data?.[0] as {
    id: string
    variants?: Array<{ id: string; prices?: Array<{ id: string }> }>
  }
  if (!product) {
    return res.status(404).json({ message: "Product not found" })
  }

  const variant = product.variants?.[0]
  const price = variant?.prices?.[0]

  await updateProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          id: product.id,
          ...(parsed.data.title ? { title: parsed.data.title } : {}),
          ...(parsed.data.description
            ? { description: parsed.data.description }
            : {}),
          ...(parsed.data.thumbnail !== undefined
            ? { thumbnail: parsed.data.thumbnail ?? undefined }
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

  const refreshed = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "status",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.prices.amount",
      "variants.inventory_quantity",
    ],
    filters: { id: req.params.id },
  })

  res.status(200).json({ product: refreshed.data?.[0] })
}
