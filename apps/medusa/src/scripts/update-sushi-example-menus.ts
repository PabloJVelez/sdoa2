import type { ExecArgs } from '@medusajs/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { MENU_MODULE } from '../modules/menu';
import { menuDefinitions } from './seed/chef-experiences';

const legacyMenuNamesByIndex = ['The Winter Table', 'Salt & Sun', 'The Harvest Table', 'Noir & Blanc', 'Custom'];

async function replaceCourses(
  menuModuleService: any,
  menuId: string,
  courses: (typeof menuDefinitions)[number]['courses'],
) {
  const existingCourses = await menuModuleService.listCourses({ menu_id: menuId });

  for (const course of existingCourses) {
    await menuModuleService.deleteCourses(course.id);
  }

  for (const courseDefinition of courses) {
    const [createdCourse] = await menuModuleService.createCourses([
      {
        name: courseDefinition.name,
        menu_id: menuId,
      },
    ]);

    for (const dishDefinition of courseDefinition.dishes) {
      const [createdDish] = await menuModuleService.createDishes([
        {
          name: dishDefinition.name,
          description: dishDefinition.description || null,
          course_id: createdCourse.id,
        },
      ]);

      if (dishDefinition.ingredients.length) {
        await menuModuleService.createIngredients(
          dishDefinition.ingredients.map((ingredientDefinition) => ({
            name: ingredientDefinition.name,
            optional: ingredientDefinition.optional || false,
            dish_id: createdDish.id,
          })),
        );
      }
    }
  }
}

export default async function updateSushiExampleMenus({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const menuModuleService = container.resolve(MENU_MODULE) as any;

  logger.info('[update-sushi-example-menus] Starting targeted menu update');

  for (let index = 0; index < menuDefinitions.length; index += 1) {
    const definition = menuDefinitions[index];
    const legacyName = legacyMenuNamesByIndex[index];
    const candidateNames = [definition.name, legacyName].filter(Boolean);

    const existingMenus = [];
    for (const candidateName of candidateNames) {
      const matches = await menuModuleService.listMenus({ name: candidateName }, { take: 1 });
      existingMenus.push(...matches);
      if (existingMenus.length > 0) {
        break;
      }
    }

    const menu = existingMenus[0];

    if (!menu) {
      const [createdMenu] = await menuModuleService.createMenus([
        {
          name: definition.name,
          allow_tbd_pricing: definition.allow_tbd_pricing ?? false,
          thumbnail: definition.thumbnail ?? null,
        },
      ]);

      await replaceCourses(menuModuleService, createdMenu.id, definition.courses);

      if (definition.images?.length) {
        await menuModuleService.replaceMenuImages(createdMenu.id, definition.images, {
          thumbnail: definition.thumbnail,
        });
      }

      logger.info(`[update-sushi-example-menus] Created ${definition.name}`);
      continue;
    }

    await menuModuleService.updateMenus({
      id: menu.id,
      name: definition.name,
      allow_tbd_pricing: definition.allow_tbd_pricing ?? false,
      thumbnail: definition.thumbnail ?? null,
    });

    await replaceCourses(menuModuleService, menu.id, definition.courses);

    if (definition.images?.length) {
      await menuModuleService.replaceMenuImages(menu.id, definition.images, {
        thumbnail: definition.thumbnail,
      });
    }

    logger.info(`[update-sushi-example-menus] Updated ${legacyName} -> ${definition.name}`);
  }

  logger.info('[update-sushi-example-menus] Finished targeted menu update');
}
