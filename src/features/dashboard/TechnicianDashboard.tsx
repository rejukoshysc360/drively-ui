// TechnicianDashboard.tsx

import React from "react";
import {
  Wrench,
  ClipboardList,
  Clock3,
  Package,
  CheckCircle2,
  Play,
  Pause,
  Timer,
  AlertTriangle,
  Car,
  ShieldCheck,
  Activity,
  ArrowRight,
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

type WorkStatusCardProps = {
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
      hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5
      transition-all"
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

const WorkStatusCard = ({
  title,
  value,
  icon: Icon,
  onClick,
}: WorkStatusCardProps) => {
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

export default function TechnicianDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const organizationName =
    profile?.organizations?.name ||
    "Drively Demo Org";

  const roleName =
    profile?.roles?.name ||
    "Technician";

  /*
   * Placeholder values.
   * Replace with technician dashboard APIs later.
   */
  const dashboardStats = {
    assignedToday: 0,
    inProgress: 0,
    waitingForParts: 0,
    completedToday: 0,

    pending: 0,
    paused: 0,
    qualityCheck: 0,

    hoursLoggedToday: 0,
    estimatedHoursToday: 0,

    overdueOperations: 0,
  };

  const productivity =
    dashboardStats.estimatedHoursToday > 0
      ? Math.min(
          100,
          Math.round(
            (dashboardStats.hoursLoggedToday /
              dashboardStats.estimatedHoursToday) *
              100,
          ),
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
                  <Wrench className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Technician Workspace
                  </p>

                  <p className="text-sm text-slate-400">
                    {organizationName}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || "Technician"}
              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">
                View your assigned operations, record work time,
                request parts and complete workshop tasks.
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

        {/* Today's KPIs */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              My Work Today
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Today's assigned workshop operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            <StatCard
              title="Assigned Today"
              value={dashboardStats.assignedToday}
              subtitle="Operations assigned"
              icon={ClipboardList}
              onClick={() => navigate("/my-jobs")}
            />

            <StatCard
              title="Work in Progress"
              value={dashboardStats.inProgress}
              subtitle="Currently active"
              icon={Activity}
              onClick={() => navigate("/my-jobs")}
            />

            <StatCard
              title="Waiting for Parts"
              value={dashboardStats.waitingForParts}
              subtitle="Blocked by parts"
              icon={Package}
              onClick={() => navigate("/my-jobs")}
            />

            <StatCard
              title="Completed Today"
              value={dashboardStats.completedToday}
              subtitle="Operations completed"
              icon={CheckCircle2}
              onClick={() => navigate("/my-jobs")}
            />

          </div>
        </div>

        {/* Current Work */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">

            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Current Operation
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Your active workshop task
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/my-jobs")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View My Jobs
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center">

              <Wrench className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No operation currently in progress
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Start an assigned operation from your work queue.
              </p>

              <button
                type="button"
                onClick={() => navigate("/my-jobs")}
                className="mt-5 px-5 py-3 rounded-xl bg-slate-900 text-white
                font-semibold hover:bg-slate-800 transition"
              >
                View Assigned Work
              </button>

            </div>

          </div>

          {/* Time Summary */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">

            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Timer className="w-6 h-6 text-slate-700" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-5">
              Time Summary
            </h2>

            <div className="mt-6 space-y-5">

              <div>
                <p className="text-sm text-slate-500">
                  Hours Logged Today
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {dashboardStats.hoursLoggedToday}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Estimated Hours
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {dashboardStats.estimatedHoursToday}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">
                    Progress
                  </p>

                  <p className="text-sm font-bold text-slate-800">
                    {productivity}%
                  </p>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all duration-500"
                    style={{
                      width: `${productivity}%`,
                    }}
                  />
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Work Queue Status */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Work Queue
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Assigned operations by current status
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/my-jobs")}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              View Full Queue
            </button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            <WorkStatusCard
              title="Pending"
              value={dashboardStats.pending}
              icon={ClipboardList}
              onClick={() => navigate("/my-jobs")}
            />

            <WorkStatusCard
              title="In Progress"
              value={dashboardStats.inProgress}
              icon={Play}
              onClick={() => navigate("/my-jobs")}
            />

            <WorkStatusCard
              title="Paused"
              value={dashboardStats.paused}
              icon={Pause}
              onClick={() => navigate("/my-jobs")}
            />

            <WorkStatusCard
              title="Waiting for Parts"
              value={dashboardStats.waitingForParts}
              icon={Package}
              onClick={() => navigate("/my-jobs")}
            />

            <WorkStatusCard
              title="Quality Check"
              value={dashboardStats.qualityCheck}
              icon={ShieldCheck}
              onClick={() => navigate("/my-jobs")}
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
              Actions available during workshop operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <QuickAction
              title="Start Work"
              description="Start assigned operation"
              icon={Play}
              onClick={() => navigate("/my-jobs")}
            />

            <QuickAction
              title="Record Hours"
              description="Update actual labor time"
              icon={Clock3}
              onClick={() => navigate("/my-jobs")}
            />

            <QuickAction
              title="Request Part"
              description="Request required spare part"
              icon={Package}
              onClick={() => navigate("/my-jobs")}
            />

            <QuickAction
              title="Complete Operation"
              description="Mark operation complete"
              icon={CheckCircle2}
              onClick={() => navigate("/my-jobs")}
            />

          </div>
        </div>

        {/* Alerts */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

            <div className="flex items-center justify-between gap-4 mb-6">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Assigned Jobs
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Vehicle and operation details will appear here
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/my-jobs")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View All
              </button>

            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-14 px-6 text-center">

              <Car className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No jobs currently assigned
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Assigned vehicles and repair operations will appear here.
              </p>

            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Attention Required
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Work requiring action
              </p>
            </div>

            <div className="flex items-center gap-4 py-4 border-b border-slate-100">

              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Waiting for Parts
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.waitingForParts} operations blocked
                </p>
              </div>

            </div>

            <div className="flex items-center gap-4 py-4">

              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Overdue Operations
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.overdueOperations} operations overdue
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}