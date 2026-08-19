import { useState } from "react";
import { Clock, Info, ShieldAlert } from "lucide-react";
import JobSchedulesTab from "./JobSchedulesTab";
import JobHistoryTab from "./JobHistoryTab";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<"schedules" | "history">("schedules");
 const { organization_name , organization_id,profile} = useAuth();

const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];
  const slugs = roles.map((r) => r?.slug);
  const isAdmin = slugs.includes("admin");

    if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">Restricted Access</h2>
        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view this page. Only system administrators
          can manage system jobs.
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
            System Jobs
          </h2>
        </div>
      </div>

      {/* Info Label */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-[2px] flex-shrink-0 text-blue-600" />
        <p>
          All below jobs will run under your currently selected organization scope
          {organization_name ? (
            <>
              : <span className="font-medium">{organization_name}</span>
            </>
          ) : (
            "."
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("schedules")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "schedules"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Job Schedules
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Job History
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "schedules" && <JobSchedulesTab organizationId={organization_id}/>}
      {activeTab === "history" && <JobHistoryTab />}
    </div>
  );
}
