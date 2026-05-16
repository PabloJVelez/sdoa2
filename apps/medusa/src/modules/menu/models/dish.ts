import { model } from "@medusajs/framework/utils"
import { Course } from "./course"
import { Ingredient } from "./ingredient"

export const Dish = model.define("dish", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  course: model.belongsTo(() => Course, {
    mappedBy: "dishes"
  }),
  ingredients: model.hasMany(() => Ingredient)
}).cascades({
  delete: ["ingredients"]
}) 