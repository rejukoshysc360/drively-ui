import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Wrench,
  Info,
  Loader2,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../features/auth/AuthProvider";


import { emitApiError } from "../../lib/error-bus";
import { emitSuccess } from "../../lib/success-bus";
import { useMaintenanceSettings, useUpdateMaintenanceSettings } from "./hooks";

export default function MaintenanceSettingsPage() {

  const navigate = useNavigate();

  const {
    organization_name,
    profile,
  } = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];

  const slugs = roles.map((r) => r?.slug);

  const isSuperAdmin = slugs.includes("superadmin");

  // =====================================================
  // 🔹 API HOOKS
  // =====================================================

  const {
    data,
    isLoading,
  } = useMaintenanceSettings();

  const updateMaintenance =
    useUpdateMaintenanceSettings();

  // =====================================================
  // 🔹 LOCAL STATE
  // =====================================================

  const [enabled, setEnabled] =
    useState(false);

  const [message, setMessage] =
    useState(
      "We are currently improving your digital experience to serve you better."
    );

  // =====================================================
  // 🔹 LOAD API VALUES
  // =====================================================

  useEffect(() => {

    if (data) {

      setEnabled(
        !!data?.maintenance_mode
      );

      setMessage(
        data?.maintenance_message ||
          "We are currently improving your digital experience to serve you better."
      );
    }

  }, [data]);

  // =====================================================
  // 🔒 ACCESS RESTRICTION
  // =====================================================

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">

        <ShieldAlert className="w-12 h-12 text-red-500" />

        <h2 className="text-xl font-semibold text-gray-800">
          Restricted Access
        </h2>

        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to manage
          system maintenance mode.
          Only super administrators can access
          this section.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Go Back to Dashboard
        </button>

      </div>
    );
  }

  // =====================================================
  // 🔹 LOADING
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">

        <div className="flex items-center gap-3 text-gray-600">

          <Loader2 className="w-5 h-5 animate-spin" />

          <span>
            Loading maintenance settings...
          </span>

        </div>

      </div>
    );
  }

  // =====================================================
  // 🔹 SAVE
  // =====================================================

  const handleSave = async () => { 

      await updateMaintenance.mutateAsync({
        enabled,
        message,
      });  
  };

  return (
    <div className="p-6 space-y-6">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <Link
            to="/mcp"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to System Settings
          </Link>

          <h2 className="text-xl font-semibold flex items-center gap-2">

            <Wrench className="w-5 h-5 text-gray-600" />

            System Maintenance

          </h2>

        </div>

      </div>

      {/* ===================================== */}
      {/* INFO */}
      {/* ===================================== */}

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">

        <Info className="w-4 h-4 mt-[2px] flex-shrink-0 text-amber-600" />

        <p>
          When maintenance mode is enabled,
          users will see the maintenance page
          instead of the application.
          {organization_name ? (
            <>
              {" "}
              Current organization:
              <span className="font-medium">
                {" "}
                {organization_name}
              </span>
            </>
          ) : null}
        </p>

      </div>

      {/* ===================================== */}
      {/* MAIN CARD */}
      {/* ===================================== */}

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">

        {/* ===================================== */}
        {/* TOGGLE */}
        {/* ===================================== */}

        <div className="flex items-center justify-between gap-4">

          <div>

            <h3 className="font-semibold text-gray-800">
              Enable Maintenance Mode
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Turn ON to temporarily block
              access to the platform.
            </p>

          </div>

          <label className="relative inline-flex items-center cursor-pointer">

            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) =>
                setEnabled(
                  e.target.checked
                )
              }
              className="sr-only peer"
            />

            <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-indigo-600 transition" />

            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-6" />

          </label>

        </div>

        {/* ===================================== */}
        {/* MESSAGE */}
        {/* ===================================== */}

        <div className="space-y-2">

          <label className="block text-sm font-medium text-gray-700">
            Maintenance Message
          </label>

          <textarea
            rows={4}
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter maintenance message..."
          />

        </div>

        {/* ===================================== */}
        {/* PREVIEW */}
        {/* ===================================== */}

        <div className="border rounded-lg bg-gray-50 p-4 space-y-2">

          <p className="text-xs font-semibold uppercase text-gray-500">
            Preview
          </p>

          <h3 className="text-xl font-bold text-gray-900">
            We’ll Be Back Soon
          </h3>

          <p className="text-gray-700">
            {message}
          </p>

        </div>

        {/* ===================================== */}
        {/* ACTIONS */}
        {/* ===================================== */}

        <div className="flex justify-end">

          <button
            onClick={handleSave}
            disabled={
              updateMaintenance.isPending
            }
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2"
          >

            {updateMaintenance.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}

            {updateMaintenance.isPending
              ? "Saving..."
              : "Save Settings"}

          </button>

        </div>

      </div>

    </div>
  );
}