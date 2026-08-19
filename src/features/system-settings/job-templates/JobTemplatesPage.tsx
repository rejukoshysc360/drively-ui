import {
  Loader2,
  Clock,
  ShieldAlert,
  Settings,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../../features/auth/AuthProvider";

import {
  useJobTemplateStatus,
  useInstallDefaultJobs,
} from "./hooks";

export default function JobTemplatesPage() {
  const navigate = useNavigate();

  const {
    profile,
    organization_name,
  } = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];

  const slugs = roles.map(
    (r) => r?.slug
  );

  const isAdmin =
    slugs.includes("admin");

  const {
    data,
    isLoading,
  } = useJobTemplateStatus();

  const installMutation =
    useInstallDefaultJobs();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />

        <h2 className="text-xl font-semibold text-gray-800">
          Restricted Access
        </h2>

        <p className="text-gray-500 text-sm max-w-md">
          Only administrators can manage system job templates.
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>
            Loading job template settings...
          </span>
        </div>
      </div>
    );
  }

  const installed =
    !!data?.installed;

  const count =
    data?.count || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/settings/system"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to System Settings
          </Link>

          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            System Job Templates
          </h2>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />

          <div>
            <p className="font-medium text-blue-900">
              Default Job Schedules
            </p>

            <p className="text-sm text-blue-700 mt-1">
              Install and manage default system jobs for
              <strong>
                {" "}
                {organization_name}
              </strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Installed Jobs
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {count}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Job Management
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Install missing job schedules and synchronize default system jobs.
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6">
        {!installed ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Jobs Not Installed
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                No default system jobs have been installed for this organization.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  installMutation.mutate()
                }
                disabled={
                  installMutation.isPending
                }
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2"
              >
                {installMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {installMutation.isPending
                  ? "Installing..."
                  : "Install Default Jobs"}
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/settings/system/job-templates/manage"
                  )
                }
                className="px-5 py-2 border rounded-lg hover:bg-gray-50"
              >
                Manage Jobs
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-600" />

              <span className="font-medium">
                Jobs Installed
              </span>
            </div>

            <p className="text-sm text-gray-600">
              {count} system jobs are available for this organization.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  installMutation.mutate()
                }
                disabled={
                  installMutation.isPending
                }
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Sync Missing Jobs
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/settings/system/job-templates/manage"
                  )
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Manage Jobs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}