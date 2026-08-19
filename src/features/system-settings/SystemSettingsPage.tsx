import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Clock,
  Database,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { useAuth } from "../../features/auth/AuthProvider";
import { getPlanFeatures } from "../../features/plans/planFeatures";

export default function SystemSettingsPage() {
  const navigate = useNavigate();

  const { profile } = useAuth();

  const { organization_plan } = useAuth();

const {
  hasBackupManagement,
  hasSystemMaintenance,
  hasJobScheduler,
} = getPlanFeatures(organization_plan);

  // 🔒 Role-based guard
  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];

  const slugs = roles.map((r) => r?.slug);

  const isAdmin = slugs.includes("admin");

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />

        <h2 className="text-xl font-semibold text-gray-800">
          Restricted Access
        </h2>

        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view this page.
          Only system administrators can access
          System Settings.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

const tiles = [
  {
    title: "Jobs",
    description: "Manage background system jobs and schedules.",
    icon: Clock,
    route: "/settings/system/jobs",
    enabled: hasJobScheduler,
    badge: "Enterprise",
  },
  {
    title: "Database Backup",
    description: "Configure automatic backup and restore policies.",
    icon: Database,
    route: "/system/settings/backups",
    enabled: hasBackupManagement,
    badge: "Enterprise",
  },
  {
    title: "System Maintenance",
    description: "Enable maintenance mode and control platform downtime access.",
    icon: Wrench,
    route: "/system-maintenance",
    enabled: hasSystemMaintenance,
    badge: "Enterprise",
  },
  {
    title: "Email Templates",
    description: "Install and manage organization email templates",
    icon: Wrench,
    route: "/settings/system/email-templates",
    enabled: true,
  },
  {
    title: "System Job Templates",
    description: "Install and synchronize default job schedules.",
    icon: Clock,
    route: "/settings/system/job-templates",
    enabled: true,
  },
];

  if (!isAdmin) return null;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600" />
        System Settings
      </h2>

      {/* Tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

{tiles.map(
  ({
    title,
    description,
    icon: Icon,
    route,
    enabled,
    badge,
  }) => {
    const isEnabled = enabled ?? true;

    return (
      <div
        key={title}
        onClick={() => {
          if (isEnabled) {
            navigate(route);
          }
        }}
        className={`border p-4 rounded-lg shadow-sm transition flex gap-3 ${
          isEnabled
            ? "cursor-pointer hover:shadow-md bg-white"
            : "cursor-not-allowed bg-gray-50 opacity-60"
        }`}
      >
        <div
          className={`p-3 rounded-lg ${
            isEnabled
              ? "bg-blue-50 text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            {title}
          </h3>

          <p className="text-sm text-gray-500">
            {description}
          </p>

          {!isEnabled && badge && (
            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              {badge}
            </span>
          )}
        </div>
      </div>
    );
  }
)}

      </div>
    </div>
  );
}