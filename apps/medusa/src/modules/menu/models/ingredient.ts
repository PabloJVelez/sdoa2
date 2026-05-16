import { model } from "@medusajs/framework/utils"
import { Dish } from "./dish"

export const Ingredient = model.define("ingredient", {
  id: model.id().primaryKey(),
  name: model.text(),
  optional: model.boolean().nullable(),
  dish: model.belongsTo(() => Dish, {
    mappedBy: "ingredients"
  })
})

export default Ingredient 