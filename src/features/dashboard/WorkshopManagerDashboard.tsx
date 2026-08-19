// WorkshopManagerDashboard.tsx

import React from "react";
import {
  Car,
  CalendarDays,
  ClipboardList,
  Wrench,
  Package,
  FileText,
  ReceiptText,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Activity,
  UserCog,
  ShieldCheck,
  ArrowRight,
  Gauge,
} from "lucide-react";

import { useAuth } from "../../features/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  onClick?: () => void;
};

type StatusCardProps = {
  title: string;
  value: number;
  icon: React.ElementType;
  onClick?: () => void;
};

type ActivityItemProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
};

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

const StatusCard = ({
  title,
  value,
  icon: Icon,
  onClick,
}: StatusCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-slate-50 border border-slate-100 p-5
      hover:bg-white hover:border-slate-300 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300" />
      </div>

      <p className="text-sm text-slate-500 mt-4">
        {title}
      </p>

      <p className="text-3xl font-bold text-slate-900 mt-1">
        {value}
      </p>
    </button>
  );
};

const ActivityItem = ({
  title,
  description,
  icon: Icon,
  onClick,
}: ActivityItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-4 py-4 border-b border-slate-100
      last:border-b-0 text-left ${
        onClick ? "hover:bg-slate-50" : ""
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800">
          {title}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>
      </div>
    </button>
  );
};

export default function WorkshopManagerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const organizationName =
    profile?.organizations?.name ||
    "Drively Demo Org";

  const roleName =
    profile?.roles?.name ||
    "Workshop Manager";

  /*
   * Placeholder values.
   * Replace with dashboard API hooks later.
   */
  const dashboardStats = {
    appointmentsToday: 0,
    vehiclesInWorkshop: 0,
    openJobCards: 0,
    techniciansAvailable: 0,

    awaitingInspection: 0,
    awaitingApproval: 0,
    waitingForParts: 0,
    workInProgress: 0,
    qualityCheckPending: 0,
    readyForDelivery: 0,
    completedToday: 0,

    delayedJobs: 0,
    lowStockItems: 0,
    pendingQuotations: 0,

    revenueToday: 0,

    totalTechnicians: 0,
    busyTechnicians: 0,
    availableTechnicians: 0,
  };

  const technicianUtilization =
    dashboardStats.totalTechnicians > 0
      ? Math.round(
          (dashboardStats.busyTechnicians /
            dashboardStats.totalTechnicians) *
            100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="px-4 sm:px-6 lg:px-10 xl:px-16 pt-10 space-y-10 max-w-[1800px] mx-auto">

        {/* Header */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Gauge className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Workshop Operations
                  </p>

                  <p className="text-sm text-slate-400">
                    {organizationName}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || "Workshop Manager"}
              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">
                Monitor workshop activity, technician workload,
                job progress and operational exceptions.
              </p>
            </div>

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
          </div>
        </div>

        {/* Primary KPIs */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Today's Workshop
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current operational overview
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Appointments Today"
              value={dashboardStats.appointmentsToday}
              subtitle="Scheduled workshop visits"
              icon={CalendarDays}
              onClick={() => navigate("/appointments")}
            />

            <StatCard
              title="Vehicles in Workshop"
              value={dashboardStats.vehiclesInWorkshop}
              subtitle="Currently checked in"
              icon={Car}
              onClick={() => navigate("/job-cards")}
            />

            <StatCard
              title="Open Job Cards"
              value={dashboardStats.openJobCards}
              subtitle="Active workshop jobs"
              icon={ClipboardList}
              onClick={() => navigate("/job-cards")}
            />

            <StatCard
              title="Available Technicians"
              value={dashboardStats.techniciansAvailable}
              subtitle="Ready for assignment"
              icon={UserCog}
              onClick={() => navigate("/technicians")}
            />
          </div>
        </div>

        {/* Workflow Status */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Workshop Status
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Job cards grouped by current workflow stage
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/job-cards")}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              View All Job Cards
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <StatusCard
              title="Awaiting Inspection"
              value={dashboardStats.awaitingInspection}
              icon={ClipboardList}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Awaiting Approval"
              value={dashboardStats.awaitingApproval}
              icon={FileText}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Waiting for Parts"
              value={dashboardStats.waitingForParts}
              icon={Package}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Work in Progress"
              value={dashboardStats.workInProgress}
              icon={Wrench}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Quality Check"
              value={dashboardStats.qualityCheckPending}
              icon={ShieldCheck}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Ready for Delivery"
              value={dashboardStats.readyForDelivery}
              icon={Car}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Completed Today"
              value={dashboardStats.completedToday}
              icon={CheckCircle2}
              onClick={() => navigate("/job-cards")}
            />
          </div>
        </div>

        {/* Operations + Alerts */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Live Workshop */}

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Live Workshop
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Active vehicle and job card activity
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/job-cards")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Open Job Board
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No active workshop jobs
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Active job cards will appear here with vehicle,
                technician and operation status.
              </p>
            </div>
          </div>

          {/* Alerts */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Attention Required
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Operational exceptions
              </p>
            </div>

            <ActivityItem
              title="Delayed Jobs"
              description={`${dashboardStats.delayedJobs} jobs currently delayed.`}
              icon={AlertTriangle}
              onClick={() => navigate("/job-cards")}
            />

            <ActivityItem
              title="Waiting for Parts"
              description={`${dashboardStats.waitingForParts} jobs waiting for parts.`}
              icon={Clock3}
              onClick={() => navigate("/job-cards")}
            />

            <ActivityItem
              title="Low Stock"
              description={`${dashboardStats.lowStockItems} inventory items below minimum level.`}
              icon={Package}
              onClick={() => navigate("/inventory")}
            />

            <ActivityItem
              title="Pending Quotations"
              description={`${dashboardStats.pendingQuotations} quotations awaiting action.`}
              icon={FileText}
              onClick={() => navigate("/quotations")}
            />
          </div>
        </div>

        {/* Technician Workload */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Technician Workload
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Current technician availability and utilization
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/technicians")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View Technicians
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Total Technicians
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {dashboardStats.totalTechnicians}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Currently Busy
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {dashboardStats.busyTechnicians}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-500">
                  Available
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {dashboardStats.availableTechnicians}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600">
                  Technician Utilization
                </p>

                <p className="text-sm font-bold text-slate-800">
                  {technicianUtilization}%
                </p>
              </div>

              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-500"
                  style={{
                    width: `${technicianUtilization}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Revenue */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <ReceiptText className="w-6 h-6 text-slate-700" />
            </div>

            <p className="text-sm text-slate-500 mt-6">
              Today's Revenue
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              ₹
              {dashboardStats.revenueToday.toLocaleString(
                "en-IN",
              )}
            </p>

            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="mt-6 w-full px-5 py-3 rounded-xl bg-slate-900 text-white
              font-semibold hover:bg-slate-800 transition"
            >
              View Invoices
            </button>
          </div>
        </div>

        {/* Quick Actions */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Common workshop management activities
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => navigate("/job-cards")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition"
            >
              <ClipboardList className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                Job Cards
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Review workshop jobs
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/technicians")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition"
            >
              <UserCog className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                Assign Technician
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Manage technician workload
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition"
            >
              <Package className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                Inventory
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Review parts availability
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition"
            >
              <ReceiptText className="w-7 h-7 text-slate-700" />

              <p className="font-bold text-slate-900 mt-4">
                Workshop Reports
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Review operational performance
              </p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}