import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "zod"
import { createSushiProductWorkflow } from "../../../workflows/create-sushi-product"

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().default(""),
  price_cents: z.number().int().positive("Price must be greater than zero"),
  inventory_quantity: z.number().int().min(0).default(0),
  thumbnail: z.string().nullable().optional(),
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

  res.status(200).json({ products: sushiProducts })
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
