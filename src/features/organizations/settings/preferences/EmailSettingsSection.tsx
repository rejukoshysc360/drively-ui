import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, Lock } from "lucide-react";
import { useOrganization, useUpdateOrganizationSettings } from "./hooks";
import { useCan } from "../../../../utils/permissions";

export default function EmailSettingsSection() {
  const { data, isLoading } = useOrganization();
  const updateSettings = useUpdateOrganizationSettings();
  const can = useCan();

  const canView = can("organization:view");
  const canUpdate = can("organization:update");

  const [emailSettings, setEmailSettings] = useState<any>({
    provider: "smtp",
    host: "",
    port: 587,
    username: "",
    password_encrypted: "",
    from_name: "",
    from_address: "",
    encryption: "tls",

    // Microsoft Graph
    ms_tenant_id: "",
    ms_client_id: "",
    ms_client_secret: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showMsSecret, setShowMsSecret] = useState(false);

  useEffect(() => {
    if (data?.email_settings) {
      setEmailSettings({
        provider: "smtp",
        ...data.email_settings,
      });
    }
  }, [data]);

  const handleChange = (key: string, value: string | number) => {
    if (!canUpdate) return;
    setEmailSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!canUpdate) return;
    await updateSettings.mutateAsync({
      email_settings: emailSettings,
    });
  };

  if (!canView) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">
          You don’t have permission to view email settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading email settings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Email Settings
            </h3>

            {!canUpdate && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Lock className="w-4 h-4" />
                View-only access
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Email Provider
            </label>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={emailSettings.provider === "smtp"}
                  onChange={() => handleChange("provider", "smtp")}
                  disabled={!canUpdate}
                />
                SMTP
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={emailSettings.provider === "graph"}
                  onChange={() => handleChange("provider", "graph")}
                  disabled={!canUpdate}
                />
                Microsoft 365 (Graph)
              </label>
            </div>
          </div>

          {/* ✅ COMMON FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                value={emailSettings.from_name}
                onChange={(e) => handleChange("from_name", e.target.value)}
                disabled={!canUpdate}
                className="w-full px-4 py-3 border rounded-xl"
              />
            </div>

            {/* From Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Address
              </label>
              <input
                type="email"
                value={emailSettings.from_address}
                onChange={(e) => handleChange("from_address", e.target.value)}
                disabled={!canUpdate}
                className="w-full px-4 py-3 border rounded-xl"
              />
            </div>
          </div>

          {/* SMTP */}
          {emailSettings.provider === "smtp" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  value={emailSettings.host}
                  onChange={(e) => handleChange("host", e.target.value)}
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={emailSettings.port}
                  onChange={(e) =>
                    handleChange("port", Number(e.target.value) || 587)
                  }
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  value={emailSettings.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={emailSettings.password_encrypted}
                  onChange={(e) =>
                    handleChange("password_encrypted", e.target.value)
                  }
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 pr-12 border rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encryption
                </label>
                <select
                  value={emailSettings.encryption}
                  onChange={(e) => handleChange("encryption", e.target.value)}
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 border rounded-xl"
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          )}

          {/* GRAPH */}
          {emailSettings.provider === "graph" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant ID
                </label>
                <input
                  value={emailSettings.ms_tenant_id}
                  onChange={(e) =>
                    handleChange("ms_tenant_id", e.target.value)
                  }
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  value={emailSettings.ms_client_id}
                  onChange={(e) =>
                    handleChange("ms_client_id", e.target.value)
                  } 
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <input
                  type={showMsSecret ? "text" : "password"}
                  value={emailSettings.ms_client_secret}
                  onChange={(e) =>
                    handleChange("ms_client_secret", e.target.value)
                  }
                  disabled={!canUpdate}
                  className="w-full px-4 py-3 pr-12 border rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowMsSecret(!showMsSecret)}
                  className="absolute right-3 top-10"
                >
                  {showMsSecret ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          )}

          {/* Save */}
          {canUpdate && (
            <div className="pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg"
              >
                <Save className="w-4 h-4" />
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}