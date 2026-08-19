import { useAuth } from "./features/auth/AuthProvider";

import AdminDashboard from "./features/dashboard/AdminDashboard";
import WorkshopManagerDashboard from "./features/dashboard/WorkshopManagerDashboard";
import ServiceAdvisorDashboard from "./features/dashboard/ServiceAdvisorDashboard";
import TechnicianDashboard from "./features/dashboard/TechnicianDashboard";
import StoreKeeperDashboard from "./features/dashboard/StoreKeeperDashboard";
import CashierDashboard from "./features/dashboard/CashierDashboard";

export default function DashboardRouter() {
  const { profile } = useAuth();

  // Normalize roles to array
  const rolesArray = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
      ? [profile.roles]
      : [];

  const roleSlugs = rolesArray
    .map((role: any) => role?.slug)
    .filter(Boolean);

  // -----------------------------------------------------------
  // ROLE CHECKS
  // -----------------------------------------------------------

  const isSuperAdmin = roleSlugs.includes("superadmin");

  const isAdmin = roleSlugs.includes("admin");

  const isWorkshopManager =
    roleSlugs.includes("workshop-manager") ||
    roleSlugs.includes("workshop_manager");

  const isServiceAdvisor =
    roleSlugs.includes("service-advisor") ||
    roleSlugs.includes("service_advisor");

  const isTechnician = roleSlugs.includes("technician");

  const isStoreKeeper =
    roleSlugs.includes("store-keeper") ||
    roleSlugs.includes("store_keeper");

  const isCashier = roleSlugs.includes("cashier");

  // -----------------------------------------------------------
  // SUPER ADMIN
  // -----------------------------------------------------------

  if (isSuperAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Super Admin Control Panel
        </h1>

        <p className="text-slate-500 mt-2">
          Platform administration and organization management.
        </p>
      </div>
    );
  }

  // -----------------------------------------------------------
  // ADMIN
  // -----------------------------------------------------------

  if (isAdmin) {
    return <AdminDashboard />;
  }

  // -----------------------------------------------------------
  // WORKSHOP MANAGER
  // -----------------------------------------------------------

  if (isWorkshopManager) {
    return <WorkshopManagerDashboard />;
  }

  // -----------------------------------------------------------
  // SERVICE ADVISOR
  // -----------------------------------------------------------

  if (isServiceAdvisor) {
    return <ServiceAdvisorDashboard />;
  }

  // -----------------------------------------------------------
  // TECHNICIAN
  // -----------------------------------------------------------

  if (isTechnician) {
    return <TechnicianDashboard />;
  }

  // -----------------------------------------------------------
  // STORE KEEPER
  // -----------------------------------------------------------

  if (isStoreKeeper) {
    return <StoreKeeperDashboard />;
  }

  // -----------------------------------------------------------
  // CASHIER
  // -----------------------------------------------------------

  if (isCashier) {
    return <CashierDashboard />;
  }

  // -----------------------------------------------------------
  // UNKNOWN / UNASSIGNED ROLE
  // -----------------------------------------------------------

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">
          Dashboard Not Available
        </h2>

        <p className="text-slate-500 mt-2">
          Your account does not have a recognized workshop role assigned.
        </p>
      </div>
    </div>
  );
}