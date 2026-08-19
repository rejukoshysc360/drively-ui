import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, ShieldCheck } from "lucide-react";
import { api } from "../../lib/axios";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";
import { useCreateOrder, useVerifyPayment, useVerifyRenewSubscription } from "./hooks";
import { loadRazorpay } from "./BillingPage";

type BillingCycle = "monthly" | "annual";

export default function RenewSubscriptionPage() {
  const nav = useNavigate();

  const [password, setPassword] = useState("");

  const [verified, setVerified] = useState(false);

  const [email, setEmail] = useState("");

  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const verifyRenewSubscription = useVerifyRenewSubscription();
 const { mutateAsync: createOrder } = useCreateOrder();
 const { mutateAsync: verifyPayment } = useVerifyPayment();

const handleVerify = async () => {
  setInlineError(null);

  try {
    const data =
      await verifyRenewSubscription.mutateAsync({
        email,
        password,
      });

    setSubscriptionData(data);

    setBillingCycle(
      (data.billing_cycle as BillingCycle) ?? "monthly",
    );

setVerified(true);
    setVerified(true);
  } catch (err: any) {
    const parsed = parseApiError(err);

    setInlineError(parsed.message);

    emitApiError(parsed);
  }
};
const handleRenew = async () => {
  try {
    setSubmitting(true);
    setInlineError(null);

    const order = await createOrder({
      plan: subscriptionData.plan,
      billing_cycle: billingCycle,
      email,
      mode: "renew",
    });

    const loaded = await loadRazorpay();

    if (!loaded) {
      setInlineError("Failed to load Razorpay.");
      return;
    }

    const razorpay = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      subscription_id: order.subscription_id,

      name: "HROpera",

      description: "Subscription Renewal",

      prefill: {
        email,
      },

      handler: async (response: any) => {
        try {
          await verifyPayment({
            organization_id: order.organization_id,
            is_public_signup: true,
            plan: subscriptionData.plan,
            billing_cycle: billingCycle,

            razorpay_subscription_id:
              response.razorpay_subscription_id,

            razorpay_payment_id:
              response.razorpay_payment_id,

            razorpay_signature:
              response.razorpay_signature,
          });

          nav("/login", {
            state: {
              renewed: true,
            },
          });
        } catch (err: any) {
          const parsed = parseApiError(err);

          setInlineError(parsed.message);

          emitApiError(parsed);
        }
      },
    });

    razorpay.open();

    razorpay.on("payment.failed", (response: any) => {
      setInlineError(
        response.error?.description ??
          "Payment failed."
      );
    });
  } catch (err: any) {
    const parsed = parseApiError(err);

    setInlineError(parsed.message);

    emitApiError(parsed);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border shadow-sm p-8">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-100 p-3">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Renew Subscription</h1>

              <p className="text-gray-500 mt-1">
                Renew your HROpera subscription to regain access.
              </p>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Registered Email
              </label>
            {inlineError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {inlineError}
                </div>
                )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
            {!verified && (
              <button
                onClick={handleVerify}
                disabled={submitting}
                className="mt-8 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                {submitting ? "Verifying..." : "Verify Account"}
              </button>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Billing Cycle
              </label>

              <select
                disabled={!verified}
                value={billingCycle}
                onChange={(e) =>
                  setBillingCycle(e.target.value as BillingCycle)
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="monthly">Monthly</option>

                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          {verified && (
            <>
              <div className="mt-10 rounded-2xl border bg-gray-50 p-6">
                <h2 className="font-semibold text-lg">Subscription Details</h2>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between">
                    <span>Organization</span>
                    <span className="font-medium">
                      {subscriptionData.organization_name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Current Plan</span>
                    <span className="font-medium">{subscriptionData.plan}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="font-medium text-red-600">
                      {subscriptionData.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Renewal Amount</span>
                    <span className="font-bold">
                      <>
                        {subscriptionData.currency === "AED" ? "AED " : "₹"}
                        {billingCycle === "monthly"
                          ? subscriptionData.monthly_price.toLocaleString()
                          : subscriptionData.annual_price.toLocaleString()}
                        /{billingCycle}
                      </>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />

                  <span className="font-semibold text-blue-700">
                    Secure Payment
                  </span>
                </div>

                <p className="mt-2 text-sm text-blue-700">
                  Your existing organization, employees, payroll, attendance,
                  projects and settings will remain unchanged. Renewing your
                  subscription simply restores access.
                </p>
              </div>

             <button
  onClick={handleRenew}
  disabled={submitting}
  className="mt-8 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
>
  {submitting ? "Creating Order..." : "Renew Subscription"}
</button>
            </>
          )}
          <button
            onClick={() => nav("/login")}
            className="mt-4 w-full rounded-xl border py-3"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
