import {
  AllowedDaySchedule,
  buildScheduledAtValue,
  formatDateLabel,
  formatTimeSlotLabel,
  getAvailableDates,
  getTimeSlotsForDate,
} from '@libs/util/sushi-schedule';
import { useMemo, useEffect } from 'react';

type SushiSchedulePickerProps = {
  allowedDays: AllowedDaySchedule[];
  storeTimezone: string;
  value: string;
  onChange: (scheduledAt: string) => void;
};

function parseScheduledValue(value: string): { date: string; time: string } {
  if (!value.includes('T')) {
    return { date: '', time: '' };
  }

  const [date, timePart] = value.split('T');
  return { date: date ?? '', time: timePart?.slice(0, 5) ?? '' };
}

export function SushiSchedulePicker({
  allowedDays,
  storeTimezone,
  value,
  onChange,
}: SushiSchedulePickerProps) {
  const availableDates = useMemo(
    () => getAvailableDates(allowedDays, storeTimezone),
    [allowedDays, storeTimezone],
  );

  const parsed = parseScheduledValue(value);
  const selectedDate = availableDates.includes(parsed.date)
    ? parsed.date
    : (availableDates[0] ?? '');

  const timeSlots = useMemo(
    () =>
      selectedDate ? getTimeSlotsForDate(allowedDays, selectedDate, storeTimezone) : [],
    [allowedDays, selectedDate, storeTimezone],
  );

  const selectedTime = timeSlots.includes(parsed.time)
    ? parsed.time
    : (timeSlots[0] ?? '');

  const scheduledAt =
    selectedDate && selectedTime ? buildScheduledAtValue(selectedDate, selectedTime) : '';

  useEffect(() => {
    if (!value && scheduledAt) {
      onChange(scheduledAt);
    }
  }, [value, scheduledAt, onChange]);

  const handleDateChange = (dateStr: string) => {
    const slots = getTimeSlotsForDate(allowedDays, dateStr, storeTimezone);
    const nextTime = slots.includes(selectedTime) ? selectedTime : (slots[0] ?? '');
    onChange(nextTime ? buildScheduledAtValue(dateStr, nextTime) : '');
  };

  const handleTimeChange = (timeStr: string) => {
    onChange(selectedDate && timeStr ? buildScheduledAtValue(selectedDate, timeStr) : '');
  };

  if (!availableDates.length) {
    return (
      <p className="text-sm text-gray-600">
        Pickup and delivery are not available on any upcoming dates. Please check back later.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="text-sm font-medium text-gray-700" htmlFor="scheduled_date">
          Date
        </label>
        <select
          id="scheduled_date"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          required
        >
          {availableDates.map((dateStr) => (
            <option key={dateStr} value={dateStr}>
              {formatDateLabel(dateStr)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700" htmlFor="scheduled_time">
          Time
        </label>
        <select
          id="scheduled_time"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          value={selectedTime}
          onChange={(e) => handleTimeChange(e.target.value)}
          required
          disabled={!timeSlots.length}
        >
          {timeSlots.length === 0 ? (
            <option value="">No times available</option>
          ) : (
            timeSlots.map((timeStr) => (
              <option key={timeStr} value={timeStr}>
                {formatTimeSlotLabel(timeStr)}
              </option>
            ))
          )}
        </select>
      </div>

      <input type="hidden" name="scheduled_at" value={scheduledAt} required />
    </div>
  );
}
