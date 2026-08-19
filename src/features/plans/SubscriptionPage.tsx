import { useState } from "react";
import {
  CreditCard,
  Calendar,
  FileText,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  useBillingHistory,
  useCancelSubscription,
  useCurrentSubscription,
  useLinkedOrganizations,
  useStorageUsage,
} from "./hooks";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import { useAuth } from "../../features/auth/AuthProvider";
import { Link } from "react-router-dom";
import { useRoles } from "../../utils/useRoles";

export default function SubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false);

  const { organization_id } = useAuth();

  const { isAdmin } = useRoles();

  if (!isAdmin) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500 mb-4" />

        <h2 className="text-xl font-semibold text-red-700">
          Access Denied
        </h2>

        <p className="mt-2 text-gray-700">
          You do not have permission to access Subscription &amp; Billing.
          Only administrators can view and manage subscription details.
        </p>
      </div>
    </div>
  );
}

  const { data: linkedOrganizations, isLoading: loadingLinkedOrganizations } =
    useLinkedOrganizations();

  const { data: subscription, isLoading: loadingSubscription } =
    useCurrentSubscription();

  const { data: billingHistory, isLoading: loadingHistory } =
    useBillingHistory();

  const cancelSubscription = useCancelSubscription();

  const { data: storageUsage } = useStorageUsage();

  const handleCancel = async () => {
    try {
      await cancelSubscription.mutateAsync();

      toast.success("Subscription cancelled successfully");

      setCancelOpen(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to cancel subscription",
      );
    }
  };

  if (loadingSubscription) {
    return <div className="p-6">Loading subscription...</div>;
  }

  const plan = subscription?.plan || "free";

  const isFreePlan = plan?.toLowerCase() === "free";

  const billingCycle = subscription?.billing_cycle || "-";

  const status =
    subscription?.status || subscription?.subscription_status || "inactive";

  const cancelledAt = subscription?.cancelled_at
    ? new Date(subscription.cancelled_at).toLocaleDateString()
    : null;

  const startsAt = subscription?.starts_at
    ? new Date(subscription.starts_at).toLocaleDateString()
    : "-";

  const endsAt = subscription?.ends_at
    ? new Date(subscription.ends_at).toLocaleDateString()
    : "-";

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-600";

      case "authenticated":
        return "text-blue-600";

      case "paused":
      case "halted":
        return "text-yellow-600";

      case "cancelled":
        return "text-red-600";

      default:
        return "text-gray-600";
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "charged":
        return "bg-green-100 text-green-700";

      case "authenticated":
        return "bg-blue-100 text-blue-700";

      case "pending":
      case "paused":
      case "halted":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatUsagePercentage = (percentage?: number) => {
    if (percentage == null) return "0%";

    if (percentage === 0) return "0%";

    if (percentage < 0.1) return "< 0.1%";

    // Don't round 99.99% to 100%
    if (percentage < 100) {
      return `${(Math.floor(percentage * 10) / 10).toFixed(1)}%`;
    }

    return "100%";
  };

