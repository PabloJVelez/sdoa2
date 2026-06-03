import { DateTime } from "luxon"

export type TimeWindow = {
  start: string
  end: string
}

export type AllowedDaySchedule = {
  day: string
  windows: TimeWindow[]
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()]
}

export function parseScheduledAt(iso: string): Date {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid scheduled date/time")
  }
  return parsed
}

export function validateScheduledSlot(
  scheduledAtIso: string,
  allowedDays: AllowedDaySchedule[],
  storeTimezone = "America/Chicago",
): { valid: true } | { valid: false; reason: string } {
  const scheduledAt = DateTime.fromISO(scheduledAtIso, { zone: storeTimezone })

  if (!scheduledAt.isValid) {
    return { valid: false, reason: "Invalid date or time" }
  }

  if (scheduledAt.toMillis() <= Date.now()) {
    return { valid: false, reason: "Scheduled time must be in the future" }
  }

  const dayName = scheduledAt.toFormat("cccc").toLowerCase()
  const daySchedule = allowedDays.find(
    (entry) => entry.day.toLowerCase() === dayName,
  )

  if (!daySchedule || !daySchedule.windows.length) {
    return {
      valid: false,
      reason: `Orders are not available on ${dayName}`,
    }
  }

  const timeValue = scheduledAt.toFormat("HH:mm")
  const inWindow = daySchedule.windows.some((window) => {
    const start = window.start.slice(0, 5)
    const end = window.end.slice(0, 5)
    return timeValue >= start && timeValue <= end
  })

  if (!inWindow) {
    return {
      valid: false,
      reason: "Selected time is outside available hours",
    }
  }

  return { valid: true }
}

export const DEFAULT_ALLOWED_DAYS: AllowedDaySchedule[] = [
  {
    day: "friday",
    windows: [{ start: "11:00", end: "20:00" }],
  },
  {
    day: "saturday",
    windows: [{ start: "11:00", end: "20:00" }],
  },
  {
    day: "sunday",
    windows: [{ start: "11:00", end: "18:00" }],
  },
]
