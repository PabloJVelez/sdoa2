import { Container } from '@app/components/common/container';
import Hero from '@app/components/sections/Hero';
import { getChefConfig } from '@libs/config/chef/chef-config';
import { ButtonStyleVariant } from '@libs/types';
import { getMergedPageMeta } from '@libs/util/page';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

const chefConfig = getChefConfig();

export const loader = async (_args: LoaderFunctionArgs) => {
  return {};
};

export const meta: MetaFunction<typeof loader> = getMergedPageMeta;

export default function AboutChefRoute() {
  return (
    <>
      <Container className="!px-0 py-0 sm:!p-10 lg:!p-16">
        <Hero
          className="min-h-[420px] !max-w-full border border-accent-200/70 bg-accent-50 sm:rounded-3xl px-6 py-16 sm:px-10 sm:py-20 lg:px-20 lg:py-24"
          content={
            <div className="mx-auto w-full max-w-5xl space-y-6 text-center text-primary-900">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent-800">About the Chef</p>
              <h1 className="font-italiana text-5xl leading-[0.95] tracking-normal text-primary-900 sm:text-6xl md:text-7xl lg:text-8xl">
                {chefConfig.displayName}
              </h1>
              <p className="mx-auto max-w-4xl text-lg !leading-8 text-primary-700 md:text-2xl md:!leading-10">
                {chefConfig.bio.short} With years of professional experience, crafting unforgettable sushi experiences
                using premium, fresh ingredients and providing a seamless, authentic Japanese dining experience.
              </p>
            </div>
          }
          actionsClassName="!flex-row w-full justify-center !font-base"
          actions={[
            { label: 'View Menus', url: '/menus', style_variant: ButtonStyleVariant.PRIMARY },
            { label: 'Request an Event', url: '/request' },
          ]}
        />
      </Container>

      <Container className="flex flex-col gap-12 pb-24 pt-10 sm:!px-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <div className="space-y-4 border-t border-primary-200 pt-8 text-lg !leading-8 text-primary-700">
            <h2 className="font-italiana text-4xl text-primary-900">Philosophy</h2>
            <p>
              Every experience is a celebration of Japanese culinary artistry. From artisanal bento boxes to intimate
              omakase dinners, we craft experiences that honor tradition while embracing innovation.
            </p>
          </div>
          <div className="space-y-4 border-t border-primary-200 pt-8 text-lg !leading-8 text-primary-700">
            <h2 className="font-italiana text-4xl text-primary-900">Experiences</h2>
            <p>
              From bento boxes for pickup to private sushi dinners in your home, each experience is designed around
              premium fish, thoughtful presentation, and relaxed hospitality.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
