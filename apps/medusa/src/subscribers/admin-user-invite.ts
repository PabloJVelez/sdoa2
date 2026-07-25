import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { CreateNotificationDTO } from "@medusajs/types"
import { DateTime } from "luxon"
import { resolveChefBrandContact } from "../lib/sushi/email-helpers"

type InviteEventItem = {
  id: string
}

type InviteDTO = {
  id: string
  email: string
  token: string
  expires_at?: Date | string | null
}

function resolveAdminInviteBaseUrl() {
  const base =
    process.env.MEDUSA_ADMIN_URL ??
    process.env.ADMIN_BACKEND_URL ??
    "http://localhost:9000"

  return base.replace(/\/+$/, "").replace(/\/app$/, "")
}

function formatExpiresAt(value: InviteDTO["expires_at"]) {
  if (!value) return undefined

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  return DateTime.fromJSDate(date).toFormat("LLL d, yyyy")
}

async function retrieveInvite(container: SubscriberArgs["container"], id: string) {
  const userModule = container.resolve(Modules.USER) as {
    retrieveInvite: (id: string) => Promise<InviteDTO>
  }

  return userModule.retrieveInvite(id)
}

export default async function adminUserInviteHandler({
  event: { data, name },
  container,
}: SubscriberArgs<InviteEventItem[]>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const chef = {
    ...resolveChefBrandContact(),
    name: process.env.CHEF_CONTACT_NAME ?? "Sushidoa",
  }
  const inviteBaseUrl = resolveAdminInviteBaseUrl()

  await Promise.all(
    data.map(async ({ id }) => {
      try {
        const invite = await retrieveInvite(container, id)
        const inviteUrl = `${inviteBaseUrl}/invite?token=${encodeURIComponent(invite.token)}`

        await notificationService.createNotifications({
          to: invite.email,
          channel: "email",
          template: "admin-user-invite",
          data: {
            email: invite.email,
            inviteUrl,
            expiresAt: formatExpiresAt(invite.expires_at),
            chef,
          },
        } as CreateNotificationDTO)

        logger.info(`Admin invite email sent to ${invite.email}`)
      } catch (error) {
        logger.error(
          `Failed to send admin invite email for invite ${id} from ${name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
    }),
  )
}

export const config: SubscriberConfig = {
  event: ["invite.created", "invite.resent"],
}
