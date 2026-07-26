/**
 * Sushi DOA chef experience seed data — US-only (USD pricing).
 */
import type { CreateProductWorkflowInputDTO, ProductCollectionDTO, ProductTagDTO } from '@medusajs/framework/types';
import { ProductStatus } from '@medusajs/utils';

export interface MenuSeedData {
  name: string;
  courses: {
    name: string;
    dishes: {
      name: string;
      description?: string;
      ingredients: {
        name: string;
        optional?: boolean;
      }[];
    }[];
  }[];
  allow_tbd_pricing?: boolean;
  thumbnail?: string | null;
  images?: string[];
}

interface MenuTicketProductDataUsd {
  title: string;
  description: string;
  handle: string;
  price: { usd: number };
  estimatedDuration: number;
  maxGuests: number;
  eventType: 'cooking_class' | 'plated_dinner' | 'buffet_style';
  images: string[];
  availableTickets: number;
}

export const menuDefinitions: MenuSeedData[] = [
  {
    name: 'Austin Omakase',
    thumbnail: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80&auto=format&fit=crop',
    ],
    courses: [
      {
        name: 'Welcome',
        dishes: [
          {
            name: 'Yuzu Cucumber Sunomono',
            description: 'Crisp cucumber salad with rice vinegar, yuzu, sesame, and shaved ginger.',
            ingredients: [
              { name: 'Cucumber' },
              { name: 'Yuzu' },
              { name: 'Rice vinegar' },
              { name: 'Sesame' },
              { name: 'Ginger' },
            ],
          },
          {
            name: 'Miso Soup with Tofu',
            description: 'White miso broth with tofu, wakame, scallion, and seasonal mushrooms.',
            ingredients: [
              { name: 'White miso' },
              { name: 'Tofu' },
              { name: 'Wakame' },
              { name: 'Scallion' },
              { name: 'Seasonal mushrooms' },
            ],
          },
        ],
      },
      {
        name: 'Nigiri',
        dishes: [
          {
            name: 'Chef Selection Nigiri',
            description: 'Rotating nigiri set featuring salmon, tuna, yellowtail, shrimp, and white fish.',
            ingredients: [
              { name: 'Sushi rice' },
              { name: 'Salmon' },
              { name: 'Tuna' },
              { name: 'Yellowtail' },
              { name: 'Shrimp' },
              { name: 'White fish' },
            ],
          },
          {
            name: 'Aburi Salmon Nigiri',
            description: 'Lightly torched salmon over seasoned rice with citrus soy and scallion.',
            ingredients: [{ name: 'Salmon' }, { name: 'Sushi rice' }, { name: 'Citrus soy' }, { name: 'Scallion' }],
          },
        ],
      },
      {
        name: 'Rolls',
        dishes: [
          {
            name: 'Spicy Tuna Crunch Roll',
            description: 'Spicy tuna, cucumber, tempura crunch, sesame, and house sauce.',
            ingredients: [
              { name: 'Tuna' },
              { name: 'Cucumber' },
              { name: 'Tempura crunch' },
              { name: 'Sesame' },
              { name: 'House spicy sauce' },
            ],
          },
          {
            name: 'Austin Garden Roll',
            description: 'Avocado, asparagus, cucumber, pickled carrot, shiso, and sesame.',
            ingredients: [
              { name: 'Avocado' },
              { name: 'Asparagus' },
              { name: 'Cucumber' },
              { name: 'Pickled carrot' },
              { name: 'Shiso' },
            ],
          },
        ],
      },
      {
        name: 'Finish',
        dishes: [
          {
            name: 'Matcha Panna Cotta',
            description: 'Silky matcha custard with black sesame crumble and seasonal berries.',
            ingredients: [
              { name: 'Matcha' },
              { name: 'Cream' },
              { name: 'Black sesame' },
              { name: 'Seasonal berries' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sashimi & Nigiri Bar',
    thumbnail: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80&auto=format&fit=crop',
    ],
    courses: [
      {
        name: 'Cold Starters',
        dishes: [
          {
            name: 'Hamachi Crudo',
            description: 'Yellowtail with ponzu, serrano, cilantro oil, and crispy shallot.',
            ingredients: [
              { name: 'Yellowtail' },
              { name: 'Ponzu' },
              { name: 'Serrano' },
              { name: 'Cilantro oil' },
              { name: 'Crispy shallot' },
            ],
          },
          {
            name: 'Tuna Tataki',
            description: 'Seared tuna with ginger soy, scallion, sesame, and daikon.',
            ingredients: [
              { name: 'Tuna' },
              { name: 'Ginger soy' },
              { name: 'Scallion' },
              { name: 'Sesame' },
              { name: 'Daikon' },
            ],
          },
        ],
      },
      {
        name: 'Sashimi',
        dishes: [
          {
            name: 'Premium Sashimi Selection',
            description: 'Chef-cut salmon, tuna, yellowtail, scallop, and seasonal white fish.',
            ingredients: [
              { name: 'Salmon' },
              { name: 'Tuna' },
              { name: 'Yellowtail' },
              { name: 'Scallop' },
              { name: 'Seasonal white fish' },
            ],
          },
          {
            name: 'Scallop with Yuzu Kosho',
            description: 'Sweet scallop dressed with yuzu kosho, lemon, and micro cilantro.',
            ingredients: [{ name: 'Scallop' }, { name: 'Yuzu kosho' }, { name: 'Lemon' }, { name: 'Micro cilantro' }],
          },
        ],
      },
      {
        name: 'Nigiri',
        dishes: [
          {
            name: 'Tuna Flight',
            description: 'Lean tuna, chutoro-style tuna, and spicy tuna gunkan with nori.',
            ingredients: [{ name: 'Tuna' }, { name: 'Sushi rice' }, { name: 'Nori' }, { name: 'Wasabi' }],
          },
          {
            name: 'Salmon Duo',
            description: 'Classic salmon nigiri plus torched salmon with citrus glaze.',
            ingredients: [{ name: 'Salmon' }, { name: 'Sushi rice' }, { name: 'Citrus glaze' }, { name: 'Scallion' }],
          },
        ],
      },
      {
        name: 'Sides',
        dishes: [
          {
            name: 'Edamame with Togarashi Salt',
            description: 'Steamed edamame tossed with sea salt, sesame oil, and togarashi.',
            ingredients: [{ name: 'Edamame' }, { name: 'Sea salt' }, { name: 'Sesame oil' }, { name: 'Togarashi' }],
          },
        ],
      },
    ],
  },
  {
    name: 'Maki Party Platter',
    thumbnail: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80&auto=format&fit=crop',
    ],
    courses: [
      {
        name: 'Snacks',
        dishes: [
          {
            name: 'Seaweed Salad Cups',
            description: 'Chilled wakame salad served in individual cups with sesame and cucumber.',
            ingredients: [{ name: 'Wakame' }, { name: 'Cucumber' }, { name: 'Sesame' }, { name: 'Rice vinegar' }],
          },
          {
            name: 'Spicy Edamame',
            description: 'Edamame tossed in chili garlic oil, soy, and lime.',
            ingredients: [{ name: 'Edamame' }, { name: 'Chili garlic oil' }, { name: 'Soy' }, { name: 'Lime' }],
          },
        ],
      },
      {
        name: 'Classic Rolls',
        dishes: [
          {
            name: 'California Roll',
            description: 'Crab salad, avocado, cucumber, sesame, and tobiko.',
            ingredients: [
              { name: 'Crab salad' },
              { name: 'Avocado' },
              { name: 'Cucumber' },
              { name: 'Sesame' },
              { name: 'Tobiko', optional: true },
            ],
          },
          {
            name: 'Salmon Avocado Roll',
            description: 'Fresh salmon, avocado, sushi rice, and nori.',
            ingredients: [{ name: 'Salmon' }, { name: 'Avocado' }, { name: 'Sushi rice' }, { name: 'Nori' }],
          },
        ],
      },
      {
        name: 'Signature Rolls',
        dishes: [
          {
            name: 'Sushi DOA Roll',
            description: 'Spicy tuna, shrimp tempura, avocado, eel sauce, spicy mayo, and scallion.',
            ingredients: [
              { name: 'Spicy tuna' },
              { name: 'Shrimp tempura' },
              { name: 'Avocado' },
              { name: 'Eel sauce' },
              { name: 'Spicy mayo' },
              { name: 'Scallion' },
            ],
          },
          {
            name: 'Crunchy Dragon Roll',
            description: 'Eel, cucumber, avocado, tempura crunch, and sweet soy glaze.',
            ingredients: [
              { name: 'Eel' },
              { name: 'Cucumber' },
              { name: 'Avocado' },
              { name: 'Tempura crunch' },
              { name: 'Sweet soy glaze' },
            ],
          },
        ],
      },
      {
        name: 'Sauces',
        dishes: [
          {
            name: 'House Sauce Trio',
            description: 'Spicy mayo, eel sauce, and citrus ponzu served on the side.',
            ingredients: [{ name: 'Spicy mayo' }, { name: 'Eel sauce' }, { name: 'Ponzu' }],
          },
        ],
      },
    ],
  },
  {
    name: 'Bento Box Social',
    thumbnail: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80&auto=format&fit=crop',
    ],
    courses: [
      {
        name: 'Bento Starters',
        dishes: [
          {
            name: 'Miso Soup',
            description: 'Classic miso broth with tofu, wakame, and scallion.',
            ingredients: [{ name: 'Miso' }, { name: 'Tofu' }, { name: 'Wakame' }, { name: 'Scallion' }],
          },
          {
            name: 'Cucumber Sesame Salad',
            description: 'Cucumber, sesame dressing, furikake, and pickled ginger.',
            ingredients: [
              { name: 'Cucumber' },
              { name: 'Sesame dressing' },
              { name: 'Furikake' },
              { name: 'Pickled ginger' },
            ],
          },
        ],
      },
      {
        name: 'Bento Boxes',
        dishes: [
          {
            name: 'Salmon Teriyaki Bento',
            description: 'Glazed salmon, sushi rice, tamago, pickles, and seasonal vegetables.',
            ingredients: [
              { name: 'Salmon' },
              { name: 'Teriyaki glaze' },
              { name: 'Sushi rice' },
              { name: 'Tamago' },
              { name: 'Pickles' },
              { name: 'Seasonal vegetables' },
            ],
          },
          {
            name: 'Chicken Karaage Bento',
            description: 'Crispy chicken karaage with rice, slaw, pickles, and tonkatsu sauce.',
            ingredients: [
              { name: 'Chicken' },
              { name: 'Rice' },
              { name: 'Slaw' },
              { name: 'Pickles' },
              { name: 'Tonkatsu sauce' },
            ],
          },
        ],
      },
      {
        name: 'Sushi Add-Ons',
        dishes: [
          {
            name: 'Mini Roll Set',
            description: 'Assorted tuna, salmon, cucumber, and avocado rolls for the table.',
            ingredients: [
              { name: 'Tuna' },
              { name: 'Salmon' },
              { name: 'Cucumber' },
              { name: 'Avocado' },
              { name: 'Nori' },
            ],
          },
          {
            name: 'Vegetable Futomaki',
            description: 'Large-format vegetarian roll with tamago, cucumber, avocado, and pickles.',
            ingredients: [
              { name: 'Tamago' },
              { name: 'Cucumber' },
              { name: 'Avocado' },
              { name: 'Pickles' },
              { name: 'Sushi rice' },
            ],
          },
        ],
      },
      {
        name: 'Dessert',
        dishes: [
          {
            name: 'Mochi Ice Cream',
            description: 'Assorted mochi ice cream bites with matcha and strawberry.',
            ingredients: [{ name: 'Mochi' }, { name: 'Ice cream' }, { name: 'Matcha' }, { name: 'Strawberry' }],
          },
        ],
      },
    ],
  },
  {
    name: 'Custom Sushi Experience',
    allow_tbd_pricing: true,
    thumbnail: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=1200&q=80&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1604909052743-94e838986d24?w=1200&q=80&auto=format&fit=crop'],
    courses: [
      {
        name: 'Designed For Your Event',
        dishes: [
          {
            name: 'Chef-Guided Sushi Menu',
            description:
              'A custom sushi spread built around your guest count, event format, fish preferences, and dietary needs.',
            ingredients: [
              { name: 'Seasonal fish' },
              { name: 'Sushi rice' },
              { name: 'Nori' },
              { name: 'Vegetarian options', optional: true },
              { name: 'Gluten-free soy', optional: true },
            ],
          },
        ],
      },
    ],
  },
];

const menuProductDataUsd: MenuTicketProductDataUsd[] = [
  {
    title: 'Austin Omakase',
    description:
      'A chef-led sushi tasting with composed starters, premium nigiri, signature rolls, and a light matcha finish. Built for intimate dinners and special occasions.',
    handle: 'austin-omakase',
    price: { usd: 125 },
    estimatedDuration: 180,
    maxGuests: 12,
    eventType: 'plated_dinner',
    images: menuDefinitions[0].images ?? [],
    availableTickets: 15,
  },
  {
    title: 'Sashimi & Nigiri Bar',
    description:
      'A premium raw bar experience with crudo, sashimi, nigiri flights, and polished sushi bar service for gatherings that center the fish.',
    handle: 'sashimi-and-nigiri-bar',
    price: { usd: 135 },
    estimatedDuration: 165,
    maxGuests: 14,
    eventType: 'plated_dinner',
    images: menuDefinitions[1].images ?? [],
    availableTickets: 18,
  },
  {
    title: 'Maki Party Platter',
    description:
      'A shareable sushi party menu with snacks, classic rolls, signature rolls, sauces, and plenty of variety for groups.',
    handle: 'maki-party-platter',
    price: { usd: 95 },
    estimatedDuration: 150,
    maxGuests: 18,
    eventType: 'buffet_style',
    images: menuDefinitions[2].images ?? [],
    availableTickets: 20,
  },
  {
    title: 'Bento Box Social',
    description:
      'Individual bento-style service with miso soup, salads, salmon or karaage bento boxes, sushi add-ons, and mochi.',
    handle: 'bento-box-social',
    price: { usd: 85 },
    estimatedDuration: 135,
    maxGuests: 16,
    eventType: 'buffet_style',
    images: menuDefinitions[3].images ?? [],
    availableTickets: 16,
  },
];

function buildMenuProductDataUsd({
  sales_channels,
  sku,
  prices: { usd },
  availableTickets,
  eventType,
  estimatedDuration,
  maxGuests,
}: {
  sales_channels: { id: string }[];
  sku: string;
  prices: { usd: number };
  availableTickets: number;
  eventType: string;
  estimatedDuration: number;
  maxGuests: number;
}) {
  return {
    options: [
      { title: 'Event Type', values: [eventType] },
      { title: 'Max Guests', values: [maxGuests.toString()] },
    ],
    sales_channels: sales_channels.map(({ id }) => ({ id })),
    variants: [
      {
        title: `${eventType} Experience`,
        sku: `${sku}-EXPERIENCE`,
        options: { 'Event Type': eventType, 'Max Guests': maxGuests.toString() },
        manage_inventory: false,
        prices: [{ amount: usd * 100, currency_code: 'usd' }],
      },
    ],
    metadata: {
      event_type: eventType,
      estimated_duration: estimatedDuration,
      max_guests: maxGuests,
      available_tickets: availableTickets,
      is_menu_experience: true,
    },
  };
}

export const seedMenuEntities = async (menuModuleService: any): Promise<{ id: string; name: string }[]> => {
  const createdMenus: { id: string; name: string }[] = [];

  for (const menuDefinition of menuDefinitions) {
    try {
      const [createdMenu] = await menuModuleService.createMenus([
        {
          name: menuDefinition.name,
          allow_tbd_pricing: menuDefinition.allow_tbd_pricing ?? false,
          thumbnail: menuDefinition.thumbnail ?? null,
        },
      ]);

      for (const courseDefinition of menuDefinition.courses) {
        const [createdCourse] = await menuModuleService.createCourses([
          {
            name: courseDefinition.name,
            menu_id: createdMenu.id,
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

          const ingredientData = dishDefinition.ingredients.map((ingredientDefinition) => ({
            name: ingredientDefinition.name,
            optional: ingredientDefinition.optional || false,
            dish_id: createdDish.id,
          }));

          if (ingredientData.length > 0) {
            await menuModuleService.createIngredients(ingredientData);
          }
        }
      }

      if (menuDefinition.images?.length) {
        await menuModuleService.replaceMenuImages(createdMenu.id, menuDefinition.images, {
          thumbnail: menuDefinition.thumbnail,
        });
      }

      createdMenus.push({
        id: createdMenu.id,
        name: createdMenu.name,
      });
    } catch (error) {
      console.error(`Error creating menu ${menuDefinition.name}:`, error);
    }
  }

  return createdMenus;
};

export function seedMenuProductsUsd({
  collections,
  tags,
  sales_channels,
  categories,
  shipping_profile_id,
  experience_type_id,
}: {
  collections: ProductCollectionDTO[];
  tags: ProductTagDTO[];
  categories: { id: string; name: string }[];
  sales_channels: { id: string }[];
  shipping_profile_id: string;
  experience_type_id: string;
}): CreateProductWorkflowInputDTO[] {
  const chefExpCollection = collections.find((c) => c.title === 'Chef Experiences');
  const chefExpCategory = categories.filter((c) => c.name === 'Chef Experiences');
  const chefTags = tags.filter((t) => ['Chef Experience', 'Limited Availability'].includes(t.value));

  return menuProductDataUsd.map((mp) => {
    const sku = mp.handle.toUpperCase().replace(/-/g, '_');
    return {
      title: mp.title,
      description: mp.description,
      handle: mp.handle,
      status: ProductStatus.PUBLISHED,
      category_ids: chefExpCategory.map((c) => c.id),
      tag_ids: chefTags.map((t) => t.id),
      thumbnail: mp.images[0],
      collection_id: chefExpCollection?.id,
      shipping_profile_id,
      type_id: experience_type_id,
      images: mp.images.map((url) => ({ url })),
      ...buildMenuProductDataUsd({
        sales_channels,
        sku,
        prices: { usd: mp.price.usd },
        availableTickets: mp.availableTickets,
        eventType: mp.eventType,
        estimatedDuration: mp.estimatedDuration,
        maxGuests: mp.maxGuests,
      }),
    };
  });
}
