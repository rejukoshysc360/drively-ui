import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useEmployee,
  useEmployeePhotoUrl,
  useUpdateEmployee,
  useUploadEmployeePhoto,
} from "../hooks";
import type { Employee } from "../api";
import { toast } from "react-hot-toast";
import { useDepartments } from "../../organizations/settings/departments/hooks";
import { useDesignations } from "../../organizations/settings/designations/hooks";
import { Upload, AlertTriangle, RefreshCw } from "lucide-react";
import { CommonComplianceSection } from "./compliance/CommonComplianceSection";
import { UAEComplianceSection } from "./compliance/UAEComplianceSection";
import { IndiaComplianceSection } from "./compliance/IndiaComplianceSection";
import { InputField } from "../../../components/ui/InputField";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useSalaryHistory } from "../history-base-salary/hooks";
import { parseDate } from "../../../../src/utils/DateUtils";
import { useCan } from "../../../utils/permissions";
import { useRunJob } from "../../system-settings/hooks";

import {
  getEmailValidationMessage,
  getPhoneValidationMessage,
} from "../../../utils/validators";
import { differenceInMonths, isEqual, parseISO } from "date-fns";

export default function EmployeeGeneralTab() {
  const routeParams = useParams<{ employeeId: string }>();
  const { profile, organization_country_code } = useAuth();
  const userRoleSlug = profile?.roles?.slug || "";
  const isEmployee = userRoleSlug === "emp";
  const isManager = userRoleSlug === "manager";

  const isHR = userRoleSlug === "hr";
  const isAdmin = userRoleSlug === "admin";

    const SELF_EDITABLE_FIELDS: (keyof Employee)[] = [
      "full_name",
      "email",
      "phone",
      "dob",
    ];

    const isFieldEditable = (field: keyof Employee) => {
      if (isHR || isAdmin) return true;
      if (isSelfView && SELF_EDITABLE_FIELDS.includes(field)) return true;
      return false;
    };
      
  const can = useCan();

  // 🧭 Determine which record is being viewed
  const employeeId = routeParams.employeeId || profile?.id || "";

  const isOwnRecord = profile?.id?.toString() === employeeId?.toString();
  const isSelfView = (isEmployee || isManager) && isOwnRecord;


  const canUpdate = can("employees:update");
  const canViewAll = can("employees:view");
  const canViewOwn = can("employees:view_own_record_only");

  // ✅ Combine HR and Employee selfView permissions
  const canView = isSelfView || canViewAll || (canViewOwn && isOwnRecord);

  // 🔒 Permission Guard
  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s general information.
        </h2>
      </div>
    );
  }

  // 🔒 Extra safety: if employee tries to hack another record
  if (isSelfView && !isOwnRecord) {
    return (
      <div className="p-8 text-center text-red-600">
        You can only view your own record.
      </div>
    );
  }

  const { data: employee, isLoading, refetch: refetchEmployee } = useEmployee(employeeId || "");
  const updateMutation = useUpdateEmployee(employeeId || "");
  const { data: deptData, isLoading: deptLoading } = useDepartments(1, 1000);
  const departments = deptData?.departments ?? [];

  const [isEditing, setIsEditing] = useState(false);
  const uploadPhoto = useUploadEmployeePhoto(employeeId);
  const [progress, setProgress] = useState(0);

  const { data: salaryHistory = [] } = useSalaryHistory(employeeId);
  const earliestSalaryDate = salaryHistory
    .map((r: any) => r.effective_from)
    .filter(Boolean)
    .sort()[0];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  const [showResync, setShowResync] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  const noAccruals = (employee.existing_accruals_count ?? 0) === 0;
  const hasOldDOJ = differenceInMonths(new Date(), new Date(employee.hire_date)) >= 1;
  const neverResynced = employee.accrual_last_resync_doj === null;

  const shouldShowNoAccrualHint = noAccruals && hasOldDOJ && neverResynced;



  const runJob = useRunJob();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (!file) return;
    if (file.size === 0) return;
    uploadPhoto.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: () => {
          setProgress(0);
          photoDownload.mutate(undefined, { onSuccess: (res) => setPhotoUrl(res.url) });
        },
      }
    );
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
    trigger,
  } = useForm<Partial<Employee>>({
    mode: "onTouched",
  });

  const watchHireDate = watch("hire_date");
  const registeredFields = useRef<Set<string>>(new Set());
  const registerTracked = (name: keyof Employee, options?: any) => {
    registeredFields.current.add(name as string);
    return register(name as any, options);
  };

  const deptId = watch("department_id") || "";
  const { data: designationData, isLoading: designationLoading } = useDesignations(deptId, 1, 1000);
  const designations = designationData?.designations ?? [];

  const photoDownload = useEmployeePhotoUrl(employeeId!);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const hasFetchedPhoto = useRef(false);

  useEffect(() => {
    if (!employeeId) return;
    if (hasFetchedPhoto.current) return;
    hasFetchedPhoto.current = true;

    photoDownload.mutate(undefined, {
      onSuccess: (res) => setPhotoUrl(res.url),
      onError: () => setPhotoUrl(null),
    });
  }, [employeeId]);

  useEffect(() => {
    if (employee) reset(employee);
  }, [employee, reset]);


