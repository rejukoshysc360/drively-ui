import { useState, useEffect } from "react";
import { Save, RefreshCcw, Plus, Trash2, Lock } from "lucide-react";
import { useOrganization, useUpdateOrganizationSettings } from "./hooks";
import { useCan } from "../../../../utils/permissions";

export default function LeaveSettingsSection() {
  const { data, isLoading, refetch } = useOrganization();
  const updateSettings = useUpdateOrganizationSettings();
  const can = useCan();

  const canView = can("organization:view");
  const canUpdate = can("organization:update");

  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  const handleChange = (key: string, value: any) => {
    if (!canUpdate) return;
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (key: string, index: number, value: string) => {
    if (!canUpdate) return;
    const arr = [...(settings[key] || [])];
    arr[index] = value;
    setSettings((prev: any) => ({ ...prev, [key]: arr }));
  };

  const handleAddToArray = (key: string) => {
    if (!canUpdate) return;
    const arr = [...(settings[key] || []), ""];
    setSettings((prev: any) => ({ ...prev, [key]: arr }));
  };

  const handleRemoveFromArray = (key: string, index: number) => {
    if (!canUpdate) return;
    const arr = [...(settings[key] || [])];
    arr.splice(index, 1);
    setSettings((prev: any) => ({ ...prev, [key]: arr }));
  };

  const handleSave = async () => {
    if (!canUpdate) return;
    await updateSettings.mutateAsync({ settings });
  };

  if (!canView) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">You don’t have permission to view leave settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading leave settings…</p>
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
              <h3 className="text-xl font-semibold text-gray-900">Leave Settings</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!canUpdate && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Lock className="w-4 h-4" />
                  View-only access
                </div>
              )} 

            </div>
          </div>
        </div>

        {/* Settings Fields */}
        <div className="p-6 space-y-8">
          {/* Accrual Mode */}
          {"accrual_mode" in settings && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accrual Mode
              </label>
              <select
                value={settings.accrual_mode || "monthly"}
                onChange={(e) => handleChange("accrual_mode", e.target.value)}
                disabled={!canUpdate}
                className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                  canUpdate
                    ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                }`}
              >
                <option value="monthly">Monthly Accrual</option>
                <option value="yearly">Yearly Credit</option>
              </select>
            </div>
          )}

          {/* Dynamic Settings */}
          {Object.entries(settings)
            .filter(([key]) => !["accrual_mode", "weekend_days"].includes(key))
            .map(([key, value]) => {
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

              // Boolean fields
              if (typeof value === "boolean") {
                return (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-700">{label}</label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      disabled={!canUpdate}
                      className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </div>
                );
              }

              // Number fields
if (typeof value === "number") {
  return (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "" : value} 
        onChange={(e) => {
          const inputVal = e.target.value;
          if (/^\d*$/.test(inputVal)) {
            const num = inputVal === "" ? 0 : Number(inputVal);
            handleChange(key, num);
          }
        }}
        onBlur={() => {
          if (settings[key] < 0) {
            handleChange(key, 0);
          }
        }}
        disabled={!canUpdate}
        placeholder="0"
        className={`w-full px-4 py-3 text-base border rounded-xl transition ${
          canUpdate
            ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            : "border-gray-200 bg-gray-50 cursor-not-allowed"
        }`}
      />
    </div>
  );
}

              // String fields
              if (typeof value === "string") {
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      disabled={!canUpdate}
                      className={`w-full px-4 py-3 text-base border rounded-xl transition ${
                        canUpdate
                          ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                          : "border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
                    />
                  </div>
                );
              }

              // Array fields (e.g. weekend_days)
              if (Array.isArray(value)) {
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {label}
                    </label>
                    <div className="space-y-3">
                      {value.map((v: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={v}
                            onChange={(e) => handleArrayChange(key, i, e.target.value)}
                            disabled={!canUpdate}
                            className={`flex-1 px-4 py-3 text-base border rounded-xl transition ${
                              canUpdate
                                ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                                : "border-gray-200 bg-gray-50 cursor-not-allowed"
                            }`}
                          />
                          {canUpdate && (
                            <button
                              onClick={() => handleRemoveFromArray(key, i)}
                              className="p-3 rounded-lg hover:bg-red-100 transition"
                              title="Remove"
                            >
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canUpdate && (
                        <button
                          onClick={() => handleAddToArray(key)}
                          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                        >
                          <Plus className="w-4 h-4" />
                          Add Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
        </div>

        {/* Save Button - Non-sticky, smaller, at bottom */}
        {canUpdate && (
          <div className="px-6 py-5 border-t border-gray-200">
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
  );
}