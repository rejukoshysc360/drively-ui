import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import SalaryHistoryTableList from "../history-base-salary/SalaryHistoryList";
import SalaryForm from "../history-base-salary/SalaryForm";
import EmployeeCompensationSummary from "../history-base-salary/EmployeeCompensationSummary";
import { PlusCircle, X, AlertTriangle, Calendar, Mail } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useEmployee } from "../hooks";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { useCan } from "../../../utils/permissions";
import { emitSuccess } from "../../../lib/success-bus";
import { emitApiError } from "../../../lib/error-bus";
import { useSendEmailTemplate } from "../../../features/email-templates/hooks";
import { salaryApi } from "../history-base-salary/api";

export default function EmployeeCompensationTab() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [open, setOpen] = useState(false);
  const [missingBasicError, setMissingBasicError] = useState(false);

  const {
  organization_name,
  organization_id,
  organization_currency,
  organization_country_code,
  organization_logo_url,
  profile,
  user,
  logout,
} = useAuth();

  const { data: employee, isLoading } = useEmployee(employeeId || "");
  const { data: org, isLoading: orgLoading } = useOrganization();
  const sendEmail = useSendEmailTemplate(organization_id!);



  const can = useCan();
  const canView = can("employees:salary:view");
  const canCreate = can("employees:salary:create");
  const canUpdate = can("employees:salary:update");
  const canDelete = can("employees:salary:delete");
  const canSendEmail = can("employees:salary:send_email");

  // Prevent hook errors: hooks always before returns
  const compensationTypes = useMemo(() => {
    if (orgLoading || !org?.compensation_settings?.types) return [];
    return org.compensation_settings.types.filter((t: any) => !t.deleted);
  }, [org, orgLoading]);

  // Fetch current salary records for each component (for summary email)
  const summaryQueries = useQueries({
    queries:
      compensationTypes.map((t) => ({
        queryKey: ["salary_current", organization_id, employeeId, t.id],
        queryFn: () => salaryApi.current(organization_id!, employeeId!, t.id),
        enabled: !!organization_id && !!employeeId && !!t.id,
      })) || [],
  });

  const summaryLoading = summaryQueries.some((q) => q.isLoading);
  const summaryData = summaryQueries.map((q, i) => ({
    type: compensationTypes[i]?.name,
    label:
      compensationTypes[i]?.name
        ?.replace(/_/g, " ")
        ?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unnamed",
    amount: q.data?.amount || 0,
    effective_from: q.data?.effective_from || null,
    remarks: q.data?.remarks || null,
  }));

  // Permission guard
  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s compensation
          information.
        </h2>
      </div>
    );
  }

  useEffect(() => {
    if (!org?.compensation_settings?.types) return;
    const types = org.compensation_settings.types;
    const hasBasic =
      Array.isArray(types) && types.some((t: any) => t?.is_basic === true);
    setMissingBasicError(!hasBasic);
  }, [org]);

  if (isLoading || orgLoading) return <div className="p-4">Loading...</div>;

  // Format DOJ nicely
  const doj = employee?.hire_date
    ? new Date(employee.hire_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  // 🔹 Send Full Compensation Summary Email
const handleSendSalaryEmail = () => {
  if (!employee?.email) {
    emitApiError({ message: "Employee has no registered email address." });
    return;
  }

  if (summaryLoading) {
    emitApiError({
      message: "Please wait — compensation summary is still loading.",
    });
    return;
  }

  // ✅ Only include components marked as is_basic === true
  const basicComponents = summaryData.filter((c, i) => {
    const t = compensationTypes[i];
    return t?.is_basic === true && c.amount !== 0;
  });

  if (!basicComponents.length) {
    emitApiError({
      message:
        "No Basic Salary component found to send. Check your compensation setup.",
    });
    return;
  }

  sendEmail.mutate(
    {
      to: employee.email,
      type: "salary_increment", // your existing template
      data: {
        name: employee.full_name || "Employee",
        currency: organization_currency,
        components: basicComponents, // 👈 only Basic
        organizationName: organization_name,
        organizationLogo: organization_logo_url,
      },
    },
    {
      onSuccess: () =>
        emitSuccess({ message: "Basic salary email sent successfully!" }),
      onError: () =>
        emitApiError({ message: "Failed to send salary email." }),
    }
  );
};


  return (
    <div className="space-y-6">
      {/* Header with DOJ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Compensation Information
          </h2>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">Joined on:</span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-semibold">
              {doj}
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          {(canCreate || canUpdate) && (
            <button
              onClick={() => setOpen(true)}
              disabled={missingBasicError}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition w-full sm:w-auto ${
                missingBasicError
                  ? "bg-gray-300 cursor-not-allowed text-gray-600"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Add New Compensation
            </button>
          )}

          {canSendEmail && (
            <button
              onClick={handleSendSalaryEmail}
              disabled={summaryLoading || sendEmail.isPending}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition w-full sm:w-auto shadow-sm disabled:opacity-60"
            >
              <Mail className="w-4 h-4" />
              {sendEmail.isPending ? "Sending..." : "Send Hike Email"}
            </button>
          )}
        </div>
      </div>

      {/* Missing Basic Salary Warning */}
      {missingBasicError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Missing Basic Salary Type</p>
            <p className="text-xs mt-1">
              Go to <strong>Settings → Compensation Components</strong> and mark
              one type (e.g. “Basic Salary”) as{" "}
              <code className="bg-red-100 px-1 rounded">is_basic: true</code>
            </p>
          </div>
        </div>
      )}

      {/* Salary History */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Salary History
        </h3>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <SalaryHistoryTableList
            employeeId={employeeId!}
            employee={employee}
            currency={organization_currency}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canSendEmail={canSendEmail}
          />
        </div>
      </div>

      {/* Current Compensation Summary */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Current Compensation Summary
        </h3>
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <EmployeeCompensationSummary
            employeeId={employeeId!}
            currency={organization_currency}
          />
        </div>
      </div>

      {/* Add New Salary Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-base sm:text-lg font-semibold">
                Add New Compensation Record
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <SalaryForm
                employeeId={employeeId!}
                onSuccess={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
