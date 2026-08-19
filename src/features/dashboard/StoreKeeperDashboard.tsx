// StoreKeeperDashboard.tsx

import React from "react";
import {
  Package,
  PackageCheck,
  PackageX,
  AlertTriangle,
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  Warehouse,
  Search,
  ScanBarcode,
  Clock3,
  ShieldCheck,
  ArrowRight,
  Boxes,
  ShoppingCart,
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

export default function StoreKeeperDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const organizationName =
    profile?.organizations?.name || "Drively Demo Org";

  const roleName = profile?.roles?.name || "Store Keeper";

  /*
   * Placeholder values.
   * Replace with inventory dashboard APIs later.
   */
  const dashboardStats = {
    totalParts: 0,
    availableParts: 0,
    reservedParts: 0,
    lowStockItems: 0,

    pendingPartRequests: 0,
    readyToIssue: 0,
    issuedToday: 0,
    receivedToday: 0,

    outOfStockItems: 0,
    purchaseRecommendations: 0,

    totalWarehouses: 0,
    stockMovementsToday: 0,
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
                  <Warehouse className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Parts & Inventory
                  </p>

                  <p className="text-sm text-slate-400">
                    {organizationName}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || "Store Keeper"}
              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">
                Manage spare parts, stock reservations, parts issues,
                receipts and inventory alerts.
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

        {/* Inventory KPIs */}

        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Inventory Overview
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current spare parts availability
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Total Parts"
              value={dashboardStats.totalParts}
              subtitle="Inventory items"
              icon={Package}
              onClick={() => navigate("/inventory")}
            />

            <StatCard
              title="Available Parts"
              value={dashboardStats.availableParts}
              subtitle="Available for issue"
              icon={PackageCheck}
              onClick={() => navigate("/inventory")}
            />

            <StatCard
              title="Reserved Parts"
              value={dashboardStats.reservedParts}
              subtitle="Reserved against jobs"
              icon={ClipboardList}
              onClick={() => navigate("/inventory/reservations")}
            />

            <StatCard
              title="Low Stock"
              value={dashboardStats.lowStockItems}
              subtitle="Requires attention"
              icon={AlertTriangle}
              onClick={() => navigate("/inventory/low-stock")}
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
              Common inventory operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <QuickAction
              title="Find Part"
              description="Search inventory"
              icon={Search}
              onClick={() => navigate("/inventory")}
            />

            <QuickAction
              title="Scan Barcode"
              description="Locate stock item"
              icon={ScanBarcode}
              onClick={() => navigate("/inventory/scan")}
            />

            <QuickAction
              title="Reserve Part"
              description="Reserve against job"
              icon={ClipboardList}
              onClick={() => navigate("/inventory/reservations")}
            />

            <QuickAction
              title="Issue Part"
              description="Issue reserved stock"
              icon={ArrowUpFromLine}
              onClick={() => navigate("/inventory/issues")}
            />

            <QuickAction
              title="Receive Stock"
              description="Record stock receipt"
              icon={ArrowDownToLine}
              onClick={() => navigate("/inventory/receipts")}
            />

            <QuickAction
              title="Stock Adjustment"
              description="Correct inventory"
              icon={Boxes}
              onClick={() => navigate("/inventory/adjustments")}
            />
          </div>
        </div>

        {/* Parts Requests */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Parts Requests
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Workshop parts requests by status
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/inventory/requests")}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              View All Requests
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              title="Pending Requests"
              value={dashboardStats.pendingPartRequests}
              icon={Clock3}
              onClick={() => navigate("/inventory/requests")}
            />

            <StatusCard
              title="Ready to Issue"
              value={dashboardStats.readyToIssue}
              icon={PackageCheck}
              onClick={() => navigate("/inventory/issues")}
            />

            <StatusCard
              title="Issued Today"
              value={dashboardStats.issuedToday}
              icon={ArrowUpFromLine}
              onClick={() => navigate("/inventory/issues")}
            />

            <StatusCard
              title="Received Today"
              value={dashboardStats.receivedToday}
              icon={ArrowDownToLine}
              onClick={() => navigate("/inventory/receipts")}
            />
          </div>
        </div>

        {/* Pending Requests + Alerts */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pending Parts Requests
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Parts requested by workshop job cards
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/inventory/requests")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View Requests
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No pending parts requests
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Parts requested from workshop operations will appear here.
              </p>
            </div>
          </div>

          {/* Inventory Alerts */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Inventory Alerts
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Stock requiring attention
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/inventory/low-stock")}
              className="w-full flex items-center gap-4 py-4 border-b border-slate-100 text-left hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Low Stock
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.lowStockItems} items below minimum level
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="w-full flex items-center gap-4 py-4 border-b border-slate-100 text-left hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <PackageX className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Out of Stock
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.outOfStockItems} items unavailable
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/inventory/purchase-recommendations")
              }
              className="w-full flex items-center gap-4 py-4 text-left hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-slate-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Purchase Recommendations
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {dashboardStats.purchaseRecommendations} items suggested
                  for purchase
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Stock Activity */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Stock Movement
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Latest inventory receipts, issues and adjustments
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/inventory/movements")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View Movements
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-14 px-6 text-center">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="font-semibold text-slate-700 mt-4">
                No stock movements yet
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Stock receipts, issues and adjustments will appear here.
              </p>
            </div>
          </div>

          {/* Store Summary */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-slate-700" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-5">
              Store Summary
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm text-slate-500">
                  Warehouses
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {dashboardStats.totalWarehouses}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">
                  Stock Movements Today
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {dashboardStats.stockMovementsToday}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/inventory")}
                className="w-full px-5 py-3 rounded-xl bg-slate-900 text-white
                font-semibold hover:bg-slate-800 transition"
              >
                Open Inventory
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}