const progressWidth = (percentage?: number) => {
  if (percentage == null || percentage <= 0) {
    return "0%";
  }

  if (percentage >= 100) {
    return "100%";
  }

  // Show a tiny visible bar for any non-zero usage
  return `${Math.max(percentage, 0.5)}%`;
};

  const formatStorage = (mb?: number, gb?: number) => {
    if (mb == null || gb == null) return "-";

    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }

    // ✅ Truncate instead of rounding
    const truncatedGb = Math.floor(gb * 100) / 100;

    return `${truncatedGb.toFixed(2)} GB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <CreditCard className="h-6 w-6 text-indigo-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Subscription & Billing</h1>

            <p className="text-gray-500">
              Manage your subscription and billing history
            </p>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-3xl border shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">Current Plan</h2>

            <p className="text-gray-500 text-sm">Active subscription details</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                isFreePlan
                  ? "bg-green-100 text-green-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {plan.toUpperCase()}
            </span>

            {isAdmin && subscription?.is_billing_organization &&
              plan.toLowerCase() === "free" && (
                <>
                  <Link
                    to="/billing?plan=growth&mode=upgrade"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  >
                    Upgrade to Growth
                  </Link>

                  <Link
                    to="/billing?plan=enterprise&mode=upgrade"
                    className="rounded-xl border border-indigo-600 px-4 py-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    Enterprise
                  </Link>
                </>
              )}

            {isAdmin && subscription?.is_billing_organization &&
              plan.toLowerCase() === "growth" && (
                <Link
                  to="/billing?plan=enterprise&mode=upgrade"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  Upgrade to Enterprise
                </Link>
              )}
          </div>
        </div>

        {!subscription?.is_billing_organization && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-lg font-semibold text-amber-900">
              Billing Organization Required
            </h3>

            <p className="mt-2 text-sm text-amber-800">
              You're viewing a linked organization.
            </p>

            <p className="mt-2 text-sm text-amber-800">
              To manage your subscription (upgrade, renew, or cancel), switch to
              the organization marked "Billing" in the Linked Organizations
              section below.
            </p>
          </div>
        )}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Subscription ID</p>

            <p className="font-semibold mt-1 break-all text-xs">
              {subscription?.razorpay_subscription_id || "-"}
            </p>
          </div>
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Auto Renew</p>

            <p className="font-semibold mt-1">
              {isFreePlan
                ? "Not Applicable"
                : subscription?.auto_renew === false
                  ? "Disabled"
                  : "Enabled"}
            </p>
          </div>
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Plan</p>

            <p className="font-semibold mt-1 capitalize">{plan}</p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Billing Cycle</p>

            <p className="font-semibold mt-1 capitalize">
              {isFreePlan ? "Free Forever" : billingCycle}
            </p>
          </div>

          {cancelledAt && (
            <div className="rounded-2xl border p-4">
              <span className="font-medium">Cancelled On</span>

              <p className="text-sm text-gray-600 mt-2">{cancelledAt}</p>
            </div>
          )}

          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Status</p>

            <p
              className={`font-semibold mt-1 capitalize ${getStatusClass(status)}`}
            >
              {status}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">
              {isFreePlan
                ? "Access"
                : subscription?.auto_renew
                  ? "Renewal Date"
                  : "Access Until"}
            </p>

            <p className="font-semibold mt-1">
              {isFreePlan ? "Unlimited" : endsAt}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />

              <span className="font-medium">Subscription Period</span>
            </div>

            <p className="text-sm text-gray-600 mt-2">
              {isFreePlan
                ? `Started on ${startsAt}`
                : `${startsAt} → ${endsAt}`}
            </p>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />

              <span className="font-medium">Payment Status</span>
            </div>

            <p className="text-sm text-gray-600 mt-2 capitalize">{status}</p>
          </div>
          {!isFreePlan &&
            !subscription?.auto_renew &&
            status?.toLowerCase() === "active" && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  Your subscription has been cancelled and will remain active
                  until {endsAt}.
                </p>
              </div>
            )}
        </div>

        {subscription?.is_billing_organization &&
          !isFreePlan &&
          subscription?.auto_renew !== false &&
          ["active", "authenticated"].includes(status?.toLowerCase()) && (
            <div className="mt-6">
              <button
                onClick={() => setCancelOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel Subscription
              </button>
            </div>
          )}
      </div>

      {/* Linked Organizations */}
      <div className="bg-white rounded-3xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-5 w-5 text-indigo-600" />

          <h2 className="text-xl font-semibold">Linked Organizations</h2>
        </div>

        {loadingLinkedOrganizations ? (
          <div>Loading organizations...</div>
        ) : !linkedOrganizations?.length ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-3" />

            <p className="text-gray-500">No linked organizations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Organization</th>

                  <th className="text-left py-3">Plan</th>

                  <th className="text-left py-3">Status</th>

                  <th className="text-left py-3">Access Until</th>
                </tr>
              </thead>

              <tbody>
                {linkedOrganizations.map((org: any) => (
                  <tr key={org.id} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span>{org.name}</span>

                        {org.id === organization_id && (
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                            Current
                          </span>
                        )}

                        {org.is_billing_organization && (
                          <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                            Billing
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 capitalize">{org.plan || "-"}</td>

                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${getBadgeClass(
                          org.subscription_status,
                        )}`}
                      >
                        {org.subscription_status || "inactive"}
                      </span>
                    </td>

                    <td className="py-3">
                      {org.plan?.toLowerCase() === "free"
                        ? "Unlimited"
                        : org.subscription_end_date
                          ? new Date(
                              org.subscription_end_date,
                            ).toLocaleDateString()
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-6">
       <div className="mt-3 mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
  <p className="text-sm text-blue-800">
    <strong>Shared Storage:</strong> Your storage allocation is shared across
    all organizations in your company group, including linked organizations.
    Documents, payslips, invoices, final settlements, and other generated files
    from any linked organization contribute to this shared storage usage.
  </p>
</div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Total Available</p>

            <p className="font-bold text-lg mt-2">
              {formatStorage(
                storageUsage?.totalAvailableMb,
                storageUsage?.totalAvailableGb,
              )}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Used</p>
            <p className="font-bold text-lg mt-2 text-orange-600">
              {formatStorage(storageUsage?.usedMb, storageUsage?.usedGb)}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Remaining</p>
            <p className="font-bold text-lg mt-2 text-green-600">
              {formatStorage(
                storageUsage?.remainingMb,
                storageUsage?.remainingGb,
              )}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase">Usage</p>

            <p className="font-bold text-lg mt-2">
              {formatUsagePercentage(storageUsage?.percentageUsed)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Storage Consumption</span>
            <span>{formatUsagePercentage(storageUsage?.percentageUsed)}</span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
  {storageUsage
    ? `${formatStorage(
        storageUsage.usedMb,
        storageUsage.usedGb
      )} used of ${formatStorage(
        storageUsage.totalAvailableMb,
        storageUsage.totalAvailableGb
      )}`
    : "-"}
</div>

          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                storageUsage?.percentageUsed > 90
                  ? "bg-red-500"
                  : storageUsage?.percentageUsed > 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{
                width: progressWidth(storageUsage?.percentageUsed),
              }}
            />
          </div>

          {storageUsage?.percentageUsed > 90 && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">
                Storage is almost full. Consider upgrading your subscription
                plan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-3xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-indigo-600" />

          <h2 className="text-xl font-semibold">Billing History</h2>
        </div>

        {loadingHistory ? (
          <div>Loading billing history...</div>
        ) : !billingHistory?.length ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-3" />

            <p className="text-gray-500">No billing records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Date</th>

                  <th className="text-left py-3">Plan</th>

                  <th className="text-left py-3">Billing</th>

                  <th className="text-left py-3">Amount</th>

                  <th className="text-left py-3">Currency</th>

                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {billingHistory.map((item: any) => (
                  <tr
                    key={item.id || item.razorpay_payment_id}
                    className="border-b"
                  >
                    <td className="py-3">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 capitalize">{item.plan}</td>

                    <td className="py-3 capitalize">{item.billing_cycle}</td>

                    <td className="py-3">
                      {item.plan?.toLowerCase() === "free"
                        ? "Free"
                        : Number(item.amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </td>

                    <td className="py-3">{item.currency}</td>

                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${getBadgeClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Subscription"
        description="Are you sure you want to cancel this subscription? This action cannot be undone."
        confirmLabel="Cancel Subscription"
        danger
        isLoading={cancelSubscription.isPending}
        onConfirm={handleCancel}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
