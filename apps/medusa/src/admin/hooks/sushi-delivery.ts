import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../sdk"
import type {
  AdminSushiDeliverySettingsDTO,
  AdminUpdateSushiDeliverySettingsDTO,
} from "../../sdk/admin/admin-sushi-delivery"

const SETTINGS_KEY = ["sushi-delivery-settings"]
const PRODUCTS_KEY = ["sushi-products"]
const REQUESTS_KEY = ["sushi-order-requests"]

export const useAdminSushiDeliverySettings = () => {
  return useQuery<AdminSushiDeliverySettingsDTO>({
    queryKey: SETTINGS_KEY,
    queryFn: () => sdk.admin.sushiDelivery.getSettings(),
  })
}

export const useAdminUpdateSushiDeliverySettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUpdateSushiDeliverySettingsDTO) =>
      sdk.admin.sushiDelivery.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY })
    },
  })
}

export const useAdminListSushiProducts = () => {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: () => sdk.admin.sushiDelivery.listProducts(),
  })
}

export const useAdminCreateSushiProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sdk.admin.sushiDelivery.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

export const useAdminUpdateSushiProduct = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof sdk.admin.sushiDelivery.updateProduct>[1]) =>
      sdk.admin.sushiDelivery.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

export const useAdminListSushiOrderRequests = () => {
  return useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: () => sdk.admin.sushiDelivery.listOrderRequests(),
  })
}

export const useAdminUpdateSushiOrderRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      status: "confirmed" | "rejected" | "cancelled"
      rejection_reason?: string
    }) => sdk.admin.sushiDelivery.updateOrderRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY })
    },
  })
}
