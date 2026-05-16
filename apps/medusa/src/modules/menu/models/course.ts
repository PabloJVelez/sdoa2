import { model } from "@medusajs/framework/utils"
import { Menu } from "./menu"
import { Dish } from "./dish"

export const Course = model.define("course", {
  id: model.id().primaryKey(),
  name: model.text(),
  menu: model.belongsTo(() => Menu, {
    mappedBy: "courses"
  }),
  dishes: model.hasMany(() => Dish)
}).cascades({
  delete: ["dishes"]
}) 