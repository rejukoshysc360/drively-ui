import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  useEmployeePersonal,
  useUpdateEmployeePersonal,
} from "./hooks";
import type { EmployeePersonal } from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { useCan } from "../../../utils/permissions";

export default function EmployeePersonalTab() {
  const routeParams = useParams<{ employeeId: string }>();
  const { profile } = useAuth();
  const can = useCan();

  // 🧭 Determine which record is being viewed
  const employeeId = routeParams.employeeId || profile?.id || "";

  // 🧠 Role + ownership
  const userRoleSlug = profile?.roles?.slug || "";
  const isEmployee = userRoleSlug === "emp";

  const isOwnRecord =
    String(profile?.id) === String(employeeId);

  const isSelfView = isEmployee && isOwnRecord;

  // ✅ View permissions
  const canViewAll = can("employees:personal:view");
  const canViewOwn = can("employees:personal:view_own_record_only");

  // ✅ Update permissions (UPDATED)
  const canUpdateAll = can("employees:personal:update");
  const canUpdateOwn = can("employees:personal:update_own_record_only");

  // ✅ Final permissions
  const canView =
    isSelfView || canViewAll || (canViewOwn && isOwnRecord);

  const canEdit =
    canUpdateAll || (canUpdateOwn && isOwnRecord) || isSelfView;

  // 🚫 Block unauthorized access
  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s personal information.
        </h2>
      </div>
    );
  }

  // 🚫 Prevent employee from accessing others
  if (isEmployee && !isOwnRecord) {
    return (
      <div className="p-8 text-center text-red-600">
        You can only view your own record.
      </div>
    );
  }

  const { data: personal, isLoading } = useEmployeePersonal(employeeId || "");
  const updateMutation = useUpdateEmployeePersonal(employeeId || "");
  const [isEditing, setIsEditing] = useState(false);

  // ✅ react-hook-form
  const { register, handleSubmit, reset, formState } =
    useForm<Partial<EmployeePersonal>>();

  const registeredFields = useRef<Set<string>>(new Set());

  const registerTracked = (name: keyof EmployeePersonal, options?: any) => {
    registeredFields.current.add(name as string);
    return register(name as any, options);
  };

  useEffect(() => {
    if (personal) reset(personal);
  }, [personal, reset]);

  // ✅ Submit diff only
  const onSubmit = (data: Partial<EmployeePersonal>) => {
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        registeredFields.current.has(key)
      )
    );

    const diff: Partial<EmployeePersonal> = {};

    for (const key in filtered) {
      if (
        filtered[key as keyof EmployeePersonal] !==
        personal?.[key as keyof EmployeePersonal]
      ) {
        diff[key as keyof EmployeePersonal] =
          filtered[key as keyof EmployeePersonal];
      }
    }

    if (Object.keys(diff).length === 0) {
      toast("No changes detected");
      return;
    }

    updateMutation.mutate(diff, {
      onSuccess: () => {
        toast.success("Personal information updated");
        setIsEditing(false);
      },
      onError: () => {
        toast.error("Failed to update personal information");
      },
    });
  };

  if (isLoading)
    return <p className="p-4">Loading personal information…</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">
          Personal Information
        </h2>

        {/* 🔒 Edit toggle */}
        {canEdit && (
          <button
            type="button"
            className="text-sm text-blue-600 underline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Lock editing" : "Unlock for editing"}
          </button>
        )}
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card p-4 bg-white shadow rounded space-y-6 text-sm sm:text-base"
      >
        {/* Identity & Demographics */}
        <div>
          <h3 className="font-medium mb-2">Identity & Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              name="gender"
              label="Gender"
              options={[
                { value: "", label: "-- Select --" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <SelectField
              name="marital_status"
              label="Marital Status"
              options={[
                { value: "", label: "-- Select --" },
                { value: "single", label: "Single" },
                { value: "married", label: "Married" },
                { value: "divorced", label: "Divorced" },
                { value: "widowed", label: "Widowed" },
              ]}
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <InputField
              name="nationality"
              label="Nationality"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="font-medium mb-2">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="personal_email"
              label="Personal Email"
              type="email"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <TextareaField
              name="current_address"
              label="Current Address"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <TextareaField
              name="permanent_address"
              label="Permanent Address"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="font-medium mb-2">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="emergency_contact_name"
              label="Contact Name"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <InputField
              name="emergency_contact_relationship"
              label="Relationship"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />

            <InputField
              name="emergency_contact_phone"
              label="Contact Phone"
              type="tel"
              isEditing={isEditing}
              registerTracked={registerTracked}
            />
          </div>
        </div>

        {/* Save button */}
        {isEditing && formState.isDirty && canEdit && (
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
  );
}

/* --- Helper field components --- */
function InputField({
  name,
  label,
  type = "text",
  isEditing = false,
  disabled = false,
  className = "",
  registerTracked,
}: any) {
  return (
    <div className="col-span-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        className={`input w-full ${className}`}
        disabled={!isEditing || disabled}
        {...registerTracked(name)}
      />
    </div>
  );
}

function TextareaField({ name, label, isEditing = false, registerTracked }: any) {
  return (
    <div className="md:col-span-2">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <textarea
        className="input w-full"
        rows={3}
        disabled={!isEditing}
        {...registerTracked(name)}
      />
    </div>
  );
}

function SelectField({ name, label, options, isEditing, registerTracked }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <select
        className="input w-full"
        disabled={!isEditing}
        {...registerTracked(name)}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}