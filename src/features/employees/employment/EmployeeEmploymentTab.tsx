import { useParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "../../auth/AuthProvider";
import Select from "react-select";
import debounce from "lodash/debounce";
import { useCan } from "../../../utils/permissions";

import {
  useEmployeeEmployment,
  useUpdateEmployeeEmployment,
} from "../employment/hooks";
import type { EmployeeEmployment } from "../employment/api";
import { useEmployeesCrossOrgByRole } from "../../employees/hooks";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { APP_CONFIG } from "../../../../src/config/appConfig";
import { emitApiError } from "../../../lib/error-bus";

export default function EmployeeEmploymentTab() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { organization_id } = useAuth();

  const can = useCan();
  const canView = can("employees:view");
  const canUpdate = can("employees:update");

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s employment
          information
        </h2>
      </div>
    );
  }

  const { data: employment, isLoading } = useEmployeeEmployment(
    employeeId || "",
  );
  const updateMutation = useUpdateEmployeeEmployment(employeeId || "");

  const [isEditing, setIsEditing] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const [dateErrors, setDateErrors] = useState({
    notice_given_date: "",
    end_date: "",
    probation_end_date: "",
  });

  const { register, handleSubmit, reset, watch, setValue, formState } =
    useForm<Partial<EmployeeEmployment>>();

  const registeredFields = useRef<Set<string>>(new Set());

  const registerTracked = (name: keyof EmployeeEmployment, options?: any) => {
    registeredFields.current.add(name as string);
    return register(name as any, options);
  };

  useEffect(() => {
    registerTracked("managed_by");
    registerTracked("manager_label");
  }, [register]);

  const hireDateStr =
    employment?.employees?.hire_date || (employment as any)?.start_date || "";
  const hireDate = hireDateStr ? new Date(hireDateStr) : null;

  const noticeGivenDate = watch("notice_given_date");
  const endDate = watch("end_date");
  const probationEndDate = watch("probation_end_date");

  useEffect(() => {
    if (!hireDate) {
      setDateErrors({
        notice_given_date: "",
        end_date: "",
        probation_end_date: "",
      });
      return;
    }

    const normalizedHireDate = new Date(hireDate);
    normalizedHireDate.setHours(0, 0, 0, 0);

    const errors: typeof dateErrors = {
      notice_given_date: "",
      end_date: "",
      probation_end_date: "",
    };

    const checkDate = (
      value: string | undefined | null,
      field: keyof typeof errors,
      label: string,
    ) => {
      if (!value) return;
      const selected = new Date(value);
      selected.setHours(0, 0, 0, 0);
      if (selected < normalizedHireDate) {
        errors[field] =
          `${label} cannot be earlier than Joining Date (${normalizedHireDate.toLocaleDateString()})`;
      }
    };

    checkDate(noticeGivenDate, "notice_given_date", "Notice Given Date");
    checkDate(endDate, "end_date", "Employment End Date");
    checkDate(probationEndDate, "probation_end_date", "Probation End Date");

    setDateErrors(errors);
  }, [noticeGivenDate, endDate, probationEndDate, hireDate]);

  useEffect(() => {
    if (employment) {
      reset({
        ...employment,
        start_date: hireDateStr,
        manager_label: employment.manager?.full_name || "",
      });
    }
  }, [employment, reset, hireDateStr]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const pendingDiffRef = useRef<Partial<EmployeeEmployment> | null>(null);

  const onSubmit = (data: Partial<EmployeeEmployment>) => {
    if (Object.values(dateErrors).some((err) => err !== "")) {
      toast.error("Please fix the date errors before saving");
      return;
    }

    if (data.end_date && !data.termination_reason) {
      setReasonError(
        "Please select a termination reason when end date is provided",
      );
      return;
    } else {
      setReasonError(null);
    }

    if (data.termination_reason && !data.end_date) {
      emitApiError({
        message:
          "Employment End Date is required when a separation reason is selected.",
      });
      return;
    }

    if (data.probation_status === "completed" && !data.probation_end_date) {
      emitApiError({
        message: "Probation End Date is required when status is Completed",
      });
      return;
    }

    const noticeStart = data.notice_given_date
      ? new Date(data.notice_given_date)
      : null;
    const resignationDate = data.end_date ? new Date(data.end_date) : null;
    if (noticeStart && resignationDate && noticeStart > resignationDate) {
      emitApiError({
        message: "Notice Given Date cannot be after Employment End Date",
      });
      return;
    }

    const normalize = (v: any) => (v === "" || v === undefined ? null : v);

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) => registeredFields.current.has(k)),
    );

    const diff: Partial<EmployeeEmployment> = {};
    for (const key in filtered) {
      const newVal = normalize(filtered[key as keyof EmployeeEmployment]);
      const oldVal = normalize(employment?.[key as keyof EmployeeEmployment]);
      if (newVal !== oldVal) {
        diff[key as keyof EmployeeEmployment] = newVal;
      }
    }

    delete diff.manager_label;

    if (Object.keys(diff).length === 0) {
      toast("No changes detected");
      setIsEditing(false);
      return;
    }

    pendingDiffRef.current = diff;

    updateMutation.mutate(diff, {
      onSuccess: (resp: any) => {
        if (resp?.warning && resp?.requireConfirmation) {
          setConfirmMessage(resp.warning);
          setConfirmOpen(true);
          return;
        }
        toast.success("Employment information updated");
        setIsEditing(false);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Update failed");
      },
    });
  };

  const handleAcknowledgeWarning = () => {
    if (!pendingDiffRef.current) return;
    updateMutation.mutate({ ...pendingDiffRef.current, force: true } as any, {
      onSuccess: () => {
        toast.success("Updated successfully");
        setConfirmOpen(false);
        setIsEditing(false);
      },
    });
  };

  // 🔹 Manager search and selection state
  const [searchText, setSearchText] = useState("");
  const effectiveSearch = searchText.length >= 3 ? searchText.trim() : "";
  const { data: searchResults, isLoading: isSearching } =
    useEmployeesCrossOrgByRole(1, 50, effectiveSearch, "manager");
  const { data: defaultResults } = useEmployeesCrossOrgByRole(
    1,
    50,
    "",
    "manager",
  );

  const managerOptions =
    (effectiveSearch
      ? searchResults?.employees
      : defaultResults?.employees
    )?.map((e: any) => ({
      value: e.id,
      label: `${e.full_name} (${e.email || ""})`,
    })) || [];

  // 🔹 Selected manager local state
  const [selectedManager, setSelectedManager] = useState<any>(null);
  useEffect(() => {
    if (employment?.managed_by) {
      setSelectedManager({
        value: employment.managed_by,
        label: employment.manager?.full_name || "",
      });
    } else {
      setSelectedManager(null);
    }
  }, [employment]);

  if (isLoading) {
    return <p className="p-4">Loading employment information…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Employment Information</h2>

        {canUpdate && (
          <button
            type="button"
            className="text-sm text-blue-600 underline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Lock editing" : "Unlock for editing"}
          </button>
        )}
      </div>

      {hireDate && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
          <strong>Note:</strong> Notice Given Date, Employment End Date, and
          Probation End Date <strong>must be on or after</strong> the Joining
          Date: <strong>{hireDate.toLocaleDateString()}</strong>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card p-6 bg-white shadow rounded space-y-8"
      >
        <div>
          <h3 className="font-medium mb-4">Job & Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="job_title"
              label="Job Title"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <ReadOnlyField
              label="Department"
              value={employment?.employees?.departments?.name || ""}
            />

            <ReadOnlyField
              label="Designation"
              value={employment?.employees?.designations?.title || ""}
            />

            {/* 🔹 Reporting Manager */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Reporting Manager
              </label>

              {isEditing ? (
                <Select
                  options={managerOptions}
                  value={selectedManager}
                  onChange={(opt) => {
                    setSelectedManager(opt);
                    setValue("managed_by", opt?.value || null, {
                      shouldDirty: true,
                    });
                    setValue("manager_label", opt?.label || "", {
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(input) => setSearchText(input)}
                  placeholder="Type to search (min 3 chars)..."
                  isClearable
                  isSearchable
                  isLoading={isSearching}
                  noOptionsMessage={() =>
                    searchText.length < 3
                      ? "Type at least 3 characters"
                      : "No managers found"
                  }
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      borderColor: "#d1d5db",
                      minHeight: "36px",
                      boxShadow: "none",
                    }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              ) : (
                <input
                  type="text"
                  className="input w-full bg-gray-100"
                  value={employment?.manager?.full_name || ""}
                  disabled
                />
              )}
            </div>

            <SelectField
              name="employment_type"
              label="Employment Type"
              options={[
                { value: "", label: "-- Select --" },
                { value: "full_time", label: "Full-time" },
                { value: "part_time", label: "Part-time" },
                { value: "contract", label: "Contract" },
                { value: "intern", label: "Intern" },
              ]}
              isEditing={isEditing}
              registerTracked={registerTracked}
            />
          </div>
        </div>

        {/* Joining & Probation */}
        <div>
          <h3 className="font-medium mb-4">Joining Dates & Probation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <ReadOnlyField
              label="Joining Date"
              value={hireDateStr}
              type="date"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              name="probation_status"
              label="Probation Status"
              options={[
                { value: "", label: "-- Select --" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "waived", label: "Waived" },
              ]}
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <InputField
              name="probation_end_date"
              label="Probation End Date"
              type="date"
              isEditing={isEditing}
              registerTracked={registerTracked}
              error={dateErrors.probation_end_date}
            />
          </div>
        </div>

        {/* Separation Details */}
        <div>
          <h3 className="font-medium mb-4">Separation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              name="termination_reason"
              label="Reason for Separation"
              options={[
                { value: "", label: "-- Select Reason --" },
                ...APP_CONFIG.FINAL_SETTLEMENT.REASON_OPTIONS.map((r) => ({
                  value: r.value,
                  label: r.label,
                })),
              ]}
              isEditing={isEditing}
              registerTracked={registerTracked}
              error={reasonError}
            />

            <InputField
              name="notice_given_date"
              label="Notice Given Date"
              type="date"
              isEditing={isEditing}
              registerTracked={registerTracked}
              error={dateErrors.notice_given_date}
            />

            <InputField
              name="end_date"
              label="Employment End Date"
              type="date"
              isEditing={isEditing}
              registerTracked={registerTracked}
              error={dateErrors.end_date}
            />
          </div>
        </div>

        {isEditing && formState.isDirty && (
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Notice Period Warning"
        description={confirmMessage || "Notice period policy not met."}
        confirmLabel="Acknowledge & Proceed"
        danger
        isLoading={updateMutation.isPending}
        onConfirm={handleAcknowledgeWarning}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmMessage(null);
        }}
      />
    </div>
  );
}

/* Helper Components */
function InputField({
  name,
  label,
  type = "text",
  isEditing = false,
  registerTracked,
  error,
  ...rest
}: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${!isEditing ? "bg-gray-50" : ""}`}
        disabled={!isEditing}
        {...registerTracked(name)}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  isEditing,
  registerTracked,
  error,
}: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${!isEditing ? "bg-gray-50" : ""}`}
        disabled={!isEditing}
        {...registerTracked(name)}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value, type = "text" }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
        value={value || ""}
        disabled
        readOnly
      />
    </div>
  );
}
