import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "../features/auth/AuthProvider";
import { usePublicMaintenance } from "../features/system-settings/hooks";

import { emitSuccess } from "../lib/success-bus";
import { emitApiError } from "../lib/error-bus";

export default function MaintenanceControlPage() {
  const { token, profile } = useAuth();

  const [error, setError] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  const { data } = usePublicMaintenance();

  const maintenanceEnabled = data?.maintenance_mode === true;

  const message =
    data?.maintenance_message ||
    "We are currently improving your digital experience to serve you better.";

  const roleSlug =
    profile?.roles?.slug ||
    profile?.role ||
    "";

  const handleTurnOff = async () => {
    try {
      setError("");
      setIsDisabling(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/system-maintenance/disable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to disable maintenance"
        );
      }

      emitSuccess({
        message:
          "Maintenance disabled successfully.",
        type: "success",
      });

      window.location.href =
        "/superadmin/login";
    } catch (err: any) {
      setError(err.message);

      emitApiError({
        message: err.message,
        raw: err,
      });
    } finally {
      setIsDisabling(false);
    }
  };

  // ===================================================
  // 🔒 SUPER ADMIN ONLY
  // ===================================================

  if (roleSlug !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Access Denied
          </h1>

          <p className="text-gray-600">
            Only Super Administrators can access
            Maintenance Control.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // ✅ PAGE
  // ===================================================

return (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Maintenance Control
          </h1>

          <p className="text-gray-500 mt-2">
            Manage platform maintenance settings and access.
          </p>
        </div>

        <button
          onClick={() =>
            (window.location.href =
              "/settings/system/maintenance")
          }
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
        >
          Edit Settings
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* STATUS CARD */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-3">
            Current Status
          </p>

          <div
            className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${
              maintenanceEnabled
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {maintenanceEnabled
              ? "Maintenance Enabled"
              : "Maintenance Disabled"}
          </div>
        </div>

        {/* ACTION CARD */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-3">
            Actions
          </p>

          {maintenanceEnabled ? (
            <button
              onClick={handleTurnOff}
              disabled={isDisabling}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              {isDisabling && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {isDisabling
                ? "Turning Off..."
                : "Turn Off Maintenance"}
            </button>
          ) : (
            <div className="text-green-700 font-medium">
              Maintenance mode is already disabled.
            </div>
          )}
        </div>
      </div>

      {/* MESSAGE */}
      <div className="mt-6 bg-white rounded-2xl border shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-3">
          Current Message
        </p>

        <div className="bg-gray-50 border rounded-xl p-5 text-gray-700">
          {message}
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-600">
          {error}
        </div>
      )}
    </div>
  </div>
);
}