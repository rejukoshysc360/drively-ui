import {
  Loader2,
  Mail,
  ShieldAlert,
  Settings,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../../features/auth/AuthProvider";

import {
  useEmailTemplateStatus,
  useInstallDefaultTemplates,
} from "./hooks";

export default function EmailTemplatesPage() {

  const navigate =
    useNavigate();

  const {
    profile,
    organization_name,
  } = useAuth();

  const roles = Array.isArray(
    profile?.roles
  )
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
  } = useEmailTemplateStatus();

  const installMutation =
    useInstallDefaultTemplates();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">

        <ShieldAlert className="w-12 h-12 text-red-500" />

        <h2 className="text-xl font-semibold text-gray-800">
          Restricted Access
        </h2>

        <p className="text-gray-500 text-sm max-w-md">
          Only administrators can manage email templates.
        </p>

        <button
          onClick={() =>
            navigate("/")
          }
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
            Loading email template settings...
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

            <Mail className="w-5 h-5 text-gray-600" />

            Email Templates

          </h2>

        </div>

      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">

        <div className="flex items-start gap-3">

          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />

          <div>

            <p className="font-medium text-blue-900">
              Default Email Templates
            </p>

            <p className="text-sm text-blue-700 mt-1">
              Install and manage email templates for
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
            Installed Templates
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {count}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5">

          <p className="text-xs uppercase tracking-wide text-gray-500">
            Template Management
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Install missing templates, force reinstall individual templates,
            and manage template content.
          </p>

        </div>

      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6">

        {!installed ? (
          <div className="space-y-4">

            <div>

              <h3 className="font-semibold text-gray-900">
                Templates Not Installed
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                No email templates have been installed for this organization.
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
                  : "Install Default Templates"}

              </button>

              <button
                onClick={() =>
                  navigate(
                    "/settings/system/email-templates/manage"
                  )
                }
                className="px-5 py-2 border rounded-lg hover:bg-gray-50"
              >
                Manage Templates
              </button>

            </div>

          </div>
        ) : (
          <div className="space-y-4">

            <div className="flex items-center gap-2 text-green-700">

              <div className="w-2 h-2 rounded-full bg-green-600" />

              <span className="font-medium">
                Templates Installed
              </span>

            </div>

            <p className="text-sm text-gray-600">
              {count} email templates are available for this organization.
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
                Sync Missing Templates
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/settings/system/email-templates/manage"
                  )
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Manage Templates
              </button>

            </div>

          </div>
        )}

      </div>

      {installMutation.isPending && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">

          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">

            <div className="flex flex-col items-center text-center">

              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />

              <h3 className="mt-4 text-lg font-semibold">
                Installing Email Templates
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Creating default templates for your organization.
              </p>

              <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">

                <div className="h-full bg-indigo-600 animate-pulse w-full" />

              </div>

              <p className="mt-4 text-xs text-gray-400">
                This usually takes a few seconds.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}