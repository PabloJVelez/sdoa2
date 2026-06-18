import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createReservationsWorkflow } from "@medusajs/medusa/core-flows"
import { isSushiDeliveryFeeLine } from "./product"

const MAIN_WAREHOUSE_NAME = "Main Warehouse"

type ReserveItemInput = {
  variant_id: string
  quantity: number
}

type InventoryModule = {
  listReservationItems: (
    selector: Record<string, unknown>,
    config?: { take?: number },
  ) => Promise<Array<{ id: string; external_id?: string | null }>>
  deleteReservationItems: (ids: string | string[]) => Promise<void>
}

async function resolveMainWarehouseId(
  container: { resolve: (key: string) => unknown },
): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string
      fields: string[]
    }) => Promise<{ data?: Array<{ id?: string; name?: string }> }>
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const stockLocation =
    stockLocations?.find((loc) => loc.name === MAIN_WAREHOUSE_NAME) ??
    stockLocations?.[0]

  if (!stockLocation?.id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stock location not found. Run init first.",
    )
  }
  return stockLocation.id
}

export async function reserveSushiCartInventory(
  container: MedusaContainer,
  input: {
    cartId: string
    requestId: string
    items?: ReserveItemInput[]
  },
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{
      data?: Array<{
        items?: Array<{
          variant_id?: string
          quantity?: number | string
          variant_sku?: string | null
          sku?: string | null
          metadata?: Record<string, unknown> | null
        }>
      }>
    }>
  }

  let lineItems = input.items ?? []

  if (lineItems.length === 0) {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "items.variant_id",
        "items.quantity",
        "items.variant_sku",
        "items.metadata",
      ],
      filters: { id: input.cartId },
    })
    const cartItems = carts?.[0]?.items ?? []
    lineItems = cartItems
      .filter((item) => item.variant_id && !isSushiDeliveryFeeLine(item))
      .map((item) => ({
        variant_id: String(item.variant_id),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))
  }

  if (lineItems.length === 0) {
    return []
  }

  const variantIds = [...new Set(lineItems.map((item) => item.variant_id))]
  const { data: variants } = (await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: variantIds },
  })) as {
    data?: Array<{
      id?: string
      inventory_items?: Array<{ inventory_item_id?: string }>
    }>
  }

  const inventoryByVariant = new Map<string, string>()
  for (const variant of variants ?? []) {
    const variantId = variant.id
    const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    if (typeof variantId === "string" && typeof inventoryItemId === "string") {
      inventoryByVariant.set(variantId, inventoryItemId)
    }
  }

  const locationId = await resolveMainWarehouseId(container)
  const reservations: Array<{
    inventory_item_id: string
    location_id: string
    quantity: number
    external_id: string
    description: string
    created_by: string
  }> = []

  for (const item of lineItems) {
    const inventoryItemId = inventoryByVariant.get(item.variant_id)
    if (!inventoryItemId) continue
    reservations.push({
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      quantity: item.quantity,
      external_id: input.requestId,
      description: `Sushi order request ${input.requestId}`,
      created_by: "sushi-order-request",
    })
  }

  if (reservations.length === 0) {
    return []
  }

  const { result } = await createReservationsWorkflow(container).run({
    input: { reservations },
  })

  const created = Array.isArray(result) ? result : []
  return created
    .map((row) => (typeof row?.id === "string" ? row.id : null))
    .filter((id): id is string => !!id)
}

export async function releaseSushiRequestReservations(
  container: MedusaContainer,
  requestId: string,
  reservationIds?: string[] | null,
): Promise<void> {
  const inventoryModule = container.resolve(
    Modules.INVENTORY,
  ) as InventoryModule

  let ids = (reservationIds ?? []).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  )

  if (ids.length === 0) {
    const rows = await inventoryModule.listReservationItems(
      { external_id: requestId },
      { take: 500 },
    )
    ids = rows.map((row) => row.id)
  }

  if (ids.length === 0) {
    return
  }

  await inventoryModule.deleteReservationItems(ids)
}
