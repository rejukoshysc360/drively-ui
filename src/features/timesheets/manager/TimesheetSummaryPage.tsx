import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { FileSpreadsheet } from "lucide-react";
import debounce from "lodash/debounce";
import { useEmployeesForTimesheetOrg, useManagedEmployees } from "../../employees/hooks";
import {
  useTimesheetsByEmployeeAndMonth,
  useExportTimesheetsByEmployeeAndMonth,
} from "../hooks";
import { useHolidays } from "../../organizations/settings/hooks";

import TimesheetCalendarPanel from "./TimesheetCalendarPanel";
import TimeInformationTable from "./TimeInformationTable";
import ProjectsTasksSection from "./ProjectsTasksSection";
import { useCan } from "../../..//utils/permissions";
import { useRoles } from "../../../utils/useRoles";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default function TimesheetSummaryPage() {

   const can = useCan();
   const canViewAll = can("timesheets:view");

     // 🔒 Block entire page for non-HR/admin
  if (!canViewAll) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-.01-10a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            You do not have permission to view this page. Please contact your HR or
            administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }


  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonth = dayjs().add(monthOffset, "month");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const selectedWeekNumber = selectedDate.isoWeek();

  // Employee selection
  const [searchText, setSearchText] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null); 

  const { isManager } = useRoles();


