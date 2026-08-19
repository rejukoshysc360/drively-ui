import React from "react";
import {
  Chart,
  GlobalStateProvider,
} from "../../lib/my-ui-lib/src";
import { useCan } from "../../utils/permissions";
import { useParams } from "react-router-dom";
import { useProject } from "../projects/hooks"; // ✅ adjust path if needed
import { Hash, Tag, Building2, Calendar, Loader2 } from "lucide-react";

function ymdToDMY(ymd?: string | null): string {
  if (!ymd || ymd.length < 10) return "-";
  const [y, m, d] = ymd.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const SmartSheet: React.FC = () => {
  const can = useCan();
  const canViewAll = can("projects:view");
  const canViewOwn = can("projects:view_own_record_only");

  // 🔒 Restrict unauthorized users
  if (!canViewAll && !canViewOwn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-.01-10a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            You do not have permission to view this project workspace.
            Please contact your HR or Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Read projectId from URL
  const { projectId } = useParams<{ projectId: string }>();

  // ✅ Fetch project details
  const { data: projectRes, isLoading: projectLoading } = useProject(projectId || "");

  // ✅ Normalize project payload (supports different API response shapes)
  const project: any =
    (projectRes as any)?.project ||
    (projectRes as any)?.data ||
    projectRes;

  return (
    <GlobalStateProvider>
      <div className="p-2 space-y-6 bg-gray-50 min-h-screen">
        {/* ✅ Project Header */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
          {projectLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading project details...</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900">
                    {project?.name || "Project"}
                  </h1>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-700">
                    {/* Client */}
                    {project?.client_lead_consultant && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{project.client_lead_consultant}</span>
                      </div>
                    )}

                    {/* Code */}
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {project?.code || "-"}
                      </span>
                    </div>

                    {/* Reference */}
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {project?.project_reference || "-"}
                      </span>
                    </div>

                    {/* Dates */}
                    {(project?.start_date || project?.end_date) && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {ymdToDMY(project?.start_date)} → {ymdToDMY(project?.end_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side status pill */}
                {project?.status && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {String(project.status).toUpperCase()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Gantt Chart */}
        <section>
          <h2 className="text-lg font-bold mb-3 text-gray-800">
            Manage Project Tasks
          </h2>

          <div
            className="rounded-2xl shadow bg-white p-4"
            style={{ scrollbarWidth: "thin" }}
          >
            <Chart />
          </div>
        </section>
      </div>
    </GlobalStateProvider>
  );
};

export default SmartSheet;
