import { Label, Switch, Text } from "@medusajs/ui"
import type { AllowedDaySchedule } from "../../lib/sushi/schedule"

const ALL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const DAY_LABELS: Record<(typeof ALL_DAYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

type DayScheduleRow = {
  day: (typeof ALL_DAYS)[number]
  enabled: boolean
  start: string
  end: string
}

function normalizeTime(value: string): string {
  return value.slice(0, 5)
}

function scheduleToRows(allowedDays: AllowedDaySchedule[]): DayScheduleRow[] {
  return ALL_DAYS.map((day) => {
    const existing = allowedDays.find((entry) => entry.day.toLowerCase() === day)
    const window = existing?.windows[0]

    return {
      day,
      enabled: Boolean(existing?.windows.length),
      start: window?.start ? normalizeTime(window.start) : "11:00",
      end: window?.end ? normalizeTime(window.end) : "20:00",
    }
  })
}

function rowsToSchedule(rows: DayScheduleRow[]): AllowedDaySchedule[] {
  return rows
    .filter((row) => row.enabled)
    .map((row) => ({
      day: row.day,
      windows: [{ start: normalizeTime(row.start), end: normalizeTime(row.end) }],
    }))
}

type SushiScheduleEditorProps = {
  value: AllowedDaySchedule[]
  onChange: (value: AllowedDaySchedule[]) => void
}

export function SushiScheduleEditor({ value, onChange }: SushiScheduleEditorProps) {
  const rows = scheduleToRows(value)

  const updateRow = (day: DayScheduleRow["day"], patch: Partial<DayScheduleRow>) => {
    const nextRows = rows.map((row) => (row.day === day ? { ...row, ...patch } : row))
    onChange(rowsToSchedule(nextRows))
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size="small" className="text-ui-fg-subtle">
        Choose which days customers can schedule pickup or delivery, and set the hours for each day.
      </Text>

      <div className="divide-y rounded-md border">
        {rows.map((row) => (
          <div
            key={row.day}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={row.enabled}
                onCheckedChange={(enabled) => updateRow(row.day, { enabled })}
              />
              <Label>{DAY_LABELS[row.day]}</Label>
            </div>

            {row.enabled ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={row.start}
                  onChange={(event) => updateRow(row.day, { start: event.target.value })}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <Text size="small" className="text-ui-fg-subtle">
                  to
                </Text>
                <input
                  type="time"
                  value={row.end}
                  onChange={(event) => updateRow(row.day, { end: event.target.value })}
                  className="rounded-md border px-2 py-1 text-sm"
                />
              </div>
            ) : (
              <Text size="small" className="text-ui-fg-subtle">
                Closed
              </Text>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export { rowsToSchedule, scheduleToRows }
