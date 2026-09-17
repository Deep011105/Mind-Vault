import { buildMonthGrid, monthLabel, WEEKDAYS } from '../utils/date';

interface CalendarProps {
  year: number;
  monthIndex: number; // 0-11
  entryCountByDay: Record<string, number>;
  selectedDayKey: string | null;
  onSelectDay: (dayKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function Calendar({
  year,
  monthIndex,
  entryCountByDay,
  selectedDayKey,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarProps) {
  const cells = buildMonthGrid(year, monthIndex);

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised shadow-soft dark:shadow-soft-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="font-display text-xl text-ink dark:text-mist tracking-tight">
          {monthLabel(year, monthIndex)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="mr-1 rounded-full border border-ink/10 dark:border-mist/15 px-3 py-1 text-xs font-medium text-ink-soft dark:text-mist-soft hover:border-moss-400/50 hover:text-moss-600 dark:hover:text-moss-400 transition-colors"
          >
            Today
          </button>
          <button
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={onNextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 px-3">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center font-mono text-[10px] uppercase tracking-wider text-ink-faint dark:text-mist-soft/70">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1 px-3 pb-4">
        {cells.map((cell) => {
          const count = entryCountByDay[cell.dayKey] ?? 0;
          const isSelected = selectedDayKey === cell.dayKey;
          return (
            <button
              key={cell.dayKey}
              onClick={() => onSelectDay(cell.dayKey)}
              className={`relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm transition-all
                ${!cell.inCurrentMonth ? 'text-ink-faint/40 dark:text-mist-soft/25' : 'text-ink dark:text-mist'}
                ${isSelected ? 'bg-moss-600 text-white shadow-sm' : cell.isToday ? 'ring-1 ring-moss-400/60' : 'hover:bg-ink/5 dark:hover:bg-mist/10'}
              `}
            >
              <span className={cell.isToday && !isSelected ? 'font-semibold text-moss-600 dark:text-moss-400' : ''}>
                {cell.date.getDate()}
              </span>
              {count > 0 && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-moss-500 dark:bg-moss-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
