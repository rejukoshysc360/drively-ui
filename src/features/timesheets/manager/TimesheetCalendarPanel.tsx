import dayjs from "dayjs";
import Select from "react-select";
import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { useHolidays } from "../../../features/organizations/settings/hooks";
import { useEmployeesForTimesheetOrg, useManagedEmployees } from "../../../features/employees/hooks";
import { useRoles } from "../../..//utils/useRoles";

export default function TimesheetCalendarPanel({
  selectedEmployee,
  setSelectedEmployee,
  selectedWeekNumber,
  currentMonth,
  setMonthOffset,
  selectedDate,
  setSelectedDate,
  statusByDate,
}: any) {
  const { data: org } = useOrganization();
  const currentYear = dayjs().year();
  const { data: holidaysData } = useHolidays(1, 200, currentYear);
  const mode = org?.working_time_settings?.TIMESHEET_ENTRY_MODE;

  const { isManager } = useRoles();

  // 🔍 Employee search (stable Select instead of AsyncSelect)
// 🔍 Employee search (timesheet-org aware)
const [searchText, setSearchText] = useState("");

const effectiveSearch =
  searchText.length >= 3 ? searchText.trim() : "";

 const { data: employeeResults, isLoading: isSearching } = isManager
  ? useManagedEmployees(
      1,
      50,
      effectiveSearch,
      {
        crossOrg: true,
      }
    )
  : useEmployeesForTimesheetOrg(
      1,
      50,
      effectiveSearch
    );

const employeeOptions =
  employeeResults?.employees?.map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email || ""})`,
  })) || [];
  
  // 🧩 Normalize holidays
  const extractHolidayDates = (src: any): string[] => {
    if (!src) return [];
    let arr: any[] | null = Array.isArray(src) ? src : null;
    if (!arr && Array.isArray(src?.holidays)) arr = src.holidays;
    if (!arr && Array.isArray(src?.items)) arr = src.items;
    if (!arr && Array.isArray(src?.data)) arr = src.data;
    if (!arr) arr = [src];
    return Array.from(
      new Set(
        arr
          .map((h: any) => {
            const raw =
              typeof h === "string" || h instanceof Date
                ? h
                : h?.date ?? h?.day ?? null;
            const d = raw ? dayjs(raw) : null;
            return d?.isValid() ? d.format("YYYY-MM-DD") : null;
          })
          .filter(Boolean)
      )
    );
  };

  const holidayList = extractHolidayDates(holidaysData);
  const holidaySet = new Set(holidayList);

  // 📅 Calendar grid generation
  const generateCalendarDays = (ref: dayjs.Dayjs) => {
    const start = ref.startOf("month");
    const end = ref.endOf("month");
    const startGrid = start.startOf("isoWeek");
    const endGrid = end.endOf("isoWeek");
    const days: { date: dayjs.Dayjs; isCurrentMonth: boolean }[] = [];

    let d = startGrid.clone();
    while (d.isSameOrBefore(endGrid, "day")) {
      days.push({ date: d.clone(), isCurrentMonth: d.month() === ref.month() });
      d = d.add(1, "day");
    }
    return days;

  };

  const allDays = generateCalendarDays(currentMonth);
  const weekRows: Array<Array<{ date: dayjs.Dayjs; isCurrentMonth: boolean }>> = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weekRows.push(allDays.slice(i, i + 7));
  }

  const selectedWeekStart = selectedDate.startOf("week").add(1, "day");
  const selectedWeekEnd = selectedDate.endOf("week").add(1, "day");

    const configuredWorkingDays = org?.working_time_settings?.working_days || [];

  const isWeekend = (d: dayjs.Dayjs) => {
    const dayName = d.format("dddd").toUpperCase();
    return !configuredWorkingDays.includes(dayName);
  };
  const isHolidayDay = (d: dayjs.Dayjs) => holidaySet.has(d.format("YYYY-MM-DD"));

  const isRestricted = (d: dayjs.Dayjs, isHoliday: boolean) => {
    if (!mode || mode === "OPEN") return false;
    if (mode === "RESTRICT_HOLIDAYS") return isHoliday;
    if (mode === "RESTRICT_ALL") return isHoliday || isWeekend(d);
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Employee Selector */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Employee</p>
            <Select
              options={employeeOptions}
              value={selectedEmployee}
              onChange={(opt) => setSelectedEmployee(opt)}
              onInputChange={(input) => setSearchText(input)}
              placeholder="Type to search (min 3 chars)..."
              isSearchable
              isClearable
              isLoading={isSearching}
              noOptionsMessage={() =>
                searchText.length < 3
                  ? "Type at least 3 characters"
                  : "No employees found"
              }
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "0.5rem",
                  borderColor: "#d1d5db",
                  minHeight: "36px",
                  boxShadow: "none",
                }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>
          <div className="text-right pl-4">
            <p className="text-sm text-gray-500">Week No.</p>
            <h2 className="text-xl font-bold text-gray-800">{selectedWeekNumber}</h2>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setMonthOffset((v: number) => v - 1)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-medium text-gray-800">{currentMonth.format("MMM YYYY")}</h3>
          <button
            onClick={() => setMonthOffset((v: number) => v + 1)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Week headers */}
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex flex-col gap-1">
          {weekRows.map((week, rowIdx) => {
            const rowStart = week[0]?.date;
            const rowEnd = week[week.length - 1]?.date;
            const highlight =
              rowStart &&
              rowEnd &&
              selectedWeekStart.isSameOrBefore(rowEnd, "day") &&
              selectedWeekEnd.isSameOrAfter(rowStart, "day");

            return (
              <div
                key={rowIdx}
                className={`grid grid-cols-7 gap-1 rounded-lg transition-all ${
                  highlight ? "bg-indigo-50 ring-1 ring-indigo-200" : ""
                }`}
              >
                {week.map(({ date, isCurrentMonth }) => {
                  const isSelected = date.isSame(selectedDate, "day");
                  const isToday = dayjs().isSame(date, "day");
                  const isHoliday = isHolidayDay(date);
                  const restricted = isRestricted(date, isHoliday);
                  const status = selectedEmployee?.value
                    ? statusByDate[date.format("YYYY-MM-DD")]
                    : null;

                  return (
                    <div
                      key={date.toString()}
                      onClick={() => {
                        if (!restricted) setSelectedDate(date);
                      }}
                      className={`relative flex items-center justify-center h-9 w-full rounded-md text-sm font-medium transition-all overflow-hidden
                        ${
                          restricted
                            ? "cursor-not-allowed"
                            : "cursor-pointer hover:ring-1 hover:ring-indigo-300"
                        }
                        ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : isToday
                            ? "border border-indigo-400 text-indigo-700"
                            : isCurrentMonth
                            ? "text-gray-800"
                            : "text-gray-300"
                        }`}
                    >
                      <span className="z-10">{date.date()}</span>

                      {restricted && (
                        <div
                          className={`absolute inset-0 ${
                            isHoliday
                              ? "bg-rose-100/70"
                              : isWeekend(date)
                              ? "bg-gray-100/60"
                              : "bg-amber-100/50"
                          }`}
                        />
                      )}

                      {restricted && (
                        <AlertTriangle
                          size={10}
                          className={`absolute top-0.5 left-0.5 z-10 ${
                            isHoliday
                              ? "text-rose-500"
                              : isWeekend(date)
                              ? "text-slate-500"
                              : "text-amber-500"
                          }`}
                        />
                      )}

                      {status && (
                        <span
                          className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-sm z-10 ${
                            status === "approved"
                              ? "bg-green-500"
                              : status === "submitted"
                              ? "bg-blue-500"
                              : status === "rejected"
                              ? "bg-red-500"
                              : status === "edit_requested"
                              ? "bg-fuchsia-400"
                              : "bg-amber-300"
                          }`}
                        ></span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-medium mb-3">Legend</h3>
        <div className="space-y-2 text-sm">
          <Legend color="bg-amber-300" label="Due" />
          <Legend color="bg-blue-500" label="Submitted" />
          <Legend color="bg-green-500" label="Approved" />
          <Legend color="bg-red-500" label="Rejected" />
          <Legend color="bg-fuchsia-300" label="Edit Requested" />
          <div className="flex items-center gap-2 mt-3">
            <AlertTriangle size={12} className="text-rose-500" />
            <span className="text-gray-600">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-slate-500" />
            <span className="text-gray-600">Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
