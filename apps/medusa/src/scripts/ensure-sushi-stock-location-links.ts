import type { ExecArgs } from "@medusajs/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ensureDefaultSalesChannelStockLocationLink } from "../lib/sushi/ensure-sales-channel-stock-location"

/**
 * Ensures the store's default sales channel is linked to Main Warehouse.
 * Run this if checkout fails with:
 * "Sales channel ... is not associated with any stock location for variant ..."
 */
export default async function ensureSushiStockLocationLinks({
  container,
}: Pick<ExecArgs, "container">) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { salesChannelId, stockLocationId } =
    await ensureDefaultSalesChannelStockLocationLink(container)

  logger.info(
    `[ensure-sushi-stock-location-links] Linked sales channel ${salesChannelId} to stock location ${stockLocationId}`,
  )
}
