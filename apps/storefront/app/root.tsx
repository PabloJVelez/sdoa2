import { getCommonMeta, mergeMeta } from '@libs/util/meta';
import { getRootLoader } from '@libs/util/server/root.server';
import { Container } from '@app/components/common/container';
import { useRef } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  ShouldRevalidateFunction,
  useLoaderData,
  useRouteError,
} from 'react-router';
import { MetaFunction } from 'react-router';
import { Page } from './components/layout/Page';
import { RootProviders } from './providers/root-providers';

import '@app/styles/global.css';
import { useRootLoaderData } from './hooks/useRootLoaderData';

export const getRootMeta: MetaFunction = ({ data }) => {
  // Using dynamic import inline to avoid module resolution issues
  // In production, consider moving this to a hook or loader
  const title = 'Sushi Delivery of Austin - Premium Sushi & Omakase Experiences';
  const description =
    "Austin's premier sushi experience. Order artisanal bento boxes for pickup or book a private omakase dinner.";
  const ogTitle = title;
  const ogDescription = description;
  const ogImage = '';
  const ogImageAlt = !!ogImage ? `${ogTitle} logo` : undefined;

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: ogImageAlt },
  ];
};

export const meta: MetaFunction<typeof loader> = mergeMeta(getCommonMeta, getRootMeta);

export const loader = getRootLoader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionResult,
  currentParams,
  currentUrl,
  defaultShouldRevalidate,
  formAction,
  formData,
  formEncType,
  formMethod,
  nextParams,
  nextUrl,
}) => {
  if (nextUrl.pathname.startsWith('/checkout/success')) return true;
  if (!formMethod || formMethod === 'GET') return false;

  return defaultShouldRevalidate;
};

function App() {
  const headRef = useRef<HTMLHeadElement>(null);
  const data = useRootLoaderData();

  const { env = {}, siteDetails } = data || {};

  return (
    <RootProviders>
      <html lang="en" className="min-h-screen scroll-smooth">
        <head ref={headRef}>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <Meta />

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Italiana&display=swap" rel="stylesheet" />

          <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Ballet:opsz@16..72&display=swap" rel="stylesheet" />

          <link href="https://fonts.googleapis.com/css2?family=Sen:wght@400..800&display=swap" rel="stylesheet" />

          <link href="https://fonts.googleapis.com/css2?family=Aboreto&display=swap" rel="stylesheet" />
          <Links />
          {siteDetails?.settings?.description && <meta name="description" content={siteDetails.settings.description} />}
        </head>
        <body className="min-h-screen">
          <Page>
            <Outlet />
          </Page>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(env)}`,
            }}
          />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </RootProviders>
  );
}

export default App;

export function ErrorBoundary() {
  const error = useRouteError();

  console.error('error boundary error', error);

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong';

  const message = isRouteErrorResponse(error)
    ? typeof error.data === 'string'
      ? error.data
      : 'We could not load this page. Please try again.'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred. Please try again.';

  return (
    <html lang="en" className="min-h-screen">
      <head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Container className="py-16">
          <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-4 text-gray-600">{message}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/checkout"
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-primary-600 px-5 py-2.5 text-base font-medium text-white hover:bg-primary-700"
              >
                Back to checkout
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Go home
              </a>
            </div>
          </div>
        </Container>
        <Scripts />
      </body>
    </html>
  );
}
