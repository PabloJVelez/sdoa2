import { Module } from "@medusajs/framework/utils"
import SushiDeliveryModuleService from "./service"

export const SUSHI_DELIVERY_MODULE = "sushiDeliveryModuleService"

export default Module(SUSHI_DELIVERY_MODULE, {
  service: SushiDeliveryModuleService,
})
