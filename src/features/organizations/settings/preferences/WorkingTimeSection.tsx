import { useState, useEffect } from "react";
import { Save, RefreshCcw, Lock } from "lucide-react";
import ModernTimeSelect from "../../../../components/ui/ModernTimeSelect";
import { useOrganization, useUpdateOrganizationSettings } from "./hooks";
import { useCan } from "../../../../utils/permissions";

export default function WorkingTimeSection() {
  const { data, isLoading } = useOrganization();
  const updateSettings = useUpdateOrganizationSettings();
  const can = useCan();

  const canView = can("organization:view");
  const canUpdate = can("organization:update");

  const [workingTime, setWorkingTime] = useState<any>({});

  const allDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  useEffect(() => {
    if (data?.working_time_settings) {
      const wt = { ...data.working_time_settings };
      if ("weekend_days" in wt) delete wt.weekend_days;
      if (!wt.working_days) {
        wt.working_days = [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ];
      }
      setWorkingTime(wt);
    }
  }, [data]);

  const handleWorkingChange = (key: string, value: any) => {
    if (!canUpdate) return;
      setWorkingTime((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleWorkingDay = (day: string) => {
    if (!canUpdate) return;
    const current = workingTime.working_days || [];
    const exists = current.includes(day);
    const updated = exists
      ? current.filter((d: string) => d !== day)
      : [...current, day];
    handleWorkingChange("working_days", updated);
  };

  const handleSave = async () => {
    if (!canUpdate) return;
    const clean = { ...workingTime };
    if ("weekend_days" in clean) delete clean.weekend_days;
    await updateSettings.mutateAsync({ working_time_settings: clean });
  };

  if (!canView) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">You don’t have permission to view working time settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading working time settings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-900">Working Time Settings</h3>

            {!canUpdate && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Lock className="w-4 h-4" />
                View-only access
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Working Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Start Time
              </label>
              <ModernTimeSelect
                value={workingTime.ORG_WORKING_START_TIME || ""}
                onChange={(v) => handleWorkingChange("ORG_WORKING_START_TIME", v)}
                label="Select start time"
                disabled={!canUpdate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working End Time
              </label>
              <ModernTimeSelect
                value={workingTime.ORG_WORKING_END_TIME || ""}
                onChange={(v) => handleWorkingChange("ORG_WORKING_END_TIME", v)}
                label="Select end time"
                disabled={!canUpdate}
              />
            </div>
          </div>

          {/* Daily Working Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Working Hours (Contracted hours)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={workingTime.ORG_DAILY_HOURS || ""}
              onChange={(e) =>
                handleWorkingChange("ORG_DAILY_HOURS", Number(e.target.value) || 0)
              }
              disabled={!canUpdate}
              className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                canUpdate
                  ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
              placeholder="e.g. 8"
            />
          </div>

          {/* Payroll Working Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payroll Working Days in Month
            </label>
            <input
              type="number"
              min="20"
              max="31"
              value={workingTime.PAYROLL_WORKING_DAYS_IN_MONTH || ""}
              onChange={(e) =>
                handleWorkingChange(
                  "PAYROLL_WORKING_DAYS_IN_MONTH",
                  Number(e.target.value) || 0
                )
              }
              disabled={!canUpdate}
              className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                canUpdate
                  ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
              placeholder="e.g. 22"
            />
          </div>

          {/* Clock Out Reminder Cutoff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clock-Out Reminder Cutoff
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={workingTime.CLOCK_OUT_REMINDER_MINUTES || ""}
              onChange={(e) =>
                handleWorkingChange(
                  "CLOCK_OUT_REMINDER_MINUTES",
                  Number(e.target.value) || 0
                )
              }
              disabled={!canUpdate}
              className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                canUpdate
                  ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
              placeholder="e.g. 10"
            />

            <p className="text-sm text-gray-500 mt-2">
              Employees will receive a reminder if they have not clocked out after this
              many minutes past their shift end time (including overtime if enabled).
            </p>
          </div>
          {/* Late By Cutoff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Late Attendance Cutoff
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={workingTime.LATE_BY_CUTOFF|| ""}
              onChange={(e) =>
                handleWorkingChange(
                  "LATE_BY_CUTOFF",
                  Number(e.target.value) || 0
                )
              }
              disabled={!canUpdate}
              className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                canUpdate
                  ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
              placeholder="e.g. 10"
            /> 
            <p className="text-sm text-gray-500 mt-2">
              Late by cutoff time in minutes
            </p>
          </div>



          {/* Overtime Settings */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={workingTime.ENABLE_OVERTIME || false}
                onChange={(e) =>
                  handleWorkingChange("ENABLE_OVERTIME", e.target.checked)
                }
                disabled={!canUpdate}
                className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-base font-medium text-gray-800">Enable Overtime</span>
            </label>

            {workingTime.ENABLE_OVERTIME && (
              <div className="ml-9">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Limit (hours per day)
                </label>
                <input
                  type="number"
                  min="0"
                  value={workingTime.ORG_OVERTIME_LIMIT || ""}
                  onChange={(e) =>
                    handleWorkingChange("ORG_OVERTIME_LIMIT", Number(e.target.value) || 0)
                  }
                  disabled={!canUpdate}
                  className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                    canUpdate
                      ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed"
                  }`}
                  placeholder="e.g. 40"
                />
              </div>
            )}
          </div>


          {/* Timesheet Entry Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Timesheet Entry Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  value: "OPEN",
                  label: "Open Entry",
                  desc: "Timesheet open for all days including holidays",
                },
                {
                  value: "RESTRICT_ALL",
                  label: "Normal Entry",
                  desc: "Restrict holidays and weekends",
                },
                {
                  value: "RESTRICT_HOLIDAYS",
                  label: "Restrict Holidays Only",
                  desc: "Allow weekends, restrict holidays",
                },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() =>
                    canUpdate && handleWorkingChange("TIMESHEET_ENTRY_MODE", mode.value)
                  }
                  disabled={!canUpdate}
                  className={`
                    p-5 rounded-xl border-2 text-left transition
                    ${workingTime.TIMESHEET_ENTRY_MODE === mode.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                    }
                    ${!canUpdate ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <div className="font-medium text-gray-900">{mode.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Working Days
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allDays.map((day) => {
                const selected = workingTime.working_days?.includes(day);
                const dayName = day.charAt(0) + day.slice(1).toLowerCase();

                return (
                  <button
                    key={day}
                    onClick={() => toggleWorkingDay(day)}
                    disabled={!canUpdate}
                    className={`
                      py-3 px-4 rounded-xl font-medium text-sm transition
                      ${selected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                      ${!canUpdate ? "opacity-70 cursor-not-allowed" : ""}
                    `}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={workingTime.SHOW_CLOCK_OUT || false}
              onChange={(e) => handleWorkingChange("SHOW_CLOCK_OUT", e.target.checked)}
              disabled={!canUpdate}
              className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-base font-medium text-gray-800">
              Require Clock-Out
            </span>
          </label>
          <p className="text-sm text-gray-500 ml-9">
            If enabled, employees must clock out at the end of their workday to mark as present in attendance.
          </p>
        </div>

          {/* Save Button - Smaller, at bottom */}
          {canUpdate && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition shadow-md text-sm"
              >
                <Save className="w-4 h-4" />
                {updateSettings.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}