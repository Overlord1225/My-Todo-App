"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { format } from "date-fns";

type DatePickerProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  name?: string;
  label?: string;
  className?: string;
  compact?: boolean;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date | null, b: Date | null) {
  return Boolean(
    a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  );
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

export default function DatePicker({
  value,
  onChange,
  name,
  label = "Due date",
  className = "",
  compact = false,
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState<string | null>(value ?? null);
  const currentValue = value !== undefined ? value : internalValue;
  const selectedDate = toDate(currentValue);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const today = useMemo(() => new Date(), []);
  const displayValue = selectedDate ? format(selectedDate, compact ? "MMM d" : "MMM d, yyyy") : label;

  const selectDate = (date: Date) => {
    const nextValue = toDateValue(date);
    setInternalValue(nextValue);
    setVisibleMonth(date);
    onChange?.(nextValue);
    setOpen(false);
  };

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const clearDate = () => {
    setInternalValue(null);
    onChange?.(null);
    setOpen(false);
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={currentValue ?? ""} />}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          compact ? "h-9 px-3" : "h-11 px-3.5"
        } ${selectedDate ? "pr-9" : ""}`}
        aria-expanded={open}
        aria-label={label}
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={`min-w-0 flex-1 truncate ${selectedDate ? "text-slate-900" : "text-slate-500"}`}>
          {displayValue}
        </span>
      </button>
      {selectedDate && (
        <button
          type="button"
          onClick={clearDate}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${
            compact ? "" : "right-2.5"
          }`}
          aria-label="Clear due date"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900">{format(visibleMonth, "MMMM yyyy")}</p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
            {weekDays.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = sameDay(date, selectedDate);
              const isToday = sameDay(date, today);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`flex h-8 items-center justify-center rounded-md text-sm transition ${
                    isSelected
                      ? "bg-blue-600 font-semibold text-white hover:bg-blue-700"
                      : "hover:bg-slate-100"
                  } ${
                    !isSelected && isCurrentMonth ? "text-slate-700" : "text-slate-300"
                  } ${!isSelected && isToday ? "ring-1 ring-blue-200 text-blue-700" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={clearDate}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
