import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Calendar, AlertTriangle } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useEmployee } from "../hooks";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { useCan } from "../../../utils/permissions";
import SalaryHistoryTableList from "../history-base-salary/SalaryHistoryList";

export default function EmployeeViewOnlyCompensationTab() {
  const routeParams = useParams<{ employeeId: string }>();
  const { profile, organization_currency } = useAuth();
  const can = useCan();

  // 🧭 Determine which record is being viewed
  const employeeId = routeParams.employeeId || profile?.id || "";

  // 🧠 Get role slug
  const userRoleSlug = profile?.roles?.slug || "";
  const isEmployee = userRoleSlug === "emp";

  // 🧠 Detect if user is viewing their own record
  const isOwnRecord = profile?.id?.toString() === employeeId?.toString();
  const isSelfView = isEmployee && isOwnRecord;

  // ✅ Permission setup
  const canViewAll = can("employees:salary:view");
  const canViewOwn = can("employees:view_own_record_only");
  const canUpdate = can("employees:salary:update");
  const canDelete = can("employees:salary:delete");
  const canSendEmail = can("employees:salary:send_email");

  // ✅ Combined logic
  const canView = isSelfView || canViewAll || (canViewOwn && isOwnRecord);

  // 🚫 No permission to view
  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s compensation information.
        </h2>
      </div>
    );
  }

  // 🚫 Prevent employees from trying to view others’ records
  if (isSelfView && !isOwnRecord) {
    return (
      <div className="p-8 text-center text-red-600">
        You can only view your own compensation record.
      </div>
    );
  }

  const { data: employee, isLoading } = useEmployee(employeeId || "");
  const { data: org, isLoading: orgLoading } = useOrganization();
  const [missingBasicError, setMissingBasicError] = useState(false);

  // ✅ Check for missing “Basic Salary” setup
  useEffect(() => {
    if (!org?.compensation_settings?.types) return;
    const types = org.compensation_settings.types;
    const hasBasic =
      Array.isArray(types) && types.some((t: any) => t?.is_basic === true);
    setMissingBasicError(!hasBasic);
  }, [org]);

  if (isLoading || orgLoading) return <div className="p-4">Loading...</div>;

  // Format hire date (DOJ)
  const doj = employee?.hire_date
    ? new Date(employee.hire_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Compensation History
          </h2>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">Joined on:</span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-semibold">
              {doj}
            </span>
          </div>
        </div>
      </div>

      {/* ⚠️ Missing Basic Salary Type Warning */}
      {missingBasicError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Missing Basic Salary Type</p>
            <p className="text-xs mt-1">
              Go to{" "}
              <strong>Settings → Compensation Components</strong> and mark one
              type (e.g. “Basic Salary”) as{" "}
              <code className="bg-red-100 px-1 rounded">is_basic: true</code>
            </p>
          </div>
        </div>
      )}

      {/* Salary History Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Salary History
        </h3>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <SalaryHistoryTableList
            employeeId={employeeId!}
            employee={employee}
            currency={organization_currency}
            canUpdate={!isSelfView && canUpdate}
            canDelete={!isSelfView && canDelete}
            canSendEmail={!isSelfView && canSendEmail}
          />
        </div>
      </div>
    </div>
  );
}
