import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { SUSHI_ORDER_FLOW } from "../lib/sushi/constants"
import "./hooks/validate-add-to-cart"

export type CreateSushiProductInput = {
  title: string
  description: string
  price_cents: number
  inventory_quantity: number
  thumbnail?: string | null
  status?: "draft" | "published"
  handle?: string
}

const createProductStep = createStep(
  "create-sushi-product-record",
  async (input: CreateSushiProductInput, { container }) => {
    const handle =
      input.handle ??
      input.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: input.title,
            handle,
            description: input.description,
            status: input.status ?? "published",
            thumbnail: input.thumbnail ?? undefined,
            metadata: {
              order_flow: SUSHI_ORDER_FLOW,
            },
            options: [
              {
                title: "Default",
                values: ["Default"],
              },
            ],
            variants: [
              {
                title: "Default",
                sku: `SUSHI-${handle}`.slice(0, 60),
                manage_inventory: true,
                options: { Default: "Default" },
                prices: [
                  {
                    currency_code: "usd",
                    amount: input.price_cents,
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    return new StepResponse(result[0])
  },
)

export const createSushiProductWorkflow = createWorkflow(
  "create-sushi-product",
  (input: CreateSushiProductInput) => {
    const product = createProductStep(input)
    return new WorkflowResponse(product)
  },
)
