import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../features/auth/AuthProvider";
import { useEmployee, useEmployeePhotoUrl } from "../employees/hooks";
import { formatDisplayDate } from "../../utils/DateUtils";

export default function EmployeeProfilePublic() {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const safeEmployeeId = employeeId || "";
  const { organization_country_code } = useAuth();

  const { data: employee, isLoading } = useEmployee(safeEmployeeId);
  const photoDownload = useEmployeePhotoUrl(safeEmployeeId);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const hasFetchedPhoto = useRef(false);

  // ✅ Reliable photo loading
  useEffect(() => {
    if (!safeEmployeeId || hasFetchedPhoto.current) return;

    if (employee?.photo_url) {
      setPhotoUrl(employee.photo_url);
      hasFetchedPhoto.current = true;
    } else {
      photoDownload.mutate(undefined, {
        onSuccess: (res) => {
          setPhotoUrl(res.url);
          hasFetchedPhoto.current = true;
        },
        onError: () => setPhotoUrl(null),
      });
    }
  }, [employee?.photo_url, safeEmployeeId]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );

  if (!employee)
    return (
      <div className="p-6 text-center text-gray-600">
        Employee record not found.
      </div>
    );

  const deptName = employee.department?.name || employee.department_name || "—";
  const desigTitle =
    employee.designation?.title || employee.designation_name || "—";

  // ✅ Copy handler (CSS-based checkmark change, no new hooks)
  const handleCopy = (
    e: React.MouseEvent<HTMLButtonElement>,
    text?: string | null,
  ) => {
    if (!text) return;
    const btn = e.currentTarget;
    btn.classList.add("copied");

    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Email copied to clipboard"))
      .catch(() => toast.error("Failed to copy"))
      .finally(() => {
        setTimeout(() => btn.classList.remove("copied"), 1000);
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm rounded-2xl space-y-8">
      {/* 🔙 Back Button */}
      <div>
        <button
          onClick={() => navigate("/employee/active-directory")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-36 h-36 rounded-full overflow-hidden border bg-gray-50 flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={employee.full_name}
              className="object-cover w-full h-full"
              onError={() => setPhotoUrl(null)}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
              No Photo
            </div>
          )}
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-gray-900">
            {employee.full_name}
          </h1>

          <p className="text-gray-600 text-sm mt-1">
            {desigTitle !== "—" ? desigTitle : ""}
            {deptName !== "—" && (
              <span className="text-gray-400">{" • " + deptName}</span>
            )}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <Info label="Employee No" value={employee.employee_number} />

        {/* ✉️ Email with Copy / Check icon */}
        <div className="flex items-start justify-between gap-2">
          <Info label="Email" value={employee.email} />
          {employee.email && (
            <button
              onClick={(e) => handleCopy(e, employee.email)}
              className="relative flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition icon-copy-btn"
              title="Copy email"
            >
              <Copy className="w-4 h-4 icon-copy" />
              <Check className="w-4 h-4 text-green-600 absolute opacity-0 icon-check transition-opacity duration-300" />
            </button>
          )}
        </div>

        <Info label="Phone" value={employee.phone} />
        <Info label="Hire Date" value={formatDisplayDate(employee.hire_date)} />

        <Info label="Birthday" value={formatDisplayDate(employee.dob)} />
        <Info
          label="Country"
          value={employee.organization_country_code || "—"}
        />
      </div>

      {/* Optional Meta */}
      <div className="pt-4 border-t text-xs text-gray-500">
        Last Updated:{" "}
        {employee.updated_at
          ? new Date(employee.updated_at).toLocaleDateString()
          : "—"}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <label className="block text-gray-500 text-xs">{label}</label>
      <p className="font-medium text-gray-800 mt-0.5 break-all">
        {value || "—"}
      </p>
    </div>
  );
}
