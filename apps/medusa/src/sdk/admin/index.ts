import { AdminSocialGalleryImportsResource, AdminSocialGalleryPostsResource } from './admin-social-gallery-posts';
import type { Client } from '@medusajs/js-sdk';
import { Admin } from '@medusajs/js-sdk';
import { AdminChefEventsResource } from './admin-chef-events';
import { AdminMenusResource } from './admin-menus';
import { AdminExperienceTypesResource } from './admin-experience-types';

export class ExtendedAdminSDK extends Admin {
  public chefEvents: AdminChefEventsResource;
  public menus: AdminMenusResource;
  public experienceTypes: AdminExperienceTypesResource;

  public socialGalleryPosts: AdminSocialGalleryPostsResource;
  public socialGalleryImports: AdminSocialGalleryImportsResource;

  constructor(client: Client) {
    super(client);
    this.socialGalleryPosts = new AdminSocialGalleryPostsResource(client);
    this.socialGalleryImports = new AdminSocialGalleryImportsResource(client);
    this.chefEvents = new AdminChefEventsResource(client);
    this.menus = new AdminMenusResource(client);
    this.experienceTypes = new AdminExperienceTypesResource(client);
  }
}
export { AdminSocialGalleryImportsResource, AdminSocialGalleryPostsResource } from './admin-social-gallery-posts';
