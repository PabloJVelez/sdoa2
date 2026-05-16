import { defineLink } from "@medusajs/framework/utils";
import ChefEventModule from "../modules/chef-event";
import ProductModule from "@medusajs/medusa/product";

export default defineLink(
  ProductModule.linkable.product,
  ChefEventModule.linkable.chefEvent,
)