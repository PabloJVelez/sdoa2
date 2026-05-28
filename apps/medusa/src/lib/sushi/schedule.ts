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
): { valid: true } | { valid: false; reason: string } {
  let scheduledAt: Date
  try {
    scheduledAt = parseScheduledAt(scheduledAtIso)
  } catch {
    return { valid: false, reason: "Invalid date or time" }
  }

  if (scheduledAt.getTime() <= Date.now()) {
    return { valid: false, reason: "Scheduled time must be in the future" }
  }

  const dayName = getDayName(scheduledAt)
  const daySchedule = allowedDays.find(
    (entry) => entry.day.toLowerCase() === dayName,
  )

  if (!daySchedule || !daySchedule.windows.length) {
    return {
      valid: false,
      reason: `Orders are not available on ${dayName}`,
    }
  }

  const timeValue = formatTime(scheduledAt)
  const inWindow = daySchedule.windows.some((window) => {
    return timeValue >= window.start && timeValue <= window.end
  })

  if (!inWindow) {
    return {
      valid: false,
      reason: "Selected time is outside available hours",
    }
  }

  return { valid: true }
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
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
