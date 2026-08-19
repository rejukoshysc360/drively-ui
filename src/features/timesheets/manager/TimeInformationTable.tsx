import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { useHolidays } from "../../../features/organizations/settings/hooks";

export default function TimeInformationTable({
  selectedWeekStart,
  employeeTimesheets,
}: any) {
  const { data: org } = useOrganization();
  const currentYear = dayjs().year();
  const { data: holidaysData } = useHolidays(1, 200, currentYear);

  const mode = org?.working_time_settings?.TIMESHEET_ENTRY_MODE;

  // ✅ Get contracted hours dynamically from org settings
  const dailyHours =
    org?.working_time_settings?.DAILY_WORKING_HOURS ??
    org?.working_time_settings?.ORG_DAILY_HOURS ??
    9;

  const workingDays =
    org?.working_time_settings?.working_days ??
    ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  // 🧩 Extract holidays robustly
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
            if (!raw) return null;
            const d = dayjs(raw);
            return d.isValid() ? d.format("YYYY-MM-DD") : null;
          })
          .filter(Boolean)
      )
    );
  };

  const holidayList = extractHolidayDates(holidaysData);
  const holidaySet = new Set(holidayList);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    selectedWeekStart.add(i, "day")
  );

  // ✅ Consistent helpers
  const isWeekend = (d: dayjs.Dayjs) => {
    const dayName = d.format("dddd").toUpperCase();
    return !workingDays.includes(dayName);
  };

  const isHolidayDay = (d: dayjs.Dayjs) => holidaySet.has(d.format("YYYY-MM-DD"));

  const isRestricted = (d: dayjs.Dayjs): boolean => {
    const holiday = isHolidayDay(d);
    if (!mode || mode === "OPEN") return false;
    if (mode === "RESTRICT_HOLIDAYS") return holiday;
    if (mode === "RESTRICT_ALL") return holiday || isWeekend(d);
    return false;
  };

  // 🧮 Compute dynamic data arrays
  const dailyData = weekDays.map((d) => {
    const record = employeeTimesheets?.find(
      (t: any) => dayjs(t.date).format("YYYY-MM-DD") === d.format("YYYY-MM-DD")
    );
    return record?.total_hours || 0;
  });

  const std = dailyData;

  // Dynamic calculations based on contracted hours
  const overtime = std.map((h) => (h > dailyHours ? h - dailyHours : 0));
  const absence = std.map((h, i) =>
    isWeekend(weekDays[i]) || isHolidayDay(weekDays[i])
      ? 0
      : Math.max(0, dailyHours - Math.min(h, dailyHours))
  );
  const invoicable = std.map((h) => Math.min(h, dailyHours));
  const invoicablePct = invoicable.map((h) =>
    ((h / dailyHours) * 100).toFixed(0)
  );

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const totalStd = sum(std);
  const totalOt = sum(overtime);
  const totalAbs = sum(absence);
  const totalInv = sum(invoicable);

  // ✅ Contracted hours exclude weekends & holidays
  const contractedHours = weekDays.map((d) =>
    isWeekend(d) || isHolidayDay(d) ? 0 : dailyHours
  );
  const totalContracted = sum(contractedHours);

  const totalPct = (totalInv / totalContracted) * 100;

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Time Information</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={16} className="mr-1" />
          Week Total:
          <span className="ml-1 font-semibold text-gray-800">
            {totalStd.toFixed(1)}h
          </span>
        </div>
      </div>

      <table className="min-w-[700px] text-sm border-t border-gray-200 relative">
        <thead>
          <tr className="text-gray-500 text-center">
            <th className="text-left py-2">Metric</th>
            {weekDays.map((d) => {
              const holiday = isHolidayDay(d);
              const restricted = isRestricted(d);
              return (
                <th
                  key={d.toString()}
                  className="px-2 py-1 whitespace-nowrap text-center relative"
                >
                  {restricted && (
                    <div
                      className={`absolute inset-0 -z-0 ${
                        holiday
                          ? "bg-rose-100/60"
                          : isWeekend(d)
                          ? "bg-gray-200/50"
                          : ""
                      }`}
                    ></div>
                  )}
                  <div className="font-medium relative z-10">{d.format("ddd")}</div>
                  <div className="text-gray-400 text-[11px] mt-[1px] relative z-10">
                    {d.format("DD/MM")}
                  </div>
                </th>
              );
            })}
            <th className="px-2 py-2">Week</th>
          </tr>
        </thead>

        <tbody>
          {[
            { label: "Standard Hours", values: std, total: totalStd },
            { label: "Overtime STD", values: overtime, total: totalOt },
            { label: "Absence", values: absence, total: totalAbs },
            {
              label: "Contracted Hours",
              values: contractedHours,
              total: totalContracted,
            },
            { label: "Invoicable", values: invoicable, total: totalInv },
            { label: "Invoicable %", values: invoicablePct, total: totalPct },
          ].map((row) => (
            <tr key={row.label} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="font-medium text-gray-700 py-2">{row.label}</td>
              {row.values.map((v: any, i: number) => {
                const d = weekDays[i];
                const holiday = isHolidayDay(d);
                const restricted = isRestricted(d);
                return (
                  <td key={i} className="text-center text-gray-800 relative">
                    {restricted && (
                      <div
                        className={`absolute inset-0 -z-0 ${
                          holiday
                            ? "bg-rose-100/60"
                            : isWeekend(d)
                            ? "bg-gray-200/50"
                            : ""
                        }`}
                      ></div>
                    )}
                    <span className="relative z-10">
                      {typeof v === "number" ? v.toFixed(1) : v}
                      {row.label !== "Invoicable %" ? "h" : "%"}
                    </span>
                  </td>
                );
              })}
              <td className="text-center font-semibold text-gray-900">
                {row.label !== "Invoicable %"
                  ? `${row.total.toFixed(1)} h`
                  : `${row.total.toFixed(1)} %`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
