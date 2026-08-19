// src/features/birthday/UpcomingBirthdaysWidget.tsx
import { Gift } from "lucide-react";
import { format, isToday } from "date-fns";
import { useUpcomingBirthdays } from "./hooks";

export default function UpcomingBirthdaysWidget() {
  const { data, isLoading, isError } = useUpcomingBirthdays();
  const birthdays = data?.birthdays ?? [];

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
      {/* Header */}
     <div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <Gift className="w-5 h-5 text-pink-500" />

    <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
      Upcoming Birthdays
    </h2>
  </div>

  <span className="text-xs text-gray-500">
    Next 7 days (incl. today)
  </span>
</div>

      {/* States */}
      {isLoading ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Loading birthdays…
        </p>
      ) : isError ? (
        <p className="text-sm text-red-600 text-center py-4">
          Failed to load birthdays.
        </p>
      ) : birthdays.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No birthdays coming up 🎉
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {birthdays.map((emp: any) => {
            const dob = new Date(emp.dob);
            const dayLabel = isToday(dob)
              ? "🎂 Today!"
              : format(dob, "MMM d");

            const initials =
              emp.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?";

            return (
              <div
                key={emp.id}
                className="flex items-center justify-between py-3 px-2 hover:bg-pink-50 transition rounded-lg"
              >
                {/* Left: Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-semibold text-sm border border-gray-200">
                    {initials}
                  </div>

                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {emp.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {emp.email}
                    </p>
                  </div>
                </div>

                {/* Right: Date badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                      isToday(dob)
                        ? "bg-pink-100 text-pink-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {dayLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
