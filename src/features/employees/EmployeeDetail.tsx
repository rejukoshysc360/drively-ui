import { useParams, Link, NavLink, Outlet } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useEmployee } from "./hooks";
import { useCan } from "../../utils/permissions";
import { useAuth } from "../auth/AuthProvider";
import { useState } from "react";
import EmployeePersonalTab from "./personal/EmployeePersonalTab";
import EmployeeGeneralTab from "./tabs/EmployeeGeneralTab";
import EmployeeViewOnlyCompensationTab from "./tabs/EmployeeViewOnlyCompensationTab";

export default function EmployeeDetail() {
  const params = useParams<{ employeeId: string }>();
  const can = useCan();
  const { profile } = useAuth();

  // 🧭 Determine which employee record is being viewed
  const employeeId = params.employeeId || profile?.id || "";
  const [activeTab, setActiveTab] = useState("general");

  // 🧠 Get role slug
  const userRoleSlug = profile?.roles?.slug || "";
  const isEmployee = userRoleSlug === "emp";

  const isManager = userRoleSlug === "manager";


  // 🧠 Detect if logged-in employee is viewing their own record
  const isOwnRecord = profile?.id?.toString() === employeeId?.toString();

  const isSelfView = (isEmployee || isManager) && isOwnRecord;

  // 🛡️ Permissions
  const canView = can("employees:view");
  const canUpdate = can("employees:update");

  // ✅ SECURE PERMISSION GUARD
  if (isSelfView) {
    // Employee self-view mode — only allow if viewing their own record
    if (!isOwnRecord) {
      return (
        <div className="p-8 text-center text-red-600">
          You can only view your own record.
        </div>
      );
    }
  } else if (!canView) {
    // HR without "employees:view" permission
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700">
          You do not have permission to view employee details.
        </h2>
      </div>
    );
  }

  const one = useEmployee(employeeId);

  if (one.isLoading) return <div className="p-4">Loading…</div>;

  // 🧩 Handle 403 Forbidden differently
  const status = (one.error as any)?.response?.status;
  if (status === 403 && !isSelfView) {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to view this employee.
      </div>
    );
  }

  // 🧩 Handle missing or broken data
  if (one.isError || !one.data) {
    return (
      <div className="p-8 text-center text-red-600">
        Employee not found.
      </div>
    );
  }

  const e = one.data;

  // 🗂️ Tabs differ based on view mode
  const tabs = isSelfView
    ? [
        { to: "general", label: "General Info" },
        { to: "personal", label: "Personal Info" },
        { to: "compensation", label: "Compensation Info" },
      ]
    : [
        { to: "general", label: "General Info" },
        { to: "personal", label: "Personal Info" },
        { to: "employment", label: "Employment Info" },
        { to: "compensation", label: "Compensation Info" },
        { to: "onboarding-documents", label: "Onboarding Documents" },
        { to: "documents", label: "Compliance Documents" },
        { to: "short-term", label: "Short Term Assignment" },
      ];

  const roleColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
  ];

  const roleColor =
    e.role_name && roleColors[e.role_name.charCodeAt(0) % roleColors.length];

  return (
    <div className="pt-1 md:pt-1 md:px-6 pb-6 space-y-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
      {/* Header — hide for self-view (employees) */}
      {!isSelfView && (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Employee Details</h1>
          {canUpdate && (
            <Link
              to={`/employees/${e.id}/edit`}
              className="btn inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          )}
        </div>
      )}

      {/* Info Card — hide for self-view (employees) */}
      {!isSelfView && (
        <div className="card p-4 bg-white shadow rounded">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Full Name</dt>
              <dd className="font-medium">{e.full_name || "-"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{e.email || "-"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Designation</dt>
              <dd className="font-medium">{e.designation?.title || "-"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Hire Date</dt>
              <dd className="font-medium">{e.hire_date || "-"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Role</dt>
              <dd className="flex items-center gap-2 font-medium">
                {e.role_name ? (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}
                  >
                    {e.role_name}
                  </span>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {tabs.map((t) => {
            if (isSelfView) {
              // Local tabs for employee self-view
              return (
                <button
                  key={t.to}
                  onClick={() => setActiveTab(t.to)}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === t.to
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:text-blue-600 hover:bg-white"
                  }`}
                >
                  {t.label}
                </button>
              );
            }

            // HR view: keep normal route-based navigation
            return (
              <NavLink
                key={t.to}
                to={`/employees/${employeeId}/${t.to}`}
                className={({ isActive }) =>
                  `whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:text-blue-600 hover:bg-white"
                  }`
                }
                end
              >
                {t.label}
              </NavLink>
            );
          })}
        </div>

        <div className="bg-white rounded-md shadow p-4 mt-4">
          {isSelfView ? (
            activeTab === "personal" ? (
              <EmployeePersonalTab />
            ) : activeTab === "compensation" ? (
              <EmployeeViewOnlyCompensationTab />
            ) : (
              <EmployeeGeneralTab />
            )
          ) : (
            <Outlet context={{ selfView: isSelfView }} />
          )}
        </div>
      </div>
    </div>
  );
}
