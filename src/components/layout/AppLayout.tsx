// AppLayout.tsx

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { useRoles } from "../../utils/useRoles";

import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  History,
  Key,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  UserCog,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

/* ─────────────────────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────────────────────── */

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isSuperAdmin, isAdmin } = useRoles();

  const {
    has_multiple_organizations,
  } = useAuth();

  const Item = ({
    to,
    label,
    icon: Icon,
    badge,
    disabled = false,
  }: {
    to: string;
    label: string;
    icon: any;
    badge?: string;
    disabled?: boolean;
  }) => {
    return (
      <Link
        to={disabled ? "#" : to}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }

          onNavigate?.();
        }}
        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          disabled
            ? "cursor-not-allowed text-gray-400"
            : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 shrink-0" />

          <span>{label}</span>
        </div>

        {badge && (
          <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => {
    return (
      <div className="space-y-1">
        <div className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>

        {children}

        <div className="border-t border-gray-200 mt-3 mx-3" />
      </div>
    );
  };

  return (
    <nav className="p-3 space-y-2 overflow-y-auto h-full">

      {/* Dashboard */}

      <Item
        to="/"
        label="Dashboard"
        icon={Gauge}
      />

      {/* Super Admin */}

      {isSuperAdmin && (
        <Section title="Platform Administration">
          <Item
            to="/mcp"
            label="Maintenance Control"
            icon={Wrench}
          />

          <Item
            to="/plan/organizations"
            label="Organizations & Plans"
            icon={Building2}
          />
        </Section>
      )}

      {/* Workshop Administration */}

      {isAdmin && !isSuperAdmin && (
        <>
          <Section title="Workshop">
            <Item
              to="/appointments"
              label="Appointments"
              icon={CalendarDays}
            />

            <Item
              to="/job-cards"
              label="Job Cards"
              icon={ClipboardList}
            />

            <Item
              to="/inspections"
              label="Vehicle Inspections"
              icon={ClipboardCheck}
            />

            <Item
              to="/workshop/operations"
              label="Workshop Operations"
              icon={Wrench}
            />
          </Section>

          <Section title="Customers & Vehicles">
            <Item
              to="/customers"
              label="Customers"
              icon={Users}
            />

            <Item
              to="/vehicles"
              label="Vehicles"
              icon={Car}
            />

            <Item
              to="/service-history"
              label="Service History"
              icon={History}
            />
          </Section>

          <Section title="Workshop Resources">
            <Item
              to="/technicians"
              label="Technicians"
              icon={UserCog}
            />

            <Item
              to="/labor-rates"
              label="Labor Rates"
              icon={Wrench}
            />
          </Section>

          <Section title="Inventory">
            <Item
              to="/inventory"
              label="Parts Inventory"
              icon={Package}
            />

            <Item
              to="/inventory/warehouses"
              label="Warehouses"
              icon={Warehouse}
            />

            <Item
              to="/inventory/stock-movements"
              label="Stock Movements"
              icon={Boxes}
            />

            <Item
              to="/inventory/low-stock"
              label="Low Stock Alerts"
              icon={AlertTriangle}
            />

            <Item
              to="/inventory/purchase-recommendations"
              label="Purchase Recommendations"
              icon={ShoppingCart}
              badge="Later"
              disabled
            />
          </Section>

          <Section title="Sales & Billing">
            <Item
              to="/quotations"
              label="Quotations"
              icon={FileText}
            />

            <Item
              to="/invoices"
              label="Invoices"
              icon={ReceiptText}
            />

            <Item
              to="/payments"
              label="Payments"
              icon={CreditCard}
            />
          </Section>

          <Section title="Reports">
            <Item
              to="/reports/workshop"
              label="Workshop Reports"
              icon={BarChart3}
            />

            <Item
              to="/reports/technician-productivity"
              label="Technician Productivity"
              icon={BarChart3}
            />

            <Item
              to="/reports/inventory"
              label="Inventory Reports"
              icon={BarChart3}
            />

            <Item
              to="/reports/revenue"
              label="Revenue Reports"
              icon={BarChart3}
            />
          </Section>

          <Section title="Administration">
            <Item
              to="/users"
              label="Users"
              icon={Users}
            />

            <Item
              to="/roles"
              label="Roles & Permissions"
              icon={ShieldCheck}
            />

            <Item
              to="/settings"
              label="Organization Settings"
              icon={Building2}
            />

            <Item
              to="/settings/system"
              label="System Settings"
              icon={Settings}
            />

            <Item
              to="/audit-logs"
              label="Audit Logs"
              icon={ClipboardList}
            />

            <Item
              to="/force-reset-password"
              label="Force Password Reset"
              icon={Key}
            />
          </Section>

          {has_multiple_organizations && (
            <Section title="Organization">
              <Item
                to="/select-organization"
                label="Change Organization"
                icon={Building2}
              />
            </Section>
          )}
        </>
      )}

      {/* Temporary fallback for non-admin roles */}

      {!isAdmin && !isSuperAdmin && (
        <Section title="Workshop">
          <Item
            to="/appointments"
            label="Appointments"
            icon={CalendarDays}
          />

          <Item
            to="/job-cards"
            label="Job Cards"
            icon={ClipboardList}
          />

          <Item
            to="/customers"
            label="Customers"
            icon={Users}
          />

          <Item
            to="/vehicles"
            label="Vehicles"
            icon={Car}
          />
        </Section>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   Header
───────────────────────────────────────────────────────────── */

function HeaderBar({ onMenu }: { onMenu: () => void }) {
  const {
    organization_name,
    organization_id,
    organization_country_code,
    organization_logo_url,
    has_multiple_organizations,
    profile,
    user,
    logout,
  } = useAuth();

  const { isAdmin } = useRoles();

  const nav = useNavigate();
  const location = useLocation();

  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const orgMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const hideOrgControls = [
    "/select-organization",
    "/reset-password",
  ].includes(location.pathname);

  const orgLabel =
    organization_name ||
    organization_id ||
    "Organization";

  const roleLabel =
    profile?.roles?.name ||
    profile?.role ||
    "User";

  const doLogout = () => {
    logout();
    nav("/login", {
      replace: true,
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        orgMenuRef.current &&
        !orgMenuRef.current.contains(e.target as Node)
      ) {
        setShowOrgMenu(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handler,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handler,
      );
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="h-14 flex items-center justify-between px-4">

        {/* Mobile Menu */}

        <button
          type="button"
          onClick={onMenu}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Organization Logo */}

        <div className="flex items-center h-full max-w-[180px] overflow-hidden">
          {organization_logo_url ? (
            <img
              src={organization_logo_url}
              alt={organization_name || "Organization"}
              className="h-full max-h-[48px] w-auto object-contain"
            />
          ) : (
            <button
              type="button"
              title="Organization Settings"
              onClick={() => nav("/settings")}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Store className="h-5 w-5 text-indigo-600" />
              </div>

              <span className="hidden sm:block text-sm font-semibold text-gray-700 truncate">
                {organization_name || "Drively"}
              </span>
            </button>
          )}
        </div>

        {/* Header Actions */}

        <div className="flex items-center gap-5">

          {/* System Settings */}

          {!hideOrgControls && isAdmin && (
            <button
              type="button"
              onClick={() =>
                nav("/settings/system")
              }
              className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
            >
              <Settings className="w-4 h-4" />

              System Settings
            </button>
          )}

          {/* Organization Menu */}

          {!hideOrgControls && (
            <div
              ref={orgMenuRef}
              className="relative hidden sm:flex items-center gap-1 text-sm"
            >
              {organization_country_code && (
                <span className="font-medium text-gray-500">
                  {organization_country_code}
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  setShowOrgMenu((value) => !value)
                }
                className="flex items-center gap-1.5 max-w-[220px] font-medium text-gray-800 hover:text-indigo-600"
              >
                <span className="truncate block">
                  {orgLabel}
                </span>

                {(isAdmin ||
                  has_multiple_organizations) && (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>

              {(isAdmin ||
                has_multiple_organizations) &&
                showOrgMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl text-sm z-50 overflow-hidden">

                    <div className="px-4 py-3 border-b bg-gray-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">
                        Current Workshop
                      </div>

                      <div className="font-semibold text-gray-800 mt-1 truncate">
                        {orgLabel}
                      </div>
                    </div>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowOrgMenu(false);
                            nav("/settings");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Building2 className="w-4 h-4" />

                          Organization Settings
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowOrgMenu(false);
                            nav("/settings/system");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Settings className="w-4 h-4" />

                          System Settings
                        </button>
                      </>
                    )}

                    {has_multiple_organizations && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOrgMenu(false);

                          nav(
                            "/select-organization",
                            {
                              state: {
                                from: location.pathname,
                              },
                            },
                          );
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-t"
                      >
                        <Building2 className="w-4 h-4" />

                        Change Organization
                      </button>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* User Menu */}

          {user?.email && (
            <div
              ref={userMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setShowUserMenu(
                    (value) => !value,
                  )
                }
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="hidden sm:block text-left max-w-[220px]">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {profile?.full_name ||
                      user.email}
                  </p>

                  <p className="text-xs text-gray-500">
                    {roleLabel}
                  </p>
                </div>

                <ChevronDown className="hidden sm:block w-4 h-4" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">

                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.email}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {roleLabel}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      nav("/change-password");
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                  >
                    <Key className="w-4 h-4" />

                    Change Password
                  </button>

                  <button
                    type="button"
                    onClick={doLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 text-left border-t"
                  >
                    <LogOut className="w-4 h-4" />

                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
   Layout
───────────────────────────────────────────────────────────── */

export default function AppLayout({
  children,
}: Props) {
  const {
    profile,
    organization_name,
  } = useAuth();

  const location = useLocation();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const mustReset =
    profile?.must_change_password === true;

  const hideSidebar = [
    "/select-organization",
    "/reset-password",
  ].includes(location.pathname);

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">

      <HeaderBar
        onMenu={() => setMobileOpen(true)}
      />

      <div className="flex-1 relative">

        {/* Desktop Sidebar */}

        {!hideSidebar && (
          <aside
            className={`hidden lg:block fixed top-14 left-0 bottom-0 w-64 border-r border-gray-200 bg-white ${
              mustReset
                ? "opacity-40 pointer-events-none blur-sm"
                : ""
            }`}
          >
            <Sidebar />
          </aside>
        )}

        {/* Mobile Sidebar */}

        {!hideSidebar && (
          <div
            className={`lg:hidden fixed inset-0 z-50 ${
              mobileOpen
                ? ""
                : "pointer-events-none"
            }`}
          >
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity ${
                mobileOpen
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              onClick={() =>
                setMobileOpen(false)
              }
            />

            <div
              className={`absolute left-0 top-0 h-full w-72 bg-white shadow-xl transition-transform ${
                mobileOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
              }`}
            >
              <div className="h-14 border-b flex items-center px-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Store className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="ml-3 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {organization_name ||
                      "Drively"}
                  </p>

                  <p className="text-xs text-gray-500">
                    Workshop ERP
                  </p>
                </div>
              </div>

              <div className="h-[calc(100%-3.5rem)]">
                <Sidebar
                  onNavigate={() =>
                    setMobileOpen(false)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}

        <main
          className={`${
            hideSidebar ? "" : "lg:pl-64"
          } pt-1 pb-4 px-4 bg-gradient-to-br from-slate-50 to-gray-100 min-h-[calc(100vh-3.5rem)]`}
        >
          <div className="px-1 sm:px-4 pt-1 pb-1 w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}

      <footer
        className={`py-4 text-center text-[11px] sm:text-xs text-gray-500 border-t bg-white leading-relaxed px-3 ${
          hideSidebar ? "" : "lg:pl-64"
        }`}
      >
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-gray-700">
            {organization_name ||
              "Your Organization"}
          </span>
        </p>

        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-gray-500">
            Powered by
          </span>

          <span className="font-semibold text-gray-700">
            Drively
          </span>

          <span className="text-gray-400">
            |
          </span>

          <span className="font-medium text-gray-700">
            Snippet Commerce 360 Cloud Platform
          </span>
        </div>
      </footer>
    </div>
  );
}