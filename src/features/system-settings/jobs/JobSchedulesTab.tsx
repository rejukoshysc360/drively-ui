import { useState, useCallback } from "react";
import { Save, Play, RefreshCcw, ShieldAlert } from "lucide-react";
import {
  useSystemJobs,
  useUpdateJobSchedule,
  useRunJob,
  useToggleJob,
  useReloadJobs,
} from "../hooks";
import { emitSuccess } from "../../../lib/success-bus";
import { emitApiError } from "../../../lib/error-bus";
import { emitInfo } from "../../../lib/info-bus";
import JobRunDialog from "./JobRunDialog";
import { useAuth } from "../../../features/auth/AuthProvider";
import AsyncSelect from "react-select/async";
import debounce from "lodash/debounce";
import { useEmployees } from "../../employees/hooks";
import { isJobAvailableForSelectedPlan } from "../../../features/plans/planFeatures";

export default function JobSchedulesTab() {
  const { data: jobs, isLoading, refetch } = useSystemJobs();
  const updateJob = useUpdateJobSchedule();
  const runJob = useRunJob();
  const toggleJob = useToggleJob();
  const reloadJobs = useReloadJobs();

  const [adhocDates, setAdhocDates] = useState<Record<string, string>>({});
  const [savingJob, setSavingJob] = useState<string | null>(null);

  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<"running" | "success" | "error">(
    "running",
  );

  const { profile, organization_plan } = useAuth();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];
  const slugs = roles.map((r) => r?.slug);
  const isAdmin = slugs.includes("admin");

  const [forceFullAccrualFlags, setForceFullAccrualFlags] = useState<
    Record<string, boolean>
  >({});

  // -------------------------------------------
  // 🟦 EMPLOYEE SEARCH STATES (FOR MONTHLY ACCRUAL ONLY)
  // -------------------------------------------
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<
    Record<string, any>
  >({});

  const { data: empSearchData } = useEmployees(1, 10, employeeSearchText);

  const employeeOptions =
    empSearchData?.employees?.map((e: any) => ({
      value: e.id,
      label: `${e.full_name} (${e.email})`,
    })) || [];

  const loadEmployeeOptions = useCallback(
    debounce((inputValue: string, callback: any) => {
      setEmployeeSearchText(inputValue);
      callback(employeeOptions);
    }, 300),
    [employeeOptions],
  );

  // -------------------------------------------
  // 🔒 Restrict Access to Admin Users
  // -------------------------------------------
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">
          Restricted Access
        </h2>
        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view or manage job schedules. Only system
          administrators can access this section.
        </p>
      </div>
    );
  }

  if (isLoading)
    return <p className="text-gray-500 text-sm">Loading system jobs…</p>;

  // -------------------------------------------
  // 🟦 SAVE JOB SCHEDULE
  // -------------------------------------------
  const handleSave = async (jobKey: string, cron: string) => {
    try {
      setSavingJob(jobKey);

      // ✅ Update DB schedule
      await updateJob.mutateAsync({
        jobKey,
        schedule: cron,
      });

      // ✅ Small delay to ensure DB consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // ✅ Reload only this cron job
      await reloadJobs.mutateAsync(jobKey);

      emitSuccess({
        message: `${jobKey.replace(/_/g, " ")} schedule updated.`,
        type: "success",
      });
    } catch (err: any) {
      emitApiError({
        message: "Failed to save schedule",
        raw: err,
      });
    } finally {
      setSavingJob(null);

      refetch();
    }
  };

  // -------------------------------------------
  // 🟦 RUN JOB NOW
  // -------------------------------------------
  const handleRunNow = async (jobKey: string) => {
    const runDate =
      adhocDates[jobKey] || new Date().toISOString().split("T")[0];
    const selectedEmployee = selectedEmployees[jobKey];

    setSelectedJob(jobKey);
    setJobStatus("running");
    setShowJobDialog(true);

    try {
      const payload: any = { jobKey, runDate };

      if (
        [
          "monthly_accrual",
          "year_end_carry_forward",
          "carry_forward_expiry",
        ].includes(jobKey) &&
        selectedEmployee?.value
      ) {
        payload.employeeId = selectedEmployee.value;
      }

      if (jobKey === "monthly_accrual" && forceFullAccrualFlags[jobKey]) {
        payload.forceFullAccrual = true;
      }

      emitInfo(`▶️ ${jobKey} started for ${runDate}`);
      await runJob.mutateAsync(payload);

      setJobStatus("success");
      refetch();
    } catch (err: any) {
      setJobStatus("error");
      emitApiError({ message: "Failed to execute job", raw: err });
    }
  };

  // -------------------------------------------
  // 🟦 TOGGLE ACTIVE / INACTIVE
  // -------------------------------------------
  const handleToggle = async (jobKey: string, active: boolean) => {
    try {
      await toggleJob.mutateAsync({ jobKey, is_active: active });
      await reloadJobs.mutateAsync(jobKey); // ✅ reload after toggle
      //  emitSuccess(`${jobKey} ${active ? "activated" : "deactivated"}`);
      refetch();
    } catch (err: any) {
      emitApiError({ message: "Failed to toggle job", raw: err });
    }
  };

  // -------------------------------------------
  // 🟦 RENDER COMPONENT
  // -------------------------------------------
  return (
    <div className="card p-4 bg-white shadow rounded space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Job Schedules</h3>
        <button
          onClick={() => refetch()}
          className="btn flex items-center gap-1"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {!jobs?.length && (
        <p className="text-gray-500 text-sm">No jobs found in system.</p>
      )}

     {jobs?.map((job: any) => {
        const isAllowed = isJobAvailableForSelectedPlan(
          organization_plan,
          job.job_name
        );

        return (
       <div
        key={job.job_name}
        className={`border p-4 rounded-lg space-y-4 ${
          isAllowed
            ? "bg-gray-50"
            : "bg-gray-100 opacity-60"
        }`}
      >
          <div className="flex items-center justify-between">
            <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-800 capitalize">
              {job.job_name.replace(/_/g, " ")}
            </h4>

            {!isAllowed && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                Enterprise
              </span>
            )}
          </div>

              <p className="text-sm text-gray-600">
                {job.job_name === "monthly_accrual" &&
                  "Automatically accrues monthly leaves for all employees (or selected employee)."}
                {job.job_name === "year_end_carry_forward" &&
                  "Carries forward unused leave balances at year end.(Recommended: At 03:00 AM on Jan 1st every year)"}
                {job.job_name === "carry_forward_expiry" &&
                  "Expires unused carried-forward leave balances when their expiry date is reached."}
                {job.job_name === "adhoc_accrual_backfill" &&
                  "Run manually for testing accrual logic."}
                {job.job_name === "payslip_retention_cleanup" &&
                  "Deletes payslip records older than the organization’s retention period."}
                {job.job_name === "employee_xyear_completion" &&
                  "Milestone emails for X year Completion"}
                {job.job_name === "auto_generate_invoice" &&
                  "Generates Invoice for the recurring type"}
              </p>
            </div>

            <div className="flex gap-2">
              {/* Run Now Button - Disabled only for payslip_retention_cleanup */}
              <button
               onClick={() => handleRunNow(job.job_name)}
                disabled={
                  !isAllowed ||
                  job.job_name === "payslip_retention_cleanup"
                }
                className={`btn flex items-center gap-1 ${
                  job.job_name === "payslip_retention_cleanup"
                    ? "text-gray-400 border-gray-300 cursor-not-allowed"
                    : "text-blue-600 border-blue-300 hover:bg-blue-50"
                }`}
                title={
                  job.job_name === "payslip_retention_cleanup"
                    ? "Manual run disabled for data safety"
                    : ""
                }
              >
                <Play className="w-4 h-4" /> Run Now
              </button>

              {/* Save Button - Disabled only for payslip_retention_cleanup and adhoc_accrual_backfill */}
              {job.job_name !== "adhoc_accrual_backfill" &&
                job.job_name !== "payslip_retention_cleanup" && (
                  <button
                      onClick={() =>
                      handleSave(job.job_name, job.cron_expression || "")
                    }
                    className="btn-primary flex items-center gap-1"
                    disabled={
                      !isAllowed ||
                      savingJob === job.job_name
                    }
                  >
                    <Save className="w-4 h-4" />
                    {savingJob === job.job_name ? "Saving..." : "Save"}
                  </button>
                )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {job.job_name !== "adhoc_accrual_backfill" && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Cron Schedule
                </label>
               <input
              type="text"
              disabled={!isAllowed}
              defaultValue={job.cron_expression || ""}
              onChange={(e) => (job.cron_expression = e.target.value)}
              className="input w-full"
            />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                {job.job_name === "adhoc_accrual_backfill"
                  ? "Select Run Date"
                  : "Adhoc Run Date (Optional)"}
              </label>
              <input
                type="date"
                value={adhocDates[job.job_name] || ""}
                disabled={!isAllowed}
                onChange={(e) =>
                  setAdhocDates((prev) => ({
                    ...prev,
                    [job.job_name]: e.target.value,
                  }))
                }
                className="input w-full"
              />
              {job.job_name === "monthly_accrual" && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  <strong>Tip:</strong> If you select an{" "}
                  <strong>Adhoc Run Date</strong>, accruals will be calculated
                  only for the current calendar year — from{" "}
                  <span className="font-medium">January 1</span> up to the
                  selected month’s end. Existing audit records within this year
                  are respected, and only missing months are accrued. If no date
                  is selected, the job behaves like the regular monthly cron
                  run, resuming from the latest recorded accrual.
                </p>
              )}
            </div>

            {job.job_name === "monthly_accrual" && (
              <div className="mt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!forceFullAccrualFlags[job.job_name]}
                    onChange={(e) =>
                      setForceFullAccrualFlags((prev) => ({
                        ...prev,
                        [job.job_name]: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Force Full Accrual (from Hire Date)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6 leading-snug">
                  <span className="block">
                    <strong>When enabled:</strong> Rebuilds all leave accruals
                    from the employee’s hire date, ignoring previous audit
                    records and probation restrictions. Use only when
                    recalculating full history or fixing mismatched accrual
                    balances.
                  </span>
                  <span className="block mt-1">
                    <strong>When disabled:</strong> Runs the normal accrual
                    logic from the latest recorded month or year-end
                    carry-forward, preserving existing records and respecting
                    probation completion dates.
                  </span>
                  <span className="block mt-1 text-gray-600 font-semibold">
                    Recommended: Keep Disabled (default)
                  </span>
                </p>
              </div>
            )}
          </div>

          {[
            "monthly_accrual",
            "year_end_carry_forward",
            "carry_forward_expiry",
          ].includes(job.job_name) && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Run For Employee (Optional)
              </label>

              <AsyncSelect
                cacheOptions
                isDisabled={!isAllowed}
                defaultOptions={employeeOptions}
                loadOptions={loadEmployeeOptions}
                value={selectedEmployees[job.job_name] || null}
                onChange={(selected) =>
                  setSelectedEmployees((prev) => ({
                    ...prev,
                    [job.job_name]: selected,
                  }))
                }
                placeholder="Search employee by name or email…"
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "40px",
                    borderRadius: "0.5rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#9ca3af" },
                  }),
                  menu: (base) => ({ ...base, zIndex: 50 }),
                  placeholder: (base) => ({ ...base, color: "#9ca3af" }),
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={
    !isAllowed ||
    job.job_name === "payslip_retention_cleanup"
  }
                checked={job.is_active}
                onChange={(e) => handleToggle(job.job_name, e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700">
                {job.is_active ? "Active" : "Inactive"}
              </span>
            </label>
          </div>
        </div>
      );})}

      {selectedJob && (
        <JobRunDialog
          jobName={selectedJob}
          status={jobStatus}
          open={showJobDialog}
          onClose={() => {
            setShowJobDialog(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}
