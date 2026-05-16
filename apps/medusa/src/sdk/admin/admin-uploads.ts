import type { Client } from '@medusajs/js-sdk'
import { BaseResource } from '../base-resource'

type UploadResponse = {
  uploads: Array<{ id: string; url: string }>
}

export class AdminUploadsResource extends BaseResource {
  constructor(client: Client) {
    super(client)
  }

  async create(form: FormData) {
    const res = await fetch(`/admin/uploads`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Upload failed: ${res.status}`)
    }
    return (await res.json()) as UploadResponse
  }

  async delete(id: string) {
    const res = await fetch(`/admin/uploads/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Delete failed: ${res.status}`)
    }
  }
}

