import type { Client } from '@medusajs/js-sdk'

export class BaseResource {
  constructor(protected client: Client) {}
} 