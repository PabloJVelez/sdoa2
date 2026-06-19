import { Breadcrumbs } from '@app/components/common/breadcrumbs';
import { Container } from '@app/components/common/container';
import { MenuTemplate } from '@app/templates/MenuTemplate';
import { fetchMenuById } from '@libs/util/server/data/menus.server';
import { getMergedPageMeta } from '@libs/util/page';
import { type LoaderFunctionArgs, type MetaFunction, redirect } from 'react-router';
import { useLoaderData } from 'react-router';
import HomeIcon from '@heroicons/react/24/solid/HomeIcon';

export const loader = async (args: LoaderFunctionArgs) => {
  try {
    const menuId = args.params.menuId;

    if (!menuId) {
      throw redirect('/menus');
    }

    const { menu } = await fetchMenuById(menuId);

    if (!menu) {
      throw redirect('/404');
    }

    return { menu, success: true };
  } catch (error) {
    console.error('Failed to load menu:', error);
    throw redirect('/404');
  }
};

export type MenuPageLoaderData = typeof loader;

export const meta: MetaFunction<MenuPageLoaderData> = ({ data, location }) => {
  const menu = data?.menu;

  if (!menu) {
    return [{ title: 'Menu Not Found | Sushi Delivery of Austin' }, { name: 'robots', content: 'noindex' }];
  }

  const courseCount = menu.courses?.length || 0;
  const dishCount = menu.courses?.reduce((acc, course) => acc + (course.dishes?.length || 0), 0) || 0;

  const title = `${menu.name} | Sushi Delivery of Austin`;
  const description = `${menu.name} featuring ${courseCount} courses and ${dishCount} dishes. Perfect for bento pickup, private omakase dinners, or sushi buffet events. Request this menu for your sushi experience.`;

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `https://yourstore.com${location.pathname}` },
    {
      name: 'keywords',
      content: `${menu.name}, sushi menu, omakase, bento box, private sushi dining, sushi austin`,
    },
    // Structured data for Recipe/Menu
    {
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: menu.name,
        description: `Sushi menu with ${courseCount} courses`,
        author: {
          '@type': 'Organization',
          name: 'Sushi Delivery of Austin',
        },
        recipeCategory: 'Sushi Menu',
        recipeCuisine: 'Japanese',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '99.99',
          description: 'Starting price per person for culinary experiences',
        },
      }),
    },
  ];
};

export default function MenuDetailRoute() {
  const { menu } = useLoaderData<MenuPageLoaderData>();

  if (!menu) return null;

  const breadcrumbs = [
    {
      label: (
        <span className="flex whitespace-nowrap">
          <HomeIcon className="inline h-4 w-4" />
          <span className="sr-only">Home</span>
        </span>
      ),
      url: `/`,
    },
    {
      label: 'Menu Templates',
      url: '/menus',
    },
    {
      label: menu.name,
    },
  ];

  return (
    <Container className="pb-16">
      <div className="my-8 flex flex-wrap items-center justify-between gap-4">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      <MenuTemplate menu={menu} />
    </Container>
  );
}
