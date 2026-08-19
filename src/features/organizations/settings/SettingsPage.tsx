import React from "react";
import { useAuth } from "../../../features/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronRight,
  Lock,
  Building2,
  Users,
  ShieldCheck,
  Wrench,
  Warehouse,
  Package,
  CreditCard,
  FileText,
  Bell,
  ClipboardList,
  UserCog,
  Tags,
} from "lucide-react";
import { useCan } from "../../../utils/permissions";

export default function SettingsPage() {
  const {
    organization_name,
    organization_country_code,
    profile,
  } = useAuth();

  const nav = useNavigate();
  const can = useCan();

  /* -------------------------------------------------------
     Logged-in Role Detection
  ------------------------------------------------------- */

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
      ? [profile.roles]
      : [];

  const loggedInSlugs = roles.map((r: any) => r.slug);

  const isLoggedInAdmin = loggedInSlugs.includes("admin");
  const isSuperAdmin = loggedInSlugs.includes("superadmin");

  const hasAdminAccess =
    isLoggedInAdmin || isSuperAdmin;

  /* -------------------------------------------------------
     MVP NOTE

     During initial Drively development Admin gets access
     to all configuration pages.

     Permission-level restrictions can be enforced later
     after the modules and permissions are finalized.
  ------------------------------------------------------- */

  const canViewOrg =
    hasAdminAccess || can("organization:view");

  if (!canViewOrg) {
    return (
      <p className="text-gray-500 text-sm">
        You don&apos;t have permission to view organization settings.
      </p>
    );
  }

  /* -------------------------------------------------------
     Setting Card
  ------------------------------------------------------- */

  const SettingCard = ({
    title,
    description,
    to,
    icon: Icon,
    viewPerm,
    updatePerm,
    adminOnly = false,
    comingSoon = false,
  }: {
    title: string;
    description: string;
    to: string;
    icon: any;
    viewPerm?: string;
    updatePerm?: string;
    adminOnly?: boolean;
    comingSoon?: boolean;
  }) => {
    /*
     * During MVP Admin has full access.
     * Other roles continue to respect permissions.
     */

    const permissionCanView = viewPerm
      ? can(viewPerm)
      : true;

    const permissionCanUpdate = updatePerm
      ? can(updatePerm)
      : permissionCanView;

    const canView = hasAdminAccess
      ? true
      : permissionCanView;

    const canUpdate = hasAdminAccess
      ? true
      : permissionCanUpdate;

    if (adminOnly && !hasAdminAccess) {
      return null;
    }

    if (!canView) {
      return null;
    }

    return (
      <div
        onClick={() => {
          if (comingSoon) return;
          nav(to);
        }}
        className={`border rounded-xl p-5 bg-white shadow-sm transition flex items-center justify-between gap-4 ${
          comingSoon
            ? "cursor-default opacity-70"
            : "cursor-pointer hover:shadow-md hover:border-indigo-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-800">
                {title}
              </h4>

              {!canUpdate && !comingSoon && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Lock size={12} />
                  View-only
                </span>
              )}

              {comingSoon && (
                <span className="text-[10px] uppercase tracking-wide font-semibold bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2 py-1">
                  Coming Soon
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          </div>
        </div>

        {!comingSoon && (
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </div>
    );
  };

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">

      {/* Header */}

      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
          <Settings className="w-6 h-6 text-indigo-600" />
          Organization Settings
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Configure your workshop, users, inventory, labor,
          billing and operational settings.
        </p>
      </div>

      {/* Organization */}

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">
              Current Organization
            </p>

            <p className="font-bold text-lg text-gray-900 mt-1">
              {organization_name || "Organization"}

              {organization_country_code
                ? ` (${organization_country_code})`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------
          General
      --------------------------------------------------- */}

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          General
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingCard
            title="Organization Preferences"
            description="Workshop name, address, timezone, currency, tax settings and general preferences."
            to="/settings/preferences"
            icon={Building2}
            viewPerm="organization:view"
            updatePerm="organization:update"
          />

          <SettingCard
            title="System Settings"
            description="Configure workshop-wide application and operational settings."
            to="/settings/system"
            icon={Settings}
            adminOnly
          />
        </div>
      </div>

      {/* ---------------------------------------------------
          Users & Security
      --------------------------------------------------- */}

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Users & Security
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingCard
            title="Users"
            description="Create and manage users who can access the workshop ERP."
            to="/users"
            icon={Users}
            viewPerm="users:view"
            updatePerm="users:update"
            adminOnly
          />

          <SettingCard
            title="Roles & Permissions"
            description="Manage Administrator, Workshop Manager, Service Advisor, Technician, Store Keeper and Cashier roles."
            to="/settings/roles"
            icon={ShieldCheck}
            viewPerm="roles:view"
            updatePerm="roles:update"
            adminOnly
          />

          <SettingCard
            title="Force Password Reset"
            description="Require a workshop user to reset their login password."
            to="/force-reset-password"
            icon={Lock}
            adminOnly
          />

          <SettingCard
            title="Audit Logs"
            description="Review important user and workshop transaction activity."
            to="/audit-logs"
            icon={ClipboardList}
            viewPerm="audits:view"
            adminOnly
          />
        </div>
      </div>

      {/* ---------------------------------------------------
          Workshop Configuration
      --------------------------------------------------- */}

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Workshop Configuration
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingCard
            title="Workshop Operations"
            description="Configure standard repair, maintenance and service operations."
            to="/settings/workshop-operations"
            icon={Wrench}
            viewPerm="workshop-operations:view"
            updatePerm="workshop-operations:update"
          />

          <SettingCard
            title="Labor Rates"
            description="Configure labor selling rates and internal workshop labor costs."
            to="/labor-rates"
            icon={UserCog}
            viewPerm="labor-rates:view"
            updatePerm="labor-rates:update"
          />

          <SettingCard
            title="Job Card Settings"
            description="Configure job card numbering, workflow and workshop defaults."
            to="/settings/job-cards"
            icon={FileText}
            viewPerm="job-cards:view"
            updatePerm="job-cards:update"
          />

          <SettingCard
            title="Inspection Settings"
            description="Configure vehicle inspection categories and checklist items."
            to="/settings/inspections"
            icon={ClipboardList}
            viewPerm="inspections:view"
            updatePerm="inspections:update"
          />
        </div>
      </div>

      {/* ---------------------------------------------------
          Inventory
      --------------------------------------------------- */}

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Inventory Configuration
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingCard
            title="Warehouses"
            description="Configure workshop spare-parts storage locations."
            to="/inventory/warehouses"
            icon={Warehouse}
            viewPerm="inventory:view"
            updatePerm="inventory:update"
          />

          <SettingCard
            title="Parts & Inventory Settings"
            description="Configure stock defaults, minimum stock thresholds and inventory behaviour."
            to="/settings/inventory"
            icon={Package}
            viewPerm="inventory:view"
            updatePerm="inventory:update"
          />

          <SettingCard
            title="Part Categories"
            description="Configure categories used to organize workshop spare parts."
            to="/settings/part-categories"
            icon={Tags}
            viewPerm="inventory:view"
            updatePerm="inventory:update"
          />

          <SettingCard
            title="Low Stock Notifications"
            description="Configure minimum-stock alerts and notification preferences."
            to="/settings/low-stock"
            icon={Bell}
            viewPerm="inventory:view"
            updatePerm="inventory:update"
          />
        </div>
      </div>

      {/* ---------------------------------------------------
          Billing
      --------------------------------------------------- */}

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Billing Configuration
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingCard
            title="Tax Settings"
            description="Configure applicable taxes for labor and spare parts."
            to="/settings/taxes"
            icon={FileText}
            viewPerm="billing:view"
            updatePerm="billing:update"
          />

          <SettingCard
            title="Payment Settings"
            description="Configure supported payment methods and payment policies."
            to="/settings/payments"
            icon={CreditCard}
            viewPerm="billing:view"
            updatePerm="billing:update"
          />

          <SettingCard
            title="Invoice Settings"
            description="Configure invoice numbering, workshop invoice defaults and print settings."
            to="/settings/invoices"
            icon={FileText}
            viewPerm="billing:view"
            updatePerm="billing:update"
          />
        </div>
      </div>

      {/* ---------------------------------------------------
          Future
      --------------------------------------------------- */}

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Future Modules
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingCard
            title="Purchase Management"
            description="Supplier management, purchase orders and automatic purchase recommendations."
            to="#"
            icon={Package}
            comingSoon
          />

          <SettingCard
            title="Manufacturing / BOM"
            description="Assembly, manufacturing and bill-of-material configuration."
            to="#"
            icon={Wrench}
            comingSoon
          />
        </div>
      </div>
    </div>
  );
}