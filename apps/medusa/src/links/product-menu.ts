import { defineLink } from "@medusajs/framework/utils";
import MenuModule from "../modules/menu"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
  ProductModule.linkable.product,
  MenuModule.linkable.menu,
)