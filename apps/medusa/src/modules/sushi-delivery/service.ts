import { MedusaService } from "@medusajs/framework/utils"
import { DEFAULT_ALLOWED_DAYS, type AllowedDaySchedule } from "../../lib/sushi/schedule"
import SushiDeliverySettings from "./models/sushi-delivery-settings"
import SushiOrderRequest from "./models/sushi-order-request"

export type SushiDeliverySettingsDTO = {
  id: string
  origin_address: string
  pickup_address: string
  store_timezone: string
  price_per_mile: number
  max_radius_miles: number
  allowed_days: AllowedDaySchedule[]
  allowed_time_windows: unknown | null
  enable_pickup: boolean
  enable_delivery: boolean
}

const DEFAULT_SETTINGS = {
  origin_address: "",
  pickup_address: "",
  store_timezone: "America/Chicago",
  price_per_mile: 2,
  max_radius_miles: 15,
  allowed_days: DEFAULT_ALLOWED_DAYS,
  allowed_time_windows: null,
  enable_pickup: true,
  enable_delivery: true,
}

class SushiDeliveryModuleService extends MedusaService({
  SushiDeliverySettings,
  SushiOrderRequest,
}) {
  async getOrCreateSettings(): Promise<SushiDeliverySettingsDTO> {
    const existing = await this.listSushiDeliverySettings({}, { take: 1 })
    if (existing[0]) {
      return existing[0] as unknown as SushiDeliverySettingsDTO
    }

    const created = await this.createSushiDeliverySettings(DEFAULT_SETTINGS as never)
    return created as unknown as SushiDeliverySettingsDTO
  }

  async updateSettings(
    data: Partial<Omit<SushiDeliverySettingsDTO, "id">>,
  ): Promise<SushiDeliverySettingsDTO> {
    const current = await this.getOrCreateSettings()
    const updated = await this.updateSushiDeliverySettings({
      id: current.id,
      ...data,
    } as never)
    return updated as unknown as SushiDeliverySettingsDTO
  }
}

export default SushiDeliveryModuleService
