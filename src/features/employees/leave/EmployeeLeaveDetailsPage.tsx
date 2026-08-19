import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LeaveApplicationForm from "../leave/LeaveApplicationForm";
import EmployeeLeaveRequests from "../leave/EmployeeLeaveRequests";
import { Gauge } from "lucide-react";
import { useCan } from "../../../utils/permissions";

export default function EmployeeLeaveSection() {
  const [searchParams, setSearchParams] = useSearchParams();

  const can = useCan();

  const canCreate =
    can("leaves:create") || can("leaves:create_own_record_only");
  const canView =
    can("leaves:view") || can("leaves:view_own_record_only");

  // ✅ Read tab from URL
  const tabFromUrl = searchParams.get("tab") as "apply" | "requests";

  // ✅ Initialize state from URL
  const [activeTab, setActiveTab] = useState<"apply" | "requests">(
    tabFromUrl === "requests" ? "requests" : "apply"
  );

  // ✅ Sync state when URL changes
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // ✅ Handle permission edge cases
  useEffect(() => {
    if (activeTab === "requests" && !canView && canCreate) {
      setActiveTab("apply");
      setSearchParams({ tab: "apply" });
    }

    if (activeTab === "apply" && !canCreate && canView) {
      setActiveTab("requests");
      setSearchParams({ tab: "requests" });
    }
  }, [activeTab, canCreate, canView]);

  if (!canCreate && !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 text-center rounded-md border border-gray-200 p-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-14 h-14 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3m0 4h.01M4.293 6.707a1 1 0 011.414 0L12 13l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Access Restricted
        </h2>
        <p className="text-gray-500 text-sm">
          You don’t have permission to manage leave applications.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-md shadow-sm space-y-4">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Gauge className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
          My Leave Manager
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Manage your leaves
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {canCreate && (
          <button
            onClick={() => {
              setActiveTab("apply");
              setSearchParams({ tab: "apply" });
            }}
            className={`px-4 py-3 text-sm font-medium min-w-fit flex-shrink-0 ${
              activeTab === "apply"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Apply for Leave
          </button>
        )}

        {canView && (
          <button
            onClick={() => {
              setActiveTab("requests");
              setSearchParams({ tab: "requests" });
            }}
            className={`px-4 py-3 text-sm font-medium min-w-fit flex-shrink-0 ${
              activeTab === "requests"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <span className="block sm:hidden">Leave History</span>
            <span className="hidden sm:block">My Leave Requests</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "apply" && canCreate && <LeaveApplicationForm />}
        {activeTab === "requests" && canView && <EmployeeLeaveRequests />}
      </div>
    </div>
  );
}