useEffect(() => {
  if (!employee || isResyncing) return;

  const hasAccruals = (employee.existing_accruals_count ?? 0) > 0;
  if (!hasAccruals) {
    setShowResync(false);
    return;
  }

  const hireDate = employee.hire_date
    ? parseISO(employee.hire_date)
    : null;

  const lastResyncDate = employee.accrual_last_resync_doj
    ? parseISO(employee.accrual_last_resync_doj)
    : null;

  const today = new Date();

  /**
   * ✅ RULE:
   * - If hireDate is in the future → NO RESYNC
   * - If accruals exist AND
   *   - resync never happened → SHOW
   *   - OR DOJ != last resynced DOJ → SHOW
   */
  const shouldShow =
    hireDate !== null &&
    hireDate <= today && // 🚫 DOJ in future → skip
    (
      lastResyncDate === null || // 🔥 never resynced
      !isEqual(hireDate, lastResyncDate) // 🔥 DOJ changed after resync
    );

  setShowResync(shouldShow);
}, [
  employee?.existing_accruals_count,
  employee?.accrual_last_resync_doj,
  employee?.hire_date,
  isResyncing,
]);

  const handleResyncAccruals = (empId: string) => {
    setIsResyncing(true);
   
    runJob.mutate(
      { jobKey: "doj_resync_accrual", employeeId: empId },
      {
        onSuccess: async () => {
          await refetchEmployee();
          setIsResyncing(false);
          setShowResync(false);
        },
        onError: () => {
          setIsResyncing(false);
          setShowResync(true);
        },
      }
    );
  };

  const performSave = (data: Partial<Employee>) => {
    console.log("performSave] Called with:", data);

    const normalize = (v: any, key?: string) => {
      if (v === "" && key?.includes("date")) return null;
      if (v === "" || v === undefined) return null;
      return v;
    };

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([key]) => registeredFields.current.has(key))
    );

    console.log("Filtered fields:", filtered);

    const diff: Partial<Employee> = {};
    for (const key in filtered) {
      const newVal = normalize(filtered[key as keyof Employee], key);
      const oldVal = normalize(employee?.[key as keyof Employee], key);
      if (newVal !== oldVal) {
        // 🔐 Restrict fields for non-HR
        if (!isHR && !isAdmin) {
          if (!SELF_EDITABLE_FIELDS.includes(key as keyof Employee)) {
            continue;
          }
        }

        diff[key as keyof Employee] = newVal;
      }
    }

    const safeDiff = Object.fromEntries(
      Object.entries(diff).map(([k, v]) => [k, normalize(v, k)])
    );

    console.log("Final diff passed to mutation:", safeDiff);

    // VALIDATION BEFORE SAVE
    if (safeDiff.email) {
      const msg = getEmailValidationMessage(safeDiff.email);
      if (msg) {
        toast.error(msg);
        return;
      }
    }

    if (safeDiff.phone) {
      const code =
        organization_country_code === "IN"
          ? "+91"
          : organization_country_code === "AE"
          ? "+971"
          : "+1";
      const msg = getPhoneValidationMessage(safeDiff.phone, code);
      if (msg) {
        toast.error(msg);
        return;
      }
    }

    if (Object.keys(safeDiff).length === 0) {
      console.log("No changes detected");
      toast("No changes detected");
      return;
    }

    updateMutation.mutate(safeDiff, {
      onSuccess: () => {
        console.log("Employee general info updated");
        toast.success("Employee general info updated");
        setIsEditing(false);
        if (
          "hire_date" in safeDiff &&
          (employee?.existing_accruals_count ?? 0) > 0
        ) {
          if (employee?.accrual_last_resync_doj !== safeDiff.hire_date) {
            setShowResync(true);
          } else {
            setShowResync(false);
          }
        }
      },
      onError: (err) => {
        console.log("updateMutation error:", err);
        toast.error("Failed to update employee info");
      },
    });
  };

  const onSubmit = handleSubmit(async (data) => {
    console.log("onSubmit] Fired");
    console.log("Form data:", data);

    const newHireDateStr = watchHireDate || data.hire_date;
    console.log("newHireDateStr:", newHireDateStr);

    if (!newHireDateStr) {
      console.log("No hire_date field – performing save directly");
      performSave(data);
      return;
    }

    const oldHireDate = employee?.hire_date;
    console.log("oldHireDate:", oldHireDate);

    if (!oldHireDate || newHireDateStr === oldHireDate) {
      console.log("Hire date unchanged – performing save");
      performSave(data);
      return;
    }

    const newDate = parseDate(newHireDateStr);
    const oldDate = parseDate(oldHireDate);

    console.log("Parsed newDate:", newDate);
    console.log("Parsed oldDate:", oldDate);
    console.log("earliestSalaryDate:", earliestSalaryDate);

    if (earliestSalaryDate) {
      const earliest = parseDate(earliestSalaryDate);
      console.log("Parsed earliest salary date:", earliest);

      if (newDate > earliest) {
        console.log("BLOCK: hire date > earliest salary date");

        setConfirmConfig({
          title: "Invalid Hire Date",
          description: (
            <div className="text-sm space-y-2 text-red-700">
              <p>
                You cannot set hire date <strong>after</strong> the first salary record date:
              </p>
              <p className="font-semibold">{earliestSalaryDate}</p>
              <p>This would violate payroll history integrity.</p>
            </div>
          ),
          confirmLabel: "OK",
          danger: true,
          onConfirm: () => setConfirmOpen(false),
        });

        setConfirmOpen(true);
        return;
      }

      if (newDate < earliest) {
        console.log("GAP DETECTED: newDate < earliest");
        console.log("Opening ConfirmDialog…");

        setConfirmConfig({
          title: "DANGER: Payroll Gap Will Be Created",
          description: (
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <span>
                  Changing hire date from <strong>{oldHireDate}</strong> →{" "}
                  <strong>{newHireDateStr}</strong>
                </span>
              </p>
              <div className="bg-red-50 border border-red-300 rounded p-3 text-red-900 text-xs">
                <strong>CRITICAL PAYROLL GAP:</strong>
                <ul className="mt-2 space-y-1 list-disc ml-5">
                  <li>
                    Employee will have <strong>NO salary</strong> from{" "}
                    <strong>{newHireDateStr}</strong> to{" "}
                    <strong>{earliestSalaryDate}</strong>
                  </li>
                  <li>This is <strong>illegal</strong> — employee must be paid from hire date</li>
                </ul>
              </div>
              <p className="font-medium text-red-700">
                Only proceed if you will add missing salary records{" "}
                <strong>immediately</strong>.
              </p>
            </div>
          ),
          confirmLabel: "Yes — I will add salary records now",
          danger: true,
          onConfirm: () => {
            console.log("ConfirmDialog] Confirm clicked");
            console.log("Closing dialog + performing save…");

            setConfirmOpen(false);
            performSave(data);
          },
        });

        console.log("confirmConfig created:", {
          newDate,
          earliestSalaryDate,
          config: "see above",
        });

        setConfirmOpen(true);
        console.log("confirmOpen = true (dialog should be visible)");

        return;
      }
    }

    console.log("Safe change – performing save");
    performSave(data);
  });

  if (isLoading) return <p className="p-4">Loading employee info…</p>;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">General Information</h2>

       {(canUpdate || isSelfView) && (
          <button
            type="button"
            className="text-sm text-blue-600 underline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Lock editing" : "Unlock for editing"}
          </button>
        )}

        </div>

        <form onSubmit={onSubmit} className="card p-4 bg-white shadow rounded space-y-6 text-sm sm:text-base">
          {!isSelfView && (
          <p>
            General details for employee{" "}
            <span className="font-medium">
              {employee?.full_name || `#${employeeId}`}
            </span>
          </p>
          )} 
          <div>
             {!isSelfView && (
            <>
            <h3 className="font-medium mb-2">Basic Details</h3>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-md border border-gray-200 flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Employee Photo"
                    className="object-contain w-full h-full rounded-full bg-white p-[2px] transition-transform duration-300 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Photo
                  </div>
                )}
                <div className="absolute inset-0 rounded-full ring-2 ring-indigo-200 pointer-events-none"></div>
              </div>
              {isEditing && (
                <div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo
                  </label>
                  {progress > 0 && (
                    <div className="w-40 mt-2 bg-gray-200 rounded h-2 overflow-hidden">
                      <div
                        className="h-2 bg-indigo-500 rounded transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
             </>
  )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                name="employee_number"
                label="Employee No"
                 isEditing={isEditing && isFieldEditable("employee_number")}
                registerTracked={registerTracked}
                errors={errors}
              />
              <InputField
                name="full_name"
                label="Full Name"
                isEditing={isEditing && isFieldEditable("full_name")}
                registerTracked={registerTracked}
                errors={errors}
              />

              {/* EMAIL WITH INLINE VALIDATION */}
              <InputField
                name="email"
                label="Email"
                type="email"
                isEditing={isEditing && isFieldEditable("email")}
                registerTracked={(name) =>
                  registerTracked(name, {
                    required: "Email is required",
                    validate: (value: string) =>
                      !value || getEmailValidationMessage(value) === "" || getEmailValidationMessage(value),
                  })
                }
                errors={errors}
              />

              {/* PHONE WITH INLINE VALIDATION */}
              <InputField
                name="phone"
                label="Phone"
                type="tel"
                isEditing={isEditing && isFieldEditable("phone")}
                registerTracked={(name) =>
                  registerTracked(name, {
                    validate: (value: string) => {
                      if (!value?.trim()) return true;
                      const code =
                        organization_country_code === "IN"
                          ? "+91"
                          : organization_country_code === "AE"
                          ? "+971"
                          : "+1";
                      const msg = getPhoneValidationMessage(value, code);
                      return !msg || msg;
                    },
                  })
                }
                errors={errors}
              />

              <InputField
                name="dob"
                label="Date of Birth"
                type="date"
                isEditing={isEditing && isFieldEditable("dob")}
                registerTracked={registerTracked}
                errors={errors}
              />

              <div className="relative">
                <InputField
                  name="hire_date"
                  label="Hire Date / Joining Date"
                  type="date"
                  isEditing={isEditing && isFieldEditable("hire_date")}
                  registerTracked={registerTracked}
                  errors={errors}
                />
                {employee?.hire_date &&
  (employee?.existing_accruals_count ?? 0) === 0 &&
  !employee?.accrual_last_resync_doj &&
  differenceInMonths(new Date(), new Date(employee.hire_date)) >= 1 && (
    <div className="mt-2 p-3 text-sm border border-yellow-300 bg-yellow-50 text-yellow-800 rounded shadow-sm">
      <strong>Note:</strong> This employee has no accruals yet.<br />
      The Date of Joining is <strong>{employee.hire_date}</strong> and today is{" "}
      <strong>{new Date().toISOString().slice(0, 10)}</strong>.<br />
      Please run the{" "}
      <span className="font-medium">Monthly Accrual Job</span> with{" "}
      <code className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300 text-xs">
        Run Date = Today for <b>for this employee</b>
      </code>{" "}
      to generate accruals.
    </div>
  )}


                {showResync && (
                  <button
                    type="button"
                    onClick={() => handleResyncAccruals(employee.id)}
                    className="absolute -bottom-5 left-0 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    {isResyncing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Re-syncing…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-sync Accruals
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Organization & Location */}
          <div>
            <h3 className="font-medium mb-2">Organization & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Department / Location
                </label>
                {isEditing && isFieldEditable("department_id") ? (
                  <select
                    className="input w-full"
                    disabled={deptLoading}
                    {...registerTracked("department_id")}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input w-full bg-gray-100"
                    value={
                      departments.find((d) => d.id === employee?.department_id)?.name || ""
                    }
                    disabled
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Designation
                </label>
               {isEditing && isFieldEditable("designation_id") ? (
                  <select
                    className="input w-full"
                    disabled={designationLoading || !deptId}
                    {...registerTracked("designation_id")}
                  >
                    <option value="">Select designation</option>
                    {designations.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input w-full bg-gray-100"
                    value={
                      designations.find((d: any) => d.id === employee?.designation_id)?.title || ""
                    }
                    disabled
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Country</label>
                <input
                  type="text"
                  className="input w-full bg-gray-100"
                  value={organization_country_code}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Compliance Sections */}
{(organization_country_code === "AE" || organization_country_code === "IN") && (
  <div className="mt-6">
    <h3 className="font-medium mb-2">Compliance Document Details</h3>

    {/* ✅ Responsive scroll wrapper to prevent cutoff */}
    <div className="w-full overflow-x-auto">
      <div
        className="
          grid grid-cols-1
          lg:grid-cols-2
          gap-x-8 gap-y-6
          min-w-[900px]    /* ensures horizontal scroll for small viewports */
        "
      >
        <CommonComplianceSection
          isEditing={isEditing && (isHR || isAdmin)}
          registerTracked={registerTracked}
          designationLoading={designationLoading}
          deptId={deptId}
          designations={designations}
          employee={employee}
        />

        {organization_country_code === "AE" && (
          <UAEComplianceSection
            isEditing={isEditing && (isHR || isAdmin)}
            registerTracked={registerTracked}
            employee={employee}
          />
        )}

        {organization_country_code === "IN" && (
          <IndiaComplianceSection
            isEditing={isEditing && (isHR || isAdmin)}
            registerTracked={registerTracked}
          />
        )}

        {/* ✅ Only show for HR/Admin, hide from employee self-view */}
        {!isSelfView && (
          <div className="border-t border-gray-200 pt-4 mt-4 col-span-full">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...registerTracked("disable_compliance_alerts")}
                disabled={!isEditing}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Disable compliance alerts for this employee
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              When checked, this employee will not receive email reminders for document or probation expiry.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}


          {/* Save Button */}
          {isEditing && isDirty && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save Settings"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmLabel={confirmConfig?.confirmLabel}
        danger={confirmConfig?.danger}
        isLoading={false}
        onConfirm={confirmConfig?.onConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}