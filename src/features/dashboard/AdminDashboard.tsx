import React from "react";
import {
  Users,
  Car,
  CalendarDays,
  ClipboardList,
  Wrench,
  Package,
  FileText,
  ReceiptText,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Activity,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../features/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

/* -----------------------------------
   Types
----------------------------------- */

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  onClick?: () => void;
};

type ModuleCardProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  path?: string;
};

type ActivityItemProps = {
  title: string;
  description: string;
  icon: React.ElementType;
};

/* -----------------------------------
   KPI Card
----------------------------------- */

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
}: StatCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`group bg-white border border-slate-200 rounded-2xl shadow-sm
      p-5 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5
      transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 shrink-0">
        <Icon className="w-6 h-6" />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium">
          {title}
        </p>

        <p className="text-3xl font-bold text-slate-900 mt-1">
          {value}
        </p>

        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

/* -----------------------------------
   Module Card
----------------------------------- */

const ModuleCard = ({
  title,
  description,
  icon: Icon,
  path,
}: ModuleCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group w-full text-left bg-white border border-slate-200 rounded-2xl p-5
      shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5
      transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
          <Icon className="w-6 h-6" />
        </div>

        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2 leading-6">
        {description}
      </p>
    </button>
  );
};

/* -----------------------------------
   Activity Item
----------------------------------- */

const ActivityItem = ({
  title,
  description,
  icon: Icon,
}: ActivityItemProps) => {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-b-0">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>

      <div>
        <p className="font-semibold text-slate-800">
          {title}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
};

/* -----------------------------------
   Drively Admin Dashboard
----------------------------------- */

export default function HRDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const roleName =
    profile?.roles?.name ||
    "Administrator";

  const organizationName =
    profile?.organizations?.name ||
    "Drively Demo Org";

  /*
   * Placeholder KPI values.
   *
   * These will be replaced with API hooks as each
   * Drively module is implemented.
   */
  const dashboardStats = {
    appointmentsToday: 0,
    openJobCards: 0,
    vehiclesInWorkshop: 0,
    waitingForParts: 0,
    completedToday: 0,
    revenueToday: 0,
    lowStockItems: 0,
    techniciansAvailable: 0,
  };

  const modules: ModuleCardProps[] = [
    {
      title: "Customers",
      description:
        "Manage customer records, contact information, service history and outstanding balances.",
      icon: Users,
      path: "/customers",
    },
    {
      title: "Vehicles",
      description:
        "Manage vehicle registration, VIN, make, model, mileage, warranty and service history.",
      icon: Car,
      path: "/vehicles",
    },
    {
      title: "Appointments",
      description:
        "Schedule workshop visits, assign service advisors and convert appointments to job cards.",
      icon: CalendarDays,
      path: "/appointments",
    },
    {
      title: "Job Cards",
      description:
        "Manage the complete workshop workflow from vehicle reception through completion.",
      icon: ClipboardList,
      path: "/job-cards",
    },
    {
      title: "Inspections",
      description:
        "Capture vehicle condition, inspection findings and recommended repair work.",
      icon: CheckCircle2,
      path: "/inspections",
    },
    {
      title: "Operations",
      description:
        "Manage repair operations, work status, labor requirements and completion.",
      icon: Wrench,
      path: "/operations",
    },
    {
      title: "Technicians",
      description:
        "Manage technicians, assignments, labor rates, workload and productivity.",
      icon: UserCog,
      path: "/technicians",
    },
    {
      title: "Inventory",
      description:
        "Manage spare parts, available stock, reservations, issues, returns and stock levels.",
      icon: Package,
      path: "/inventory",
    },
    {
      title: "Quotations",
      description:
        "Prepare customer estimates containing labor, parts, taxes and discounts.",
      icon: FileText,
      path: "/quotations",
    },
    {
      title: "Invoices",
      description:
        "Generate final workshop invoices with separate labor and parts sections.",
      icon: ReceiptText,
      path: "/invoices",
    },
    {
      title: "Payments",
      description:
        "Record customer payments, partial payments and outstanding balances.",
      icon: CreditCard,
      path: "/payments",
    },
    {
      title: "Reports",
      description:
        "View workshop performance, revenue, inventory and technician productivity reports.",
      icon: BarChart3,
      path: "/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="px-4 sm:px-6 lg:px-10 xl:px-16 pt-10 space-y-10 max-w-[1800px] mx-auto">

        {/* -----------------------------------
            Welcome Header
        ----------------------------------- */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Drively Workshop ERP
                  </p>

                  <p className="text-sm text-slate-400">
                    {organizationName}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || "Administrator"}
              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">
                Manage your workshop operations from appointment booking
                through vehicle delivery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100">
                <ShieldCheck className="w-5 h-5 text-slate-600" />

                <div>
                  <p className="text-xs text-slate-500">
                    Current Role
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {roleName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>

            </div>
          </div>
        </div>

        {/* -----------------------------------
            Primary Workshop KPIs
        ----------------------------------- */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Workshop Overview
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Today's workshop activity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            <StatCard
              title="Appointments Today"
              value={dashboardStats.appointmentsToday}
              subtitle="Scheduled for today"
              icon={CalendarDays}
              onClick={() => navigate("/appointments")}
            />

            <StatCard
              title="Open Job Cards"
              value={dashboardStats.openJobCards}
              subtitle="Currently active"
              icon={ClipboardList}
              onClick={() => navigate("/job-cards")}
            />

            <StatCard
              title="Vehicles in Workshop"
              value={dashboardStats.vehiclesInWorkshop}
              subtitle="Currently checked in"
              icon={Car}
            />

            <StatCard
              title="Waiting for Parts"
              value={dashboardStats.waitingForParts}
              subtitle="Jobs requiring parts"
              icon={Clock3}
            />

            <StatCard
              title="Completed Today"
              value={dashboardStats.completedToday}
              subtitle="Jobs completed today"
              icon={CheckCircle2}
            />

            <StatCard
              title="Today's Revenue"
              value={`₹${dashboardStats.revenueToday.toLocaleString("en-IN")}`}
              subtitle="Invoices collected today"
              icon={ReceiptText}
            />

            <StatCard
              title="Low Stock Items"
              value={dashboardStats.lowStockItems}
              subtitle="Requires attention"
              icon={AlertTriangle}
              onClick={() => navigate("/inventory")}
            />

            <StatCard
              title="Available Technicians"
              value={dashboardStats.techniciansAvailable}
              subtitle="Available for assignment"
              icon={Wrench}
              onClick={() => navigate("/technicians")}
            />

          </div>
        </div>

        {/* -----------------------------------
            Quick Actions
        ----------------------------------- */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Frequently used workshop operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <button
              type="button"
              onClick={() => navigate("/appointments")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left
              hover:shadow-md hover:border-slate-300 transition"
            >
              <CalendarDays className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                New Appointment
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Schedule a workshop visit
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/job-cards")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left
              hover:shadow-md hover:border-slate-300 transition"
            >
              <ClipboardList className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                New Job Card
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Open a workshop job
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left
              hover:shadow-md hover:border-slate-300 transition"
            >
              <Users className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                Add Customer
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Create customer profile
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/vehicles")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left
              hover:shadow-md hover:border-slate-300 transition"
            >
              <Car className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                Add Vehicle
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Register a vehicle
              </p>
            </button>

          </div>
        </div>

        {/* -----------------------------------
            Workshop Status
        ----------------------------------- */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Workshop Status
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Live job card status will appear here
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/job-cards")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View Job Cards
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Awaiting Inspection
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  0
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Awaiting Approval
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  0
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Work in Progress
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  0
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Ready for Delivery
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  0
                </p>
              </div>

            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-14 px-6 text-center">

              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No active job cards
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Active workshop jobs will be displayed here.
              </p>

            </div>
          </div>

          {/* Alerts */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Alerts
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Items requiring attention
              </p>
            </div>

            <ActivityItem
              title="Low Stock"
              description="No low-stock alerts."
              icon={Package}
            />

            <ActivityItem
              title="Waiting for Parts"
              description="No jobs are waiting for parts."
              icon={Clock3}
            />

            <ActivityItem
              title="Pending Approvals"
              description="No quotations are awaiting approval."
              icon={FileText}
            />

            <ActivityItem
              title="Vehicle Delivery"
              description="No vehicles are currently awaiting delivery."
              icon={Car}
            />

          </div>

        </div>

        {/* -----------------------------------
            Admin Modules
        ----------------------------------- */}

        <div>

          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Administration
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Drively workshop management modules
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {modules.map((module) => (
              <ModuleCard
                key={module.title}
                {...module}
              />
            ))}
          </div>

        </div>

        {/* -----------------------------------
            System Administration
        ----------------------------------- */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              System Administration
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              User access and Drively configuration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <button
              type="button"
              onClick={() => navigate("/users")}
              className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200
              hover:bg-slate-50 hover:border-slate-300 transition text-left"
            >
              <Users className="w-7 h-7 text-slate-700" />

              <div>
                <p className="font-semibold text-slate-900">
                  Users
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Manage application users
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/roles")}
              className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200
              hover:bg-slate-50 hover:border-slate-300 transition text-left"
            >
              <ShieldCheck className="w-7 h-7 text-slate-700" />

              <div>
                <p className="font-semibold text-slate-900">
                  Roles & Permissions
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Configure user access
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200
              hover:bg-slate-50 hover:border-slate-300 transition text-left"
            >
              <Settings className="w-7 h-7 text-slate-700" />

              <div>
                <p className="font-semibold text-slate-900">
                  Settings
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Workshop configuration
                </p>
              </div>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}