const { data: employeeListData } = isManager
  ? useManagedEmployees(
      1,
      10,
      searchText,
      {
        crossOrg: true,
      }
    )
  : useEmployeesForTimesheetOrg(
      1,
      10,
      searchText
    );

  const employeeOptions =
    employeeListData?.employees?.map((e: any) => ({
      value: e.id,
      label: `${e.full_name} (${e.email})`,
      fullName: e.full_name,
    })) || [];

  const loadEmployeeOptions = useCallback(
    debounce((inputValue: string, callback: any) => {
      setSearchText(inputValue);
      callback(employeeOptions);
    }, 300),
    [employeeOptions]
  );

  // Fetch timesheets for the entire month
  const { data: employeeTimesheets = [], isLoading } = useTimesheetsByEmployeeAndMonth(
    selectedEmployee?.value,
    currentMonth.year(),
    currentMonth.month() + 1
  );

  const exportMutation = useExportTimesheetsByEmployeeAndMonth();

  // Holidays
  const { data: holidaysData } = useHolidays(1, 200, dayjs().year());

  const extractHolidayDates = (src: any): Set<string> => {
    if (!src) return new Set();
    const arr = Array.isArray(src)
      ? src
      : src?.holidays || src?.items || src?.data || [];
    const dates = (Array.isArray(arr) ? arr : [src])
      .map((h: any) => {
        const raw = typeof h === "string" || h instanceof Date ? h : h?.date ?? h?.day ?? null;
        const d = raw ? dayjs(raw) : null;
        return d?.isValid() ? d.format("YYYY-MM-DD") : null;
      })
      .filter(Boolean);
    return new Set(dates as string[]);
  };

  const holidaySet = extractHolidayDates(holidaysData);

  const selectedWeekStart = selectedDate.startOf("week").add(1, "day"); // Monday
  const selectedWeekEnd = selectedDate.endOf("week").add(1, "day");     // Sunday

  // Compute how many timesheet entries exist in the actual export range
  const entriesInPeriod = useMemo(() => {
    if (!Array.isArray(employeeTimesheets) || employeeTimesheets.length === 0) return { week: 0, month: 0 };

    const weekStartStr = selectedWeekStart.format("YYYY-MM-DD");
    const weekEndStr = selectedWeekEnd.format("YYYY-MM-DD");
    const monthStartStr = currentMonth.startOf("month").format("YYYY-MM-DD");
    const monthEndStr = currentMonth.endOf("month").format("YYYY-MM-DD");

    let weekCount = 0;
    let monthCount = 0;

    for (const entry of employeeTimesheets) {
      const date = entry.date;
      if (!date) continue;

      if (dayjs(date).isSameOrAfter(weekStartStr) && dayjs(date).isSameOrBefore(weekEndStr)) {
        weekCount++;
      }
      if (dayjs(date).isSameOrAfter(monthStartStr) && dayjs(date).isSameOrBefore(monthEndStr)) {
        monthCount++;
      }
    }

    return { week: weekCount, month: monthCount };
  }, [employeeTimesheets, selectedWeekStart, selectedWeekEnd, currentMonth]);

  // Final disable logic
  const hasSelectedEmployee = !!selectedEmployee?.value;
  const hasWeekData = entriesInPeriod.week > 0;
  const hasMonthData = entriesInPeriod.month > 0;
  const isExporting = exportMutation.isPending;

  const disableWeekDownload = !hasSelectedEmployee || !hasWeekData || isExporting;
  const disableMonthDownload = !hasSelectedEmployee || !hasMonthData || isExporting;

  const handleDownloadExcel = async (type: "week" | "month") => {
    if (!hasSelectedEmployee) {
      alert("Please select an employee first.");
      return;
    }

    const from =
      type === "week"
        ? selectedWeekStart.format("YYYY-MM-DD")
        : currentMonth.startOf("month").format("YYYY-MM-DD");

    const to =
      type === "week"
        ? selectedWeekEnd.format("YYYY-MM-DD")
        : currentMonth.endOf("month").format("YYYY-MM-DD");

    exportMutation.mutate(
      { employeeId: selectedEmployee.value, from, to },
      {
        onSuccess: (blob) => {
          const name = selectedEmployee.label.split("(")[0].trim();
          const fileName =
            type === "week"
              ? `Timesheet_${name}_${from}_to_${to}.xlsx`
              : `Timesheet_${name}_${currentMonth.format("YYYY-MM")}.xlsx`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        onError: () => alert("Export failed. Try again."),
      }
    );
  };

  // Calendar status map (unchanged)
  const statusByDate = useMemo(() => {
    const map: Record<string, string> = {};
    employeeTimesheets.forEach((t: any) => {
      map[t.date] = t.status;
    });

    const today = dayjs().startOf("day");
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    let d = startOfMonth.startOf("week").add(1, "day");
    const endGrid = endOfMonth.endOf("week").add(1, "day");

    while (d.isBefore(endGrid, "day")) {
      const key = d.format("YYYY-MM-DD");
      const isWeekend = d.day() === 0 || d.day() === 6;
      const isHoliday = holidaySet.has(key);

      if (d.isBefore(today, "day") && !isWeekend && !isHoliday && !map[key]) {
        map[key] = "due";
      }
      d = d.add(1, "day");
    }

    return map;
  }, [employeeTimesheets, currentMonth, holidaySet]);

  return (
    <div className="bg-gray-50 min-h-screen p-2 md:p-4 text-gray-800">
      {/* Header */}
{/* Header */}

<div className="mb-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
      Timesheet Summary
    </h1>

    {hasSelectedEmployee && (
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => handleDownloadExcel("week")}
          disabled={disableWeekDownload}
          className={`
            inline-flex items-center gap-2 
            px-4 py-2 
            rounded-lg text-sm font-medium 
            shadow-sm transition-colors
            ${disableWeekDownload 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
            }
          `}
          title="Download current selected week"
        >
          <FileSpreadsheet size={18} />
          Week
        </button>

        <button
          onClick={() => handleDownloadExcel("month")}
          disabled={disableMonthDownload}
          className={`
            inline-flex items-center gap-2 
            px-4 py-2 
            rounded-lg text-sm font-medium 
            shadow-sm transition-colors
            ${disableMonthDownload 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
            }
          `}
          title="Download current month"
        >
          <FileSpreadsheet size={18} />
          Month
        </button>
      </div>
    )}
  </div> 
</div>
{!hasSelectedEmployee && (
  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-6">
    <p className="font-medium">
      Please select an employee to view timesheets.
    </p>
    <p className="text-sm mt-1 text-amber-700">
      To view employees under another organization, please change your selected organization.
    </p>
  </div>
)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TimesheetCalendarPanel
          employeeOptions={employeeOptions}
          loadEmployeeOptions={loadEmployeeOptions}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          selectedWeekNumber={selectedWeekNumber}
          currentMonth={currentMonth}
          setMonthOffset={setMonthOffset}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          statusByDate={statusByDate}
          searchText={searchText}
        />

        <div className="space-y-4 lg:col-span-2">
          <TimeInformationTable
            selectedWeekStart={selectedWeekStart}
            employeeTimesheets={employeeTimesheets}
          />
          <ProjectsTasksSection
            employeeTimesheets={employeeTimesheets}
            selectedWeekStart={selectedWeekStart}
            selectedWeekEnd={selectedWeekEnd}
            isLoading={isLoading}
            employeeId={selectedEmployee?.value}
          />
        </div>
      </div>
    </div>
  );
}