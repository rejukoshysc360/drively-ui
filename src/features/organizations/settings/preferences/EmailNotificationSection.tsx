import React, { useEffect, useState } from "react";
import {
  useOrganization,
  useUpdateOrganizationSettings,
} from "./hooks";
import { toast } from "react-hot-toast";
import { CheckSquare, Square, Lock } from "lucide-react";
import { useCan } from "../../../../utils/permissions";

export default function EmailNotificationSection() {
  const { data: org, isLoading: orgLoading } = useOrganization();
  const updateOrg = useUpdateOrganizationSettings();

  const can = useCan();
  const canView = can("organization:view");
  const canUpdate = can("organization:update");

  // ✅ Two independent toggles
  const [settings, setSettings] = useState({
    task_email_enabled: false,
    timesheet_email_enabled: false,
  });

  // 🧩 Initialize from org record
  useEffect(() => {
    if (org?.email_notification_settings) {
      setSettings({
        task_email_enabled:
          org.email_notification_settings.task_email_enabled ?? false,
        timesheet_email_enabled:
          org.email_notification_settings.timesheet_email_enabled ?? false,
      });
    }
  }, [org]);

  const toggleSetting = (key: keyof typeof settings) => {
    if (!canUpdate) return;

    const updatedValue = !settings[key];
    const updated = { ...settings, [key]: updatedValue };
    setSettings(updated);

    updateOrg.mutate(
      { email_notification_settings: updated },
      {
        onSuccess: () =>
          toast.success(
            `${key === "task_email_enabled" ? "Task" : "Timesheet"} notifications ${
              updatedValue ? "enabled" : "disabled"
            }`
          ),
        onError: () => toast.error("Failed to update setting"),
      }
    );
  };

  if (!canView) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">
          You don’t have permission to view email notification settings.
        </p>
      </div>
    );
  }

  if (orgLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading email notification settings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Email Notification Settings
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Enable or disable automatic system email notifications for task and timesheet events.
              </p>
            </div>

            {!canUpdate && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Lock className="w-4 h-4" />
                View-only access
              </div>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="p-6 space-y-3">
          {/* Task Email Notification */}
          <button
            onClick={() => toggleSetting("task_email_enabled")}
            disabled={!canUpdate}
            className={`
              w-full flex items-center justify-between p-5 rounded-xl border transition
              ${
                settings.task_email_enabled
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }
              ${
                !canUpdate
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer"
              }
            `}
          >
            <span className="text-left text-base font-medium text-gray-900">
              Task Email Notification
            </span>

            {settings.task_email_enabled ? (
              <CheckSquare className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            ) : (
              <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {/* Timesheet Email Notification */}
          <button
            onClick={() => toggleSetting("timesheet_email_enabled")}
            disabled={!canUpdate}
            className={`
              w-full flex items-center justify-between p-5 rounded-xl border transition
              ${
                settings.timesheet_email_enabled
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }
              ${
                !canUpdate
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer"
              }
            `}
          >
            <span className="text-left text-base font-medium text-gray-900">
              Timesheet Email Notification
            </span>

            {settings.timesheet_email_enabled ? (
              <CheckSquare className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            ) : (
              <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
