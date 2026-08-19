// ServiceAdvisorDashboard.tsx

import React from "react";
import {
  Users,
  Car,
  CalendarDays,
  ClipboardList,
  FileText,
  CheckCircle2,
  Clock3,
  UserCheck,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
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

type QuickActionProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
};

type StatusCardProps = {
  title: string;
  value: number;
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

const QuickAction = ({
  title,
  description,
  icon: Icon,
  onClick,
}: QuickActionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-2xl p-5 text-left
      hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-700" />
        </div>

        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
      </div>

      <p className="font-bold text-slate-900 mt-4">
        {title}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        {description}
      </p>
    </button>
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
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-600" />
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

export default function ServiceAdvisorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const organizationName =
    profile?.organizations?.name ||
    "Drively Demo Org";

  const roleName =
    profile?.roles?.name ||
    "Service Advisor";

  /*
   * Placeholder values.
   * Replace these with API hooks when modules are implemented.
   */
  const dashboardStats = {
    appointmentsToday: 0,
    vehiclesArrived: 0,
    customersWaiting: 0,
    activeJobCards: 0,

    awaitingArrival: 0,
    inspectionPending: 0,
    quotationPending: 0,
    customerApprovalPending: 0,
    workInProgress: 0,
    readyForDelivery: 0,

    followUps: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="px-4 sm:px-6 lg:px-10 xl:px-16 pt-10 space-y-10 max-w-[1800px] mx-auto">

        {/* Header */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Service Advisor
                  </p>

                  <p className="text-sm text-slate-400">
                    {organizationName}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || "Service Advisor"}
              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">
                Manage today's appointments, vehicle arrivals,
                customer approvals and service progress.
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
              Today's Service Desk
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Customer and vehicle activity for today
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            <StatCard
              title="Appointments Today"
              value={dashboardStats.appointmentsToday}
              subtitle="Scheduled visits"
              icon={CalendarDays}
              onClick={() => navigate("/appointments")}
            />

            <StatCard
              title="Vehicles Arrived"
              value={dashboardStats.vehiclesArrived}
              subtitle="Checked in today"
              icon={Car}
              onClick={() => navigate("/job-cards")}
            />

            <StatCard
              title="Customers Waiting"
              value={dashboardStats.customersWaiting}
              subtitle="Requires service desk action"
              icon={Users}
            />

            <StatCard
              title="Active Job Cards"
              value={dashboardStats.activeJobCards}
              subtitle="Currently being serviced"
              icon={ClipboardList}
              onClick={() => navigate("/job-cards")}
            />

          </div>
        </div>

        {/* Quick Actions */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Common service advisor activities
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

            <QuickAction
              title="New Customer"
              description="Create customer"
              icon={Users}
              onClick={() => navigate("/customers")}
            />

            <QuickAction
              title="Add Vehicle"
              description="Register vehicle"
              icon={Car}
              onClick={() => navigate("/vehicles")}
            />

            <QuickAction
              title="New Appointment"
              description="Schedule visit"
              icon={CalendarDays}
              onClick={() => navigate("/appointments")}
            />

            <QuickAction
              title="Vehicle Check-In"
              description="Receive vehicle"
              icon={UserCheck}
              onClick={() => navigate("/appointments")}
            />

            <QuickAction
              title="New Job Card"
              description="Create workshop job"
              icon={ClipboardList}
              onClick={() => navigate("/job-cards")}
            />

            <QuickAction
              title="New Quotation"
              description="Prepare estimate"
              icon={FileText}
              onClick={() => navigate("/quotations")}
            />

          </div>
        </div>

        {/* Service Workflow */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Service Workflow
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Vehicles grouped by current service stage
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

            <StatusCard
              title="Awaiting Arrival"
              value={dashboardStats.awaitingArrival}
              icon={CalendarDays}
              onClick={() => navigate("/appointments")}
            />

            <StatusCard
              title="Inspection Pending"
              value={dashboardStats.inspectionPending}
              icon={Search}
              onClick={() => navigate("/inspections")}
            />

            <StatusCard
              title="Quotation Pending"
              value={dashboardStats.quotationPending}
              icon={FileText}
              onClick={() => navigate("/quotations")}
            />

            <StatusCard
              title="Awaiting Approval"
              value={dashboardStats.customerApprovalPending}
              icon={Clock3}
              onClick={() => navigate("/quotations")}
            />

            <StatusCard
              title="Work in Progress"
              value={dashboardStats.workInProgress}
              icon={Activity}
              onClick={() => navigate("/job-cards")}
            />

            <StatusCard
              title="Ready for Delivery"
              value={dashboardStats.readyForDelivery}
              icon={CheckCircle2}
              onClick={() => navigate("/job-cards")}
            />

          </div>
        </div>

        {/* Today's Appointments */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Today's Appointments
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Scheduled vehicles for today
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/appointments")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View Appointments
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center">

              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No appointments scheduled
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Today's appointments will appear here.
              </p>

              <button
                type="button"
                onClick={() => navigate("/appointments")}
                className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl
                bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-5 h-5" />
                New Appointment
              </button>

            </div>

          </div>

          {/* Follow Ups */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Follow-ups
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Customer actions requiring attention
              </p>
            </div>

            <div className="space-y-3">

              <button
                type="button"
                onClick={() => navigate("/quotations")}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl
                bg-slate-50 border border-slate-100 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <Clock3 className="w-5 h-5 text-slate-600" />

                  <span className="text-sm font-medium text-slate-700">
                    Customer Approvals
                  </span>
                </div>

                <span className="font-bold text-slate-900">
                  {dashboardStats.customerApprovalPending}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/quotations")}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl
                bg-slate-50 border border-slate-100 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-600" />

                  <span className="text-sm font-medium text-slate-700">
                    Quotations Pending
                  </span>
                </div>

                <span className="font-bold text-slate-900">
                  {dashboardStats.quotationPending}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/job-cards")}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl
                bg-slate-50 border border-slate-100 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-slate-600" />

                  <span className="text-sm font-medium text-slate-700">
                    Ready for Delivery
                  </span>
                </div>

                <span className="font-bold text-slate-900">
                  {dashboardStats.readyForDelivery}
                </span>
              </button>

            </div>

          </div>

        </div>

        {/* Customer / Vehicle Search */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Find Customer or Vehicle
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Quickly access customer and vehicle records.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                border border-slate-200 bg-white text-slate-800 font-semibold
                hover:bg-slate-50 transition"
              >
                <Users className="w-5 h-5" />
                Search Customers
              </button>

              <button
                type="button"
                onClick={() => navigate("/vehicles")}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              >
                <Car className="w-5 h-5" />
                Search Vehicles
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}