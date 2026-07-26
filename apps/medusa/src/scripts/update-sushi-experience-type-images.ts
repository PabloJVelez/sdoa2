import type { ExecArgs } from '@medusajs/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { EXPERIENCE_TYPE_MODULE } from '../modules/experience-type';
import type ExperienceTypeModuleService from '../modules/experience-type/service';
import { defaultExperienceTypes } from './seed/experience-types';

export default async function updateSushiExperienceTypeImages({ container }: Pick<ExecArgs, 'container'>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const experienceTypeSvc: ExperienceTypeModuleService = container.resolve(EXPERIENCE_TYPE_MODULE);
  const existing = await experienceTypeSvc.listExperienceTypes({});

  for (const seed of defaultExperienceTypes) {
    const row = existing.find((experienceType) => experienceType.slug === seed.slug);
    if (!row) {
      logger.warn(`[update-experience-type-images] Missing ${seed.slug}`);
      continue;
    }

    if (row.image_url === seed.image_url) {
      logger.info(`[update-experience-type-images] ${row.name} already up to date`);
      continue;
    }

    await experienceTypeSvc.updateExperienceTypes({
      id: row.id,
      image_url: seed.image_url,
    } as any);

    logger.info(`[update-experience-type-images] Updated ${row.name}`);
  }
}
