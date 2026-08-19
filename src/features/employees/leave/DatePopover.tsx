import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon, X } from "lucide-react";

export default function DatePopover({
  label,
  value,
  onChange,
  holidays = [],
  workingDays = [1, 2, 3, 4, 5],
  minDate,
  maxDate,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  holidays?: string[];
  workingDays?: number[];
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(
    dayjs(value || new Date())
  );

  const ref = useRef<HTMLDivElement>(null);

  const holidaySet = new Set(holidays);

  // ✅ Dynamic working-day check from HR settings
  const isWorkingDay = (d: dayjs.Dayjs) =>
    workingDays.includes(d.day());

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  // Build grid of days for the month
  const days = [];

  const start = currentMonth
    .startOf("month")
    .startOf("week");

  const end = currentMonth
    .endOf("month")
    .endOf("week");

  let d = start.clone();

  while (d.isBefore(end, "day")) {
    days.push(d);
    d = d.add(1, "day");
  }

  const handleSelect = (d: dayjs.Dayjs) => {
    if (
      !isWorkingDay(d) ||
      holidaySet.has(d.format("YYYY-MM-DD")) ||
      (minDate &&
        d.isBefore(dayjs(minDate), "day")) ||
      (maxDate &&
        d.isAfter(dayjs(maxDate), "day"))
    ) {
      return;
    }

    onChange(d.format("YYYY-MM-DD"));

    setOpen(false);
  };

  // Navigation bounds
  const canGoPrev =
    !minDate ||
    currentMonth
      .startOf("month")
      .isAfter(dayjs(minDate).startOf("month"));

  const canGoNext =
    !maxDate ||
    currentMonth
      .endOf("month")
      .isBefore(dayjs(maxDate).endOf("month"));

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>

      <div className="flex items-center border rounded px-2 py-1.5 bg-white">
        <CalendarIcon
          className={`w-4 h-4 mr-2 cursor-pointer ${
            disabled
              ? "text-gray-300"
              : "text-gray-500 hover:text-indigo-600"
          }`}
          onClick={() =>
            !disabled && setOpen(!open)
          }
        />

        <input
          readOnly
          value={value || ""}
          className="w-full outline-none text-sm bg-transparent cursor-pointer"
          placeholder="Select date"
          onClick={() =>
            !disabled && setOpen(true)
          }
        />

        {value && (
          <X
            className="w-3.5 h-3.5 ml-1 text-gray-400 hover:text-gray-700 cursor-pointer"
            onClick={() => onChange("")}
          />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-3 w-72">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <button
              type="button"
              onClick={() =>
                canGoPrev &&
                setCurrentMonth((m) =>
                  m.subtract(1, "month")
                )
              }
              className={`px-2 py-1 rounded ${
                canGoPrev
                  ? "hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              disabled={!canGoPrev}
            >
              ‹
            </button>

            <span className="font-medium">
              {currentMonth.format("MMMM YYYY")}
            </span>

            <button
              type="button"
              onClick={() =>
                canGoNext &&
                setCurrentMonth((m) =>
                  m.add(1, "month")
                )
              }
              className={`px-2 py-1 rounded ${
                canGoNext
                  ? "hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              disabled={!canGoNext}
            >
              ›
            </button>
          </div>

          {/* Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
            {[
              "Su",
              "Mo",
              "Tu",
              "We",
              "Th",
              "Fr",
              "Sa",
            ].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 text-center text-sm">
            {days.map((day) => {
              const formatted =
                day.format("YYYY-MM-DD");

              // ✅ Dynamic disable logic
              const isDisabled =
                !isWorkingDay(day) ||
                holidaySet.has(formatted) ||
                (minDate &&
                  day.isBefore(
                    dayjs(minDate),
                    "day"
                  )) ||
                (maxDate &&
                  day.isAfter(
                    dayjs(maxDate),
                    "day"
                  ));

              const isSelected =
                value &&
                day.isSame(dayjs(value), "day");

              return (
                <button
                  type="button"
                  key={formatted}
                  onClick={() =>
                    handleSelect(day)
                  }
                  disabled={isDisabled}
                  className={`m-0.5 rounded-md py-1 ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : isDisabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "hover:bg-indigo-50 text-gray-800"
                  }`}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}