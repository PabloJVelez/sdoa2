import type { Client } from "@medusajs/js-sdk"
import type { AllowedDaySchedule } from "../../lib/sushi/schedule"

export interface AdminSushiDeliverySettingsDTO {
  id: string
  origin_address: string
  price_per_mile: number
  max_radius_miles: number
  allowed_days: AllowedDaySchedule[]
  enable_pickup: boolean
  enable_delivery: boolean
}

export interface AdminUpdateSushiDeliverySettingsDTO {
  origin_address?: string
  price_per_mile?: number
  max_radius_miles?: number
  allowed_days?: AllowedDaySchedule[]
  enable_pickup?: boolean
  enable_delivery?: boolean
}

export interface AdminSushiProductDTO {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string | null
  status: string
  variants?: Array<{
    id: string
    sku?: string
    inventory_quantity?: number
    prices?: Array<{ amount?: number }>
  }>
}

export class AdminSushiDeliveryResource {
  constructor(private client: Client) {}

  async getSettings() {
    const response = await this.client.fetch<{ settings: AdminSushiDeliverySettingsDTO }>(
      `/admin/sushi-delivery-settings`,
      { method: "GET" },
    )
    return response.settings
  }

  async updateSettings(data: AdminUpdateSushiDeliverySettingsDTO) {
    const response = await this.client.fetch<{ settings: AdminSushiDeliverySettingsDTO }>(
      `/admin/sushi-delivery-settings`,
      { method: "PUT", body: data },
    )
    return response.settings
  }

  async listProducts() {
    return this.client.fetch<{ products: AdminSushiProductDTO[] }>(
      `/admin/sushi-products`,
      { method: "GET" },
    )
  }

  async createProduct(data: {
    title: string
    description?: string
    price_cents: number
    inventory_quantity?: number
    thumbnail?: string | null
    status?: "draft" | "published"
  }) {
    const response = await this.client.fetch<{ product: AdminSushiProductDTO }>(
      `/admin/sushi-products`,
      { method: "POST", body: data },
    )
    return response.product
  }

  async updateProduct(
    id: string,
    data: Partial<{
      title: string
      description: string
      price_cents: number
      thumbnail: string | null
      status: "draft" | "published"
      inventory_quantity: number
    }>,
  ) {
    const response = await this.client.fetch<{ product: AdminSushiProductDTO }>(
      `/admin/sushi-products/${id}`,
      { method: "PUT", body: data },
    )
    return response.product
  }

  async listOrderRequests() {
    return this.client.fetch<{ order_requests: unknown[] }>(
      `/admin/sushi-order-requests`,
      { method: "GET" },
    )
  }

  async updateOrderRequest(
    id: string,
    data: { status: "confirmed" | "rejected" | "cancelled"; rejection_reason?: string },
  ) {
    const response = await this.client.fetch<{ order_request: unknown }>(
      `/admin/sushi-order-requests/${id}`,
      { method: "PUT", body: data },
    )
    return response.order_request
  }
}
