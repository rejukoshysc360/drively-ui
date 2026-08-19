import {
  Loader2,
  Clock,
  ShieldAlert,
  Download,
  RefreshCw,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../../features/auth/AuthProvider";

import {
  useJobTemplateCatalog,
  useInstallJobTemplate,
} from "./hooks";
import { isJobAvailableForSelectedPlan } from "../../../features/plans/planFeatures";

export default function JobTemplateManagePage() {
  const navigate = useNavigate();

  const { profile ,organization_plan } = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];

  const slugs = roles.map(
    (r) => r?.slug
  );

  const isAdmin =
    slugs.includes("admin");

  const { data, isLoading } =
    useJobTemplateCatalog();

  const installJob =
    useInstallJobTemplate();

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
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading jobs...</span>
        </div>
      </div>
    );
  }

const jobs = (
  Array.isArray(data)
    ? data
    : data?.jobs || []
).filter((job: any) =>
  isJobAvailableForSelectedPlan(
    organization_plan,
    job.job_name,
  ),
);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/settings/system/job-templates"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </Link>

          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Manage Job Templates
          </h2>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">
                Job Name
              </th>

              <th className="text-left px-4 py-3 text-sm font-medium">
                Cron Expression
              </th>

              <th className="text-left px-4 py-3 text-sm font-medium">
                Status
              </th>

              <th className="text-right px-4 py-3 text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job: any) => {
              const installed =
                job.installed;

              return (
                <tr
                  key={job.job_name}
                  className="border-b"
                >
                  <td className="px-4 py-4">
                    <div className="font-medium">
                      {job.job_name}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                    {job.cron_expression}
                  </td>

                  <td className="px-4 py-4">
                    {installed ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        Installed
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                        Missing
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {!installed ? (
                        <button
                          onClick={() =>
                            installJob.mutate({
                              job_name:
                                job.job_name,
                              force: false,
                            })
                          }
                          disabled={
                            installJob.isPending
                          }
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Install
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            installJob.mutate({
                              job_name:
                                job.job_name,
                              force: true,
                            })
                          }
                          disabled={
                            installJob.isPending
                          }
                          className="px-3 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Force Install
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {installJob.isPending && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />

              <h3 className="mt-4 text-lg font-semibold">
                Installing Job
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}