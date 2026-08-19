import { useState } from "react";
import {
  Building2,
  Clock,
  Mail,
  Settings,
} from "lucide-react";

import OrganizationInfoSection from "./OrganizationInfoSection";
import WorkingTimeSection from "./WorkingTimeSection";
import EmailSettingsSection from "./EmailSettingsSection";
import EmailNotificationSection from "./EmailNotificationSection";

import { useAuth } from "../../../../features/auth/AuthProvider";
import { useCan } from "../../../../utils/permissions";

/*
 * Drively Workshop ERP
 *
 * Organization Preferences should contain only organization-level
 * configuration required by the workshop application.
 *
 * HR-specific settings such as:
 * - Leave
 * - Compensation
 * - Employee compliance
 *
 * have been removed.
 */

const TABS = [
  {
    key: "org",
    label: "Organization",
    icon: Building2,
  },
  {
    key: "working",
    label: "Workshop Hours",
    icon: Clock,
  },
  {
    key: "email",
    label: "Email Settings",
    icon: Mail,
  },
];

export default function PreferencesPage() {
  const [activeTab, setActiveTab] = useState("org");

  const { profile } = useAuth();
  const can = useCan();

  /*
   * -------------------------------------------------------
   * Role Detection
   * -------------------------------------------------------
   */

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
      ? [profile.roles]
      : [];

  const roleSlugs = roles
    .map((role: any) => role?.slug)
    .filter(Boolean);

  const isAdmin = roleSlugs.includes("admin");
  const isSuperAdmin = roleSlugs.includes("superadmin");

  /*
   * During MVP development Admin has full access.
   * Permission restrictions can be tightened later.
   */

  const canViewOrganization =
    isAdmin ||
    isSuperAdmin ||
    can("organization:view");

  /*
   * -------------------------------------------------------
   * Access Restriction
   * -------------------------------------------------------
   */

  if (!canViewOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-.01-10a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>

          <p className="text-sm text-gray-500">
            You do not have permission to view organization preferences.
            Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * Render
   * -------------------------------------------------------
   */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-600" />
          Organization Preferences
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Configure your workshop information, operating hours and
          communication settings.
        </p>
      </div>

      {/* Tabs */}

      <div className="overflow-x-auto pb-2 -mb-2">
        <div className="flex gap-3 min-w-max">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-2.5
                px-5 py-3
                rounded-xl
                text-sm font-medium
                whitespace-nowrap
                transition-all
                shadow-sm
                min-w-[160px]
                ${
                  activeTab === key
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Tab Content */}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {activeTab === "org" && (
          <OrganizationInfoSection />
        )}

        {activeTab === "working" && (
          <WorkingTimeSection />
        )}

        {activeTab === "email" && (
          <EmailSettingsSection />
        )}
      </div>
    </div>
  );
}