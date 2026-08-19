import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { emitApiError } from "../../lib/error-bus";
import {
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
  useSendOnboardingEmail,
} from "./hooks";
import { useRoles } from "../organizations/settings/roles/hooks";
import { parseApiError } from "../../../src/utils/parseApiError";
import { useCan } from "../../utils/permissions";
import { useAuth } from "../../features/auth/AuthProvider";
import { isValidEmail, getEmailValidationMessage } from "../../utils/validators"; // ✅ added import
import { Check, Loader2, Lock, Mail, Unlock } from "lucide-react"; // optional icons

type Employee = {
  id?: string;
  full_name: string;
  email: string;
  hire_date: string;
  role_id?: string;
  sendOnboardingEmail?: boolean; 
};

export default function EmployeeForm() {
  const { employeeId } = useParams();
  const isEdit = !!employeeId;
  const navigate = useNavigate();

  const { data: employee, isLoading } = useEmployee(employeeId || "");
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employeeId || "");
  const sendOnboardingEmailMutation = useSendOnboardingEmail();

  const can = useCan();

  const { profile } = useAuth(); // ✅ Get logged-in user's roles
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmailEditable, setIsEmailEditable] = useState(!isEdit); // 🔒 default locked in edit mode

  // ------------------ Load available roles ------------------
  const { data: rolesData } = useRoles(1, 100);
  let roles = rolesData?.roles ?? [];

  // ------------------ Detect logged-in admin ------------------
  const loggedInRoles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
    ? [profile.roles]
    : [];

  const loggedInSlugs = loggedInRoles.map((r: any) => r.slug);
  const isLoggedInAdmin = loggedInSlugs.includes("admin");

  // 🔥 Hide admin role ONLY for non-admin users
  if (!isLoggedInAdmin) {
    roles = roles.filter((r: any) => r.slug !== "admin");
  }

  // 🔒 Disable role dropdown if user doesn't have permission
  const canUpdateRole = can("roles:update");

  // ------------------ React Hook Form ------------------
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Employee>({
    defaultValues: {
      full_name: "",
      email: "",
      hire_date: "",
      role_id: "",
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        full_name: employee.full_name || "",
        email: employee.email || "",
        hire_date: employee.hire_date?.substring(0, 10) || "",
        role_id: employee.role_id || "",
      });
    }
  }, [employee, reset]);

  // ------------------ Submit ------------------
  const onSubmit = (values: Employee) => {
    const emailError = getEmailValidationMessage(values.email);
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    setErrorMessage("");

    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          setIsEmailEditable(false); // relock email
          navigate("/employees");
        },
        onError: (err) => emitApiError(parseApiError(err)),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => navigate("/employees"),
        onError: (err) => emitApiError(parseApiError(err)),
      });
    }
  };

  // ------------------ Loading ------------------
  if (isEdit && isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  // ------------------ Render ------------------
  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit Employee" : "Add Employee"}
      </h1>

      {errorMessage && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 mb-6 p-3 rounded border border-gray-200 bg-blue-50 text-sm text-gray-800">
        ℹ️ After creating an employee, please go to{" "}
        <strong>Employees → View → General Information</strong> to complete WPS
        and compliance details.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* -------- Full Name -------- */}
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            className="input w-full"
            {...register("full_name", { required: "Full name is required" })}
          />
          {errors.full_name && (
            <p className="text-xs text-red-600 mt-1">
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* -------- Email with Unlock -------- */}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <div className="flex gap-2 items-center">
            <input
              type="email"
              className={`input w-full ${
                !isEmailEditable
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : ""
              }`}
              disabled={!isEmailEditable}
              {...register("email", {
                required: "Email is required",
                validate: (value) =>
                  isValidEmail(value) || "Please enter a valid email address",
              })}
            />
            {isEdit && (
              <button
                type="button"
                onClick={() => setIsEmailEditable((prev) => !prev)}
                className="text-xs px-3 py-1 border rounded-md hover:bg-gray-50 flex items-center gap-1"
              >
                {isEmailEditable ? (
                  <>
                    <Lock size={12} /> Lock
                  </>
                ) : (
                  <>
                    <Unlock size={12} /> Unlock
                  </>
                )}
              </button>
            )}
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
          {!isEmailEditable && isEdit && (
            <p className="text-xs text-gray-500 mt-1">
              🔒 Click “Unlock” to edit this email address.
            </p>
          )}
        </div>

        {/* -------- Hire Date -------- */}
        <div>
          <label className="block text-sm font-medium">Hire Date</label>
          <input
            type="date"
            className="input w-full"
            {...register("hire_date", { required: "Hire date is required" })}
          />
          {errors.hire_date && (
            <p className="text-xs text-red-600 mt-1">
              {errors.hire_date.message}
            </p>
          )}
        </div>

        {!isEdit && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="sendOnboardingEmail"
            {...register("sendOnboardingEmail")}
          />
          <label htmlFor="sendOnboardingEmail" className="text-sm text-gray-700">
            Send Onboarding Email
          </label>
        </div>
      )}

        {/* -------- Role Dropdown -------- */}
        <div>
          <label className="block text-sm font-medium">Role</label>

          <select
            className="input w-full"
            disabled={!canUpdateRole}
            {...register("role_id", { required: "Role selection is required" })}
          >
            <option value="" disabled>
              Select a role
            </option>

            {roles.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {!canUpdateRole && (
            <p className="text-xs text-gray-500 mt-1">
              🔒 You do not have permission to change employee roles.
            </p>
          )}

          {errors.role_id && (
            <p className="text-xs text-red-600 mt-1">
              {errors.role_id.message}
            </p>
          )}
        </div>
        {/* -------- Action Buttons -------- */}

<div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-8">
  {isEdit && (
    <button
      type="button"
      className={`
        flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-medium
        transition-all duration-300 min-w-[220px]
        ${
          sendOnboardingEmailMutation.isSuccess
            ? "bg-green-600 text-white cursor-default shadow-green-200"
            : sendOnboardingEmailMutation.isError
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        }
      `}
      disabled={
        sendOnboardingEmailMutation.isPending ||
        sendOnboardingEmailMutation.isSuccess
      }
      onClick={() => {
        if (sendOnboardingEmailMutation.isSuccess) return;
        sendOnboardingEmailMutation.mutate(employeeId!, {
          onSuccess: () => {
          },
          onError: (error: any) => {
          },
        });
      }}
    >
      {/* LOADING STATE */}
      {sendOnboardingEmailMutation.isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sending Email...</span>
        </>
      ) : sendOnboardingEmailMutation.isSuccess ? (
        <>
          <Check className="w-4 h-4" />
          <span>Email Sent Successfully</span>
        </>
      ) : sendOnboardingEmailMutation.isError ? (
        <>
          <Mail className="w-4 h-4" />
          <span>Retry Sending Email</span>
        </>
      ) : (
        <>
          <Mail className="w-4 h-4" />
          <span>Send Onboarding Email</span>
        </>
      )}
    </button>
  )}

  <button
    type="submit"
    className="w-full sm:w-auto btn-primary text-sm px-5 py-2 rounded-md font-medium"
    disabled={createMutation.isLoading || updateMutation.isLoading}
  >
    {isEdit
      ? updateMutation.isLoading
        ? "Updating..."
        : "Update Employee"
      : createMutation.isLoading
      ? "Creating..."
      : "Create Employee"}
  </button>
</div>


      </form>
    </div>
  );
}
