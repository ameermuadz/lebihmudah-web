"use client";

import { useEffect, useRef, useState } from "react";
import type { BookingConfirmation } from "@/lib/types";

type BookingOwnership = "me" | "other";

type CalendarCell = {
  date: Date;
  isoDate: string;
  dayNumber: number;
  bookingState: BookingOwnership | null;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isInSelectedRange: boolean;
  isDisabled: boolean;
};

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  minDate?: string;
  bookings?: BookingConfirmation[];
  currentUserId?: string | null;
  onChange: (next: { startDate: string; endDate: string }) => void;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const parseIsoDate = (value: string) => {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const getMonthDays = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const formatDateLabel = (value: string) => {
  const parsedDate = parseIsoDate(value);

  if (!parsedDate) {
    return value;
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
  }).format(date);

const CalendarIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M7 3.5v3" />
    <path d="M17 3.5v3" />
    <path d="M3.5 9h17" />
  </svg>
);

const LegendItem = ({
  colorClassName,
  label,
}: {
  colorClassName: string;
  label: string;
}) => (
  <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-950">
    <span className={`h-2.5 w-2.5 rounded-full ${colorClassName}`} />
    <span>{label}</span>
  </div>
);

export default function DateRangePicker({
  startDate,
  endDate,
  minDate,
  bookings = [],
  currentUserId,
  onChange,
}: DateRangePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const todayIso = toIsoDate(new Date());
  const effectiveMinDate = minDate && minDate > todayIso ? minDate : todayIso;
  const initialMonthReference =
    parseIsoDate(startDate || effectiveMinDate) ?? new Date();

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(initialMonthReference),
  );

  useEffect(() => {
    const referenceDate =
      parseIsoDate(startDate || effectiveMinDate) ?? new Date();
    setCurrentMonth(startOfMonth(referenceDate));
  }, [effectiveMinDate, startDate]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getBookingState = (isoDate: string): BookingOwnership | null => {
    const ownedBooking = bookings.find(
      (booking) =>
        booking.status === "CONFIRMED" &&
        booking.userId === currentUserId &&
        isoDate >= booking.moveInDate &&
        isoDate < booking.moveOutDate,
    );

    if (ownedBooking) {
      return "me";
    }

    const bookedByOther = bookings.find(
      (booking) =>
        booking.status === "CONFIRMED" &&
        isoDate >= booking.moveInDate &&
        isoDate < booking.moveOutDate,
    );

    return bookedByOther ? "other" : null;
  };

  const monthStart = startOfMonth(currentMonth);
  const leadingEmptyCells = monthStart.getDay();
  const monthDays = getMonthDays(currentMonth);
  const trailingEmptyCells = (7 - ((leadingEmptyCells + monthDays) % 7)) % 7;

  const calendarCells: Array<CalendarCell | null> = Array.from(
    { length: leadingEmptyCells + monthDays + trailingEmptyCells },
    (_, index) => {
      if (index < leadingEmptyCells || index >= leadingEmptyCells + monthDays) {
        return null;
      }

      const dayNumber = index - leadingEmptyCells + 1;
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        dayNumber,
      );
      const isoDate = toIsoDate(date);

      return {
        date,
        isoDate,
        dayNumber,
        bookingState: getBookingState(isoDate),
        isSelectedStart: isoDate === startDate,
        isSelectedEnd: isoDate === endDate,
        isInSelectedRange:
          Boolean(startDate && endDate) &&
          isoDate > startDate &&
          isoDate < endDate,
        isDisabled: isoDate < effectiveMinDate,
      };
    },
  );

  const selectedLabel = startDate
    ? endDate
      ? `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
      : `${formatDateLabel(startDate)} · choose move-out date`
    : "Select move-in and move-out dates";

  const handleDaySelect = (isoDate: string) => {
    if (isoDate < effectiveMinDate) {
      return;
    }

    if (!startDate || endDate) {
      onChange({ startDate: isoDate, endDate: "" });
      return;
    }

    if (isoDate <= startDate) {
      onChange({ startDate: isoDate, endDate: "" });
      return;
    }

    onChange({ startDate, endDate: isoDate });
  };

  const renderDayClassName = (cell: CalendarCell) => {
    const hasSelection =
      cell.isSelectedStart || cell.isSelectedEnd || cell.isInSelectedRange;

    if (cell.isDisabled) {
      return "cursor-not-allowed text-zinc-300 dark:text-zinc-700";
    }

    if (cell.bookingState && hasSelection) {
      return `${
        cell.bookingState === "me"
          ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-100"
          : "bg-rose-100 text-rose-950 dark:bg-rose-950/70 dark:text-rose-100"
      } ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950`;
    }

    if (cell.isSelectedStart || cell.isSelectedEnd) {
      return "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-500";
    }

    if (cell.isInSelectedRange) {
      return "bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100";
    }

    if (cell.bookingState === "me") {
      return "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500";
    }

    if (cell.bookingState === "other") {
      return "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-500";
    }

    return "bg-white text-zinc-900 hover:bg-emerald-50 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900";
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
          isOpen
            ? "border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-50"
            : "border-zinc-300 bg-white text-zinc-900 hover:border-emerald-300 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-emerald-700 dark:hover:bg-zinc-900"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Stay dates
          </p>
          <p className="truncate text-sm font-medium">{selectedLabel}</p>
        </div>
        <CalendarIcon className="h-5 w-5 shrink-0" />
      </button>

      {isOpen ? (
        <div className="mt-3 w-full rounded-[28px] border border-zinc-200 bg-white p-4 shadow-[0_28px_100px_-45px_rgba(0,0,0,0.5)] dark:border-zinc-700 dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Choose your stay
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Move-out is the checkout day.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth((current) => addMonths(current, -1))
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                aria-label="Previous month"
              >
                <span className="text-lg">‹</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth((current) => addMonths(current, 1))
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                aria-label="Next month"
              >
                <span className="text-lg">›</span>
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {formatMonthLabel(currentMonth)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {startDate && endDate
                  ? `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`
                  : "Pick a start date first"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            <LegendItem colorClassName="bg-blue-500" label="You are choosing" />
            <LegendItem colorClassName="bg-emerald-500" label="Booked by you" />
            <LegendItem colorClassName="bg-rose-500" label="Booked by others" />
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarCells.map((calendarCell, index) => {
              if (!calendarCell) {
                return (
                  <span
                    key={`empty-${index}`}
                    aria-hidden="true"
                    className="h-11 rounded-xl"
                  />
                );
              }

              const bookingStateLabel =
                calendarCell.bookingState === "me"
                  ? "Booked by you"
                  : calendarCell.bookingState === "other"
                    ? "Booked by another guest"
                    : null;
              const selectedStateLabel = calendarCell.isSelectedStart
                ? "Selected move-in date"
                : calendarCell.isSelectedEnd
                  ? "Selected move-out date"
                  : calendarCell.isInSelectedRange
                    ? "Selected stay range"
                    : null;

              return (
                <button
                  key={calendarCell.isoDate}
                  type="button"
                  onClick={() => handleDaySelect(calendarCell.isoDate)}
                  disabled={calendarCell.isDisabled}
                  aria-pressed={
                    calendarCell.isSelectedStart ||
                    calendarCell.isSelectedEnd ||
                    calendarCell.isInSelectedRange
                  }
                  aria-label={[
                    `Select ${formatDateLabel(calendarCell.isoDate)}`,
                    selectedStateLabel,
                    bookingStateLabel,
                  ]
                    .filter(Boolean)
                    .join(". ")}
                  className={`relative flex h-11 items-center justify-center rounded-xl text-sm font-medium transition ${renderDayClassName(
                    calendarCell,
                  )}`}
                >
                  {calendarCell.dayNumber}
                  {calendarCell.bookingState ? (
                    <span
                      className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${
                        calendarCell.bookingState === "me"
                          ? "bg-emerald-100"
                          : "bg-rose-100"
                      }`}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onChange({ startDate: "", endDate: "" })}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Clear dates
            </button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Select move-in first, then select move-out in the same calendar.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
