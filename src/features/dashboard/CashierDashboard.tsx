// CashierDashboard.tsx

import React from "react";
import {
  ReceiptText,
  CreditCard,
  Banknote,
  Landmark,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Car,
  CircleDollarSign,
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
  value: string | number;
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
      transition-all duration-200 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 shrink-0">
        <Icon className="w-6 h-6" />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>

        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>

        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
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

      <p className="font-bold text-slate-900 mt-4">{title}</p>

      <p className="text-sm text-slate-500 mt-1">{description}</p>
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

      <p className="text-sm text-slate-500 mt-4">{title}</p>

      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
    </button>
  );
};

export default function CashierDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const organizationName =
    profile?.organizations?.name || "Drively Demo Org";

  const roleName = profile?.roles?.name || "Cashier";

  /*
   * Placeholder values.
   * Replace with invoice/payment dashboard APIs later.
   */
  const dashboardStats = {
    invoicesToday: 0,
    paymentsToday: 0,
    pendingPayments: 0,
    readyForDelivery: 0,

    unpaidInvoices: 0,
    partiallyPaidInvoices: 0,
    paidInvoices: 0,

    totalCollectedToday: 0,
    cashCollected: 0,
    cardCollected: 0,
    transferCollected: 0,

    outstandingAmount: 0,
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
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
                  <Wallet className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Billing & Payments
                  </p>

                  <p className="text-sm text-slate-400">
                    {organizationName}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || "Cashier"}
              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">
                Manage workshop invoices, customer payments, outstanding
                balances and vehicle payment clearance.
              </p>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100">
              <ShieldCheck className="w-5 h-5 text-slate-600" />

              <div>
                <p className="text-xs text-slate-500">Current Role</p>

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
              Today's Billing
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Invoice and payment activity for today
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Invoices Today"
              value={dashboardStats.invoicesToday}
              subtitle="Invoices generated"
              icon={ReceiptText}
              onClick={() => navigate("/invoices")}
            />

            <StatCard
              title="Payments Today"
              value={dashboardStats.paymentsToday}
              subtitle="Payment transactions"
              icon={CircleDollarSign}
              onClick={() => navigate("/payments")}
            />

            <StatCard
              title="Pending Payments"
              value={dashboardStats.pendingPayments}
              subtitle="Requires collection"
              icon={Clock3}
              onClick={() => navigate("/invoices")}
            />

            <StatCard
              title="Ready for Delivery"
              value={dashboardStats.readyForDelivery}
              subtitle="Payment-cleared vehicles"
              icon={Car}
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
              Common billing and payment operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              title="Find Invoice"
              description="Search customer invoice"
              icon={Search}
              onClick={() => navigate("/invoices")}
            />

            <QuickAction
              title="Collect Payment"
              description="Record customer payment"
              icon={CircleDollarSign}
              onClick={() => navigate("/payments")}
            />

            <QuickAction
              title="View Outstanding"
              description="Review unpaid invoices"
              icon={AlertTriangle}
              onClick={() => navigate("/invoices")}
            />

            <QuickAction
              title="Payment History"
              description="Review transactions"
              icon={FileText}
              onClick={() => navigate("/payments")}
            />
          </div>
        </div>

        {/* Invoice Status */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Invoice Status
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Customer invoices grouped by payment status
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              View All Invoices
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatusCard
              title="Unpaid"
              value={dashboardStats.unpaidInvoices}
              icon={AlertTriangle}
              onClick={() => navigate("/invoices")}
            />

            <StatusCard
              title="Partially Paid"
              value={dashboardStats.partiallyPaidInvoices}
              icon={Clock3}
              onClick={() => navigate("/invoices")}
            />

            <StatusCard
              title="Paid"
              value={dashboardStats.paidInvoices}
              icon={CheckCircle2}
              onClick={() => navigate("/invoices")}
            />
          </div>
        </div>

        {/* Collections */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-7">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Today's Collections
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Payment collection by method
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/payments")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View Payments
              </button>
            </div>

            <div className="mb-7">
              <p className="text-sm text-slate-500">
                Total Collected
              </p>

              <p className="text-4xl font-bold text-slate-900 mt-2">
                {formatCurrency(
                  dashboardStats.totalCollectedToday,
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-slate-600" />
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  Cash
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(
                    dashboardStats.cashCollected,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  Card
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(
                    dashboardStats.cardCollected,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-slate-600" />
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  Transfer
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(
                    dashboardStats.transferCollected,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Outstanding */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-slate-700" />
            </div>

            <p className="text-sm text-slate-500 mt-6">
              Outstanding Amount
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {formatCurrency(
                dashboardStats.outstandingAmount,
              )}
            </p>

            <p className="text-sm text-slate-500 mt-3">
              Total outstanding amount from unpaid and partially
              paid invoices.
            </p>

            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="mt-6 w-full px-5 py-3 rounded-xl bg-slate-900 text-white
              font-semibold hover:bg-slate-800 transition"
            >
              View Outstanding
            </button>
          </div>
        </div>

        {/* Pending Payments */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pending Payments
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Completed workshop jobs awaiting payment
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/invoices")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View All
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center">
              <ReceiptText className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No pending payments
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Unpaid workshop invoices will appear here.
              </p>
            </div>
          </div>

          {/* Delivery Clearance */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Delivery Clearance
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Vehicles awaiting payment clearance
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="w-full flex items-center gap-4 py-4 border-b border-slate-100 text-left hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Payment Pending
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.pendingPayments} vehicles
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/job-cards")}
              className="w-full flex items-center gap-4 py-4 text-left hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Cleared for Delivery
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.readyForDelivery} vehicles
                </p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}