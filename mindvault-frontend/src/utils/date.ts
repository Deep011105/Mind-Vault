// Backend now sends java.time.Instant (UTC, e.g. "2026-07-30T10:15:30.123456Z"),
// not a naive LocalDateTime — so day-keys must be computed from the parsed local
// Date, not by string-slicing the ISO value (which would use the UTC calendar
// day and could shift entries near local midnight, e.g. in India at UTC+5:30).

export function toDayKey(isoDateTime: string): string {
  return formatLocalDayKey(new Date(isoDateTime));
}

export function todayKey(): string {
  return formatLocalDayKey(new Date());
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export const WEEKDAYS = WEEKDAY_SHORT;

export interface CalendarCell {
  date: Date;
  dayKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

// Builds a 6-row (42-cell) month grid starting on Sunday.
export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  const todaysKey = todayKey();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const dayKey = formatLocalDayKey(d);
    cells.push({
      date: d,
      dayKey,
      inCurrentMonth: d.getMonth() === monthIndex,
      isToday: dayKey === todaysKey,
    });
  }
  return cells;
}

export function formatLocalDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatFullDate(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatShortDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
