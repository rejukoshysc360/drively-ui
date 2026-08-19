import React, { useEffect, useState } from "react";
import {
  useEmployeeExpiryFields,
  useOrganization,
  useUpdateOrganizationSettings,
} from "./hooks";
import { CheckSquare, Square, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCan } from "../../../../utils/permissions";

export default function ComplianceMonitorSection() {
  const { data: org, isLoading: orgLoading } = useOrganization();
  const updateOrg = useUpdateOrganizationSettings();
  const { data: expiryFields = [], isLoading: fieldsLoading } =
    useEmployeeExpiryFields();

  const can = useCan();
  const canView = can("organization:view");
  const canUpdate = can("organization:update");

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (org?.compliance_monitor_settings) {
      setSelected(org.compliance_monitor_settings);
    } else if (expiryFields.length) {
      const init = Object.fromEntries(expiryFields.map((f) => [f, false]));
      setSelected(init);
    }
  }, [org, expiryFields]);

  const toggleField = (field: string) => {
    if (!canUpdate) return;
    const updated = { ...selected, [field]: !selected[field] };
    setSelected(updated);

    updateOrg.mutate(
      { compliance_monitor_settings: updated },
      {
        onSuccess: () => toast.success("Compliance monitor settings updated"),
        onError: () => toast.error("Failed to update settings"),
      }
    );
  };

  if (!canView) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">
          You don’t have permission to view compliance monitor settings.
        </p>
      </div>
    );
  }

  if (orgLoading || fieldsLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading compliance monitor settings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Compliance Alert Monitor
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Select which employee expiry fields should be monitored for automatic compliance alerts.
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

        {/* List of Fields */}
        <div className="p-6">
          {expiryFields.length > 0 ? (
            <div className="space-y-3">
              {expiryFields.map((field) => {
                const isSelected = selected[field];
                const label = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <button
                    key={field}
                    onClick={() => toggleField(field)}
                    disabled={!canUpdate}
                    className={`
                      w-full flex items-center justify-between p-5 rounded-xl border transition
                      ${isSelected
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                      }
                      ${!canUpdate ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <span className="text-left text-base font-medium text-gray-900">
                      {label}
                    </span>

                    {isSelected ? (
                      <CheckSquare className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="text-base">No expiry fields found in employee table.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}