import { useState, useMemo } from "react";
import { Bell, Calendar, CalendarDays } from "lucide-react";
import { useHolidays } from "./hooks"; // ✅ reuse existing hook
import { useAuth } from "../../auth/AuthProvider";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

export default function UpcomingHolidaysWidget() {
  const { organization_id } = useAuth();
  const navigate = useNavigate();
  const today = DateTime.now();
  const nextWeek = today.plus({ days: 7 });

  const currentYear = today.year;
  const { data, isLoading } = useHolidays(1, 50, currentYear);

  const holidays = data?.holidays ?? [];

  // ✅ Filter only holidays within next 7 days
  const upcoming = useMemo(() => {
    return holidays
      .filter((h) => {
        const date = DateTime.fromISO(h.date);
        return date >= today && date <= nextWeek;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5); // ✅ show up to 5
  }, [holidays]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
     <div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <Calendar className="h-7 w-7 text-indigo-600" /> 
    
    <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
      Upcoming Holidays
    </h2>
  </div>

  <button
    onClick={() => navigate("/settings/holidays")}
    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
  >
    View All
  </button>
</div>

      {isLoading ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Loading holidays…
        </p>
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No holidays in the next 7 days.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {upcoming.map((h) => {
            const dateObj = DateTime.fromISO(h.date);
            return (
              <li
                key={h.id}
                className="flex items-center justify-between border-b last:border-none pb-2"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-gray-800">{h.name}</span>
                </div>
                <span className="text-gray-600 text-xs">
                  {dateObj.toFormat("ccc, dd LLL")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
