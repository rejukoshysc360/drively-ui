import { useState } from "react";
import { Database, Info, ShieldAlert } from "lucide-react";
import BackupSchedulesTab from "./BackupSchedulesTab";
import BackupHistoryTab from "./BackupHistoryTab";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function BackupsPage() {
  
  const [activeTab, setActiveTab] = useState<"schedules" | "history">("schedules");
  const { organization_name, organization_id ,profile} = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];
  const slugs = roles.map((r) => r?.slug);
  const isAdmin = slugs.includes("admin");

  // 🔒 Restrict access to admin only
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">Restricted Access</h2>
        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view or manage database backups.
          Only system administrators can access this section.
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
            <Database className="w-5 h-5 text-gray-600" />
            Database Backups
          </h2>
        </div>
      </div>

      {/* Info Label */}
<div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
  <Info className="w-4 h-4 mt-[2px] flex-shrink-0 text-blue-600" />
  <p>
    Backups will run for your current organization
    {organization_name ? (
      <>
        : <span className="font-medium">{organization_name}.</span>
      </>
    ) : (
      "."
    )}{"  "}
    Manual backup execution is limited to <span className="font-medium">3 runs per day</span>.
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
          Backup Schedules
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Backup History
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "schedules" && <BackupSchedulesTab organizationId={organization_id} />}
      {activeTab === "history" && <BackupHistoryTab />}
    </div>
  );
}
