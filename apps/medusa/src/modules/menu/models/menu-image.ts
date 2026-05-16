import { model } from "@medusajs/framework/utils"
import { Menu } from "./menu"

export const MenuImage = model.define("menu_image", {
  id: model.id().primaryKey(),
  url: model.text(),
  rank: model.number().default(0),
  metadata: model.json().nullable(),
  menu: model.belongsTo(() => Menu, {
    mappedBy: "images",
  }),
}).indexes([
  { on: ["menu_id"] },
])

