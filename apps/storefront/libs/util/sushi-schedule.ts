export type TimeWindow = {
  start: string;
  end: string;
};

export type AllowedDaySchedule = {
  day: string;
  windows: TimeWindow[];
};

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const DAY_LABELS: Record<(typeof DAY_NAMES)[number], string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export function formatDayLabel(day: string): string {
  const key = day.toLowerCase() as (typeof DAY_NAMES)[number];
  return DAY_LABELS[key] ?? day;
}

function parseTimeToMinutes(time: string): number {
  const normalized = time.slice(0, 5);
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getDayNameForDate(dateStr: string, timezone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  })
    .format(utcNoon)
    .toLowerCase();
  return dayName;
}

function getNowInTimezone(timezone: string): { dateStr: string; minutes: number } {
  const now = new Date();
  const dateStr = formatDateInTimezone(now, timezone);
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(timeParts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(timeParts.find((p) => p.type === 'minute')?.value ?? 0);

  return { dateStr, minutes: hour * 60 + minute };
}

export function getAvailableDates(
  allowedDays: AllowedDaySchedule[],
  storeTimezone: string,
  daysAhead = 28,
): string[] {
  const allowed = new Set(allowedDays.map((entry) => entry.day.toLowerCase()));
  const dates: string[] = [];
  const now = new Date();

  for (let offset = 0; offset <= daysAhead; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    const dateStr = formatDateInTimezone(candidate, storeTimezone);
    const dayName = getDayNameForDate(dateStr, storeTimezone);

    if (allowed.has(dayName) && !dates.includes(dateStr)) {
      dates.push(dateStr);
    }
  }

  return dates;
}

export function getTimeSlotsForDate(
  allowedDays: AllowedDaySchedule[],
  dateStr: string,
  storeTimezone: string,
  slotMinutes = 30,
): string[] {
  const dayName = getDayNameForDate(dateStr, storeTimezone);
  const daySchedule = allowedDays.find((entry) => entry.day.toLowerCase() === dayName);
  if (!daySchedule?.windows.length) return [];

  const { dateStr: todayStr, minutes: nowMinutes } = getNowInTimezone(storeTimezone);
  const isToday = dateStr === todayStr;
  const slots: string[] = [];

  for (const window of daySchedule.windows) {
    const startMin = parseTimeToMinutes(window.start);
    const endMin = parseTimeToMinutes(window.end);

    for (let minute = startMin; minute <= endMin; minute += slotMinutes) {
      if (isToday && minute <= nowMinutes) continue;
      const timeStr = minutesToTime(minute);
      if (!slots.includes(timeStr)) {
        slots.push(timeStr);
      }
    }
  }

  return slots.sort();
}

export function buildScheduledAtValue(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}`;
}

export function formatTimeSlotLabel(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
