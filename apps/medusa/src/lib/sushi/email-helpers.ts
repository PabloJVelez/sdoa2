import { DateTime } from "luxon"

export function formatUsdFromCents(cents: number | null | undefined): string {
  return `$${((cents ?? 0) / 100).toFixed(2)}`
}

export function formatSushiScheduledAt(value: unknown): string {
  const date =
    value instanceof Date ? value : new Date(String(value ?? ""))
  if (Number.isNaN(date.getTime())) return "—"
  return DateTime.fromJSDate(date).toFormat("cccc, LLL d, yyyy 'at' h:mm a")
}

export function splitCustomerName(
  fullName: string | null | undefined,
  email: string,
): { first_name: string; last_name: string } {
  const trimmed = (fullName ?? "").trim()
  if (!trimmed) {
    const local = email.split("@")[0] ?? "Customer"
    return { first_name: local, last_name: "" }
  }
  const parts = trimmed.split(/\s+/)
  return {
    first_name: parts[0] ?? "Customer",
    last_name: parts.slice(1).join(" "),
  }
}

export function resolveChefBrandContact(): {
  name: string
  email: string
  phone: string
} {
  return {
    name: process.env.CHEF_CONTACT_NAME ?? "Chef",
    email: process.env.CHEF_CONTACT_EMAIL ?? "pmltechpile@gmail.com",
    phone: process.env.CHEF_CONTACT_PHONE ?? "",
  }
}

export function resolveAdminBaseUrl(): string {
  return (
    process.env.ADMIN_BACKEND_URL ??
    process.env.MEDUSA_ADMIN_URL ??
    "http://localhost:9000/app"
  )
}

export function resolveStorefrontBaseUrl(): string {
  return process.env.STOREFRONT_URL ?? "http://localhost:3000"
}

export function buildSushiPaymentCheckoutUrl(orderRequestId: string): string {
  const base = resolveStorefrontBaseUrl().replace(/\/$/, "")
  return `${base}/sushi/pay/${orderRequestId}`
}
