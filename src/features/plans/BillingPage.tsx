import { useRef, useState } from "react";
import {
  Check,
  CreditCard,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  useCreateFreeOrganization,
  useCreateOrder,
  useCurrentSubscription,
  useLinkedOrganizations,
  useVerifyPayment,
} from "./hooks";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { APP_CONFIG } from "../../config/appConfig";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { errorBus } from "../../lib/error-bus";
import { useRoles } from "../../utils/useRoles";

type PlanKey = keyof typeof APP_CONFIG.SUBSCRIPTIONS;
type CountryCode = "IN" | "AE";
type BillingCycle = "monthly" | "annual";

export const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

const normalizePlanKey = (plan: string | null): PlanKey => {
  const value = (plan ?? "growth").toLowerCase();

  if (value === "free") return "Free";
  if (value === "enterprise") return "Enterprise";

  return "Growth";
};

export default function BillingPage() {
  const { organization_id } = useAuth();
  const { isAdmin } = useRoles();
  const { token } = useAuth();  

  if (token && !isAdmin) {
    return <Navigate to="/subscription" replace />;
  } 

  const { data: subscription } = useCurrentSubscription();
  const { data: linkedOrganizations = [] } = useLinkedOrganizations();

  const currentPlan = subscription?.plan?.toLowerCase() ?? "free";

  const { mutateAsync: createFreeOrganization } = useCreateFreeOrganization();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const nav = useNavigate();

  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode");

  const isUpgrade = mode === "upgrade";

  const isExistingPaidOrganization =
    !!organization_id && !isUpgrade && currentPlan !== "free";

  const isAddingOrganization = isExistingPaidOrganization && !isUpgrade;

  const requestedPlanKey = normalizePlanKey(searchParams.get("plan"));

  const planKey: PlanKey = isAddingOrganization
    ? normalizePlanKey(subscription?.plan ?? "free")
    : requestedPlanKey;

  const isFreePlan = planKey === "Free";

  const plan = planKey.toLowerCase();

  const planConfig = APP_CONFIG.SUBSCRIPTIONS[planKey];

  const hasReachedOrganizationLimit =
    isAddingOrganization &&
    linkedOrganizations.length >= planConfig.LIMITS.ORGANIZATIONS;

  const featuresScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollFeaturesUp = () => {
    featuresScrollRef.current?.scrollBy({
      top: -260,
      behavior: "smooth",
    });
  };

  const scrollFeaturesDown = () => {
    featuresScrollRef.current?.scrollBy({
      top: 260,
      behavior: "smooth",
    });
  };

  const getMergedFeatures = (planKey: PlanKey): Record<string, string[]> => {
    const config = APP_CONFIG.SUBSCRIPTIONS[planKey];

    const merged: Record<string, string[]> = {};

    if ("INHERITS" in config && config.INHERITS?.length) {
      config.INHERITS.forEach((parentKey) => {
        const parentFeatures = getMergedFeatures(parentKey as PlanKey);

        Object.entries(parentFeatures).forEach(([category, items]) => {
          merged[category] = [...(merged[category] || []), ...items];
        });
      });
    }

    Object.entries(config.FEATURES || {}).forEach(([category, items]) => {
      merged[category] = [...(merged[category] || []), ...(items as string[])];
    });

    return merged;
  };

  const getPlanFeatures = (planKey: PlanKey) => {
    const config = APP_CONFIG.SUBSCRIPTIONS[planKey];

    const mergedFeatures = getMergedFeatures(planKey);

    return [
      `Up to ${config.LIMITS.EMPLOYEES} Employees`,
      `Up to ${config.LIMITS.ORGANIZATIONS} Organization${
        config.LIMITS.ORGANIZATIONS > 1 ? "s" : ""
      }`,
      `${config.LIMITS.CLIENTS.toLocaleString()} Client${
        config.LIMITS.CLIENTS > 1 ? "s" : ""
      }`,
      `${config.LIMITS.PROJECTS.toLocaleString()} Project${
        config.LIMITS.PROJECTS > 1 ? "s" : ""
      }`,
      `${config.LIMITS.TASKS_PER_MONTH.toLocaleString()} Tasks / Month`,
      `${config.LIMITS.STORAGE_GB} GB Storage`,
      ...Object.entries(mergedFeatures).flatMap(([category, items]) => [
        category.replace(/_/g, " "),
        ...items,
      ]),
    ];
  };

  const planFeatures = getPlanFeatures(planKey);

  const [organizationName, setOrganizationName] = useState("");

  const [adminName, setAdminName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [gstin, setGstin] = useState("");

  const [countryCode, setCountryCode] = useState<CountryCode>("IN");

  const currency = countryCode === "AE" ? "AED" : "INR";

  const currencySymbol = currency === "AED" ? "AED " : "₹";

  const monthlyPrice =
    planKey === "Free"
      ? 0
      : APP_CONFIG.SUBSCRIPTIONS[planKey][currency].MONTHLY_PRICE;

  const annualPrice =
    planKey === "Free"
      ? 0
      : APP_CONFIG.SUBSCRIPTIONS[planKey][currency].ANNUAL_PRICE;

  const selectedPrice = isFreePlan
    ? 0
    : billingCycle === "monthly"
      ? monthlyPrice
      : annualPrice;

  const { mutateAsync: createOrder } = useCreateOrder(organization_id ?? undefined);

  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const handleCheckout = async () => {
    if (hasReachedOrganizationLimit) {
      errorBus.emit("api-error", {
        message: `Your ${planConfig.LABEL} plan allows a maximum of ${planConfig.LIMITS.ORGANIZATIONS} organizations. Please upgrade your subscription to add more organizations.`,
      });

      return;
    }
    try {
      if (!isUpgrade && !organizationName) {
        errorBus.emit("api-error", {
          message: "Organization Name is required.",
        });
        return;
      }

      if (!organization_id) {
        if (!adminName || !email) {
          errorBus.emit("api-error", {
            message: "Administrator Name and Email are required.",
          });
          return;
        }
      }

      if (isFreePlan) {
        await createFreeOrganization({
          organization_name: organizationName,
          admin_name: adminName,
          email,
          phone,
          gstin,
          country_code: countryCode,
        });

        toast.success("Organization created successfully");

        nav("/subscription/success?plan=free");

        return;
      }

      const order = await createOrder({
        plan,
        billing_cycle: billingCycle,
        mode: isUpgrade
          ? "upgrade"
          : isExistingPaidOrganization
            ? "existing-paid-org"
            : "new-org",
        organization_name: organizationName,
        admin_name: adminName,
        email,
        phone,
        gstin,
        country_code: countryCode,
      });

      // Existing paid Billing Organization
      if (order.payment_required === false) {
        nav(`/subscription/success?plan=${plan}&type=organization`);
        return;
      }

      const loaded = await loadRazorpay();

      if (!loaded) {
        toast.error("Failed to load Razorpay");
        return;
      }

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: order.subscription_id,
        name: "HROpera",
        description: `${planKey} Subscription`,
        prefill: {
          name: adminName,
          email,
          contact: phone,
        },

        handler: async (response: any) => {
          await verifyPayment({
            organization_id: order.organization_id,
            is_public_signup: order.is_public_signup,
            plan,
            billing_cycle: billingCycle,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          toast.success("Subscription activated successfully.");

          nav(`/subscription/success?plan=${plan}`);
        },
      });

      razorpay.open();

      razorpay.on("payment.failed", (response: any) => {
        toast.error(response.error?.description || "Payment failed");
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            {isUpgrade
              ? `Upgrade to ${planConfig.LABEL}`
              : isAddingOrganization
                ? "Create New Organization"
                : isFreePlan
                  ? "Create Your Free Organization"
                  : "Complete Your Subscription"}
          </h1>

          <p className="mt-3 text-gray-600">
            {isUpgrade
              ? `Upgrade your current organization to the ${planConfig.LABEL} plan. Your existing employees, payroll, attendance, projects and documents will remain unchanged.`
              : isAddingOrganization
                ? `Your ${currentPlan} subscription already covers multiple organizations. Create another organization under the same subscription without any additional payment.`
                : isFreePlan
                  ? "Create your organization and start using HROpera immediately."
                  : "Activate your subscription and unlock advanced workforce management."}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border shadow-sm p-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    {planConfig.LABEL} Plan
                  </h2>

                  <p className="text-gray-500">{planConfig.TAGLINE}</p>

                  <p className="text-sm text-gray-400 mt-1">
                    {planConfig.DESCRIPTION}
                  </p>
                </div>
              </div>

              {!isFreePlan && !isAddingOrganization && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Billing Cycle</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between border rounded-xl p-4 cursor-pointer hover:border-indigo-400">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          disabled={hasReachedOrganizationLimit}
                          checked={billingCycle === "monthly"}
                          onChange={() => setBillingCycle("monthly")}
                        />

                        <div>
                          <p className="font-medium">Monthly Billing</p>
                          <p className="text-sm text-gray-500">Pay monthly</p>
                        </div>
                      </div>

                      <div className="font-bold">
                        {currencySymbol}
                        {monthlyPrice.toLocaleString()}/month
                      </div>
                    </label>

                    <label className="flex items-center justify-between border rounded-xl p-4 cursor-pointer hover:border-indigo-400">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={billingCycle === "annual"}
                          onChange={() => setBillingCycle("annual")}
                        />

                        <div>
                          <p className="font-medium">Annual Billing</p>

                          <p className="text-sm text-green-600">
                            Save 2 Months
                          </p>
                        </div>
                      </div>

                      <div className="font-bold">
                        {currencySymbol}
                        {annualPrice.toLocaleString()}/year
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            {organization_id &&
              (isUpgrade ? (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-green-900">
                    Upgrade Current Organization
                  </h3>

                  <p className="mt-2 text-sm text-green-700">
                    Your current organization will be upgraded to the{" "}
                    <strong>{planConfig.LABEL}</strong> plan. Existing
                    employees, payroll, attendance, projects, documents and
                    settings will remain exactly as they are.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Multi-Organization Setup
                  </h3>

                  <p className="mt-2 text-sm text-blue-700">
                    This subscription will create a new organization under your
                    existing company group. Once activated, you will be able to
                    manage multiple organizations from a single HROpera account
                    while keeping employees, payroll, projects, attendance and
                    compliance records separated for each organization.
                  </p>
                </div>
              ))}
            {!isUpgrade && !hasReachedOrganizationLimit && (
              <div className="bg-white rounded-3xl border shadow-sm p-8">
                <h3 className="text-xl font-bold mb-6">
                  {isAddingOrganization
                    ? "Organization Information"
                    : isUpgrade
                      ? "Subscription Details"
                      : "Billing Information"}
                </h3>

                <div className="space-y-5">
                  {!isUpgrade && !hasReachedOrganizationLimit && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Organization Name
                      </label>

                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="Snippet Commerce 360 Pvt Ltd"
                        className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {!organization_id && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Administrator Name
                        </label>

                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="Reju Koshy"
                          className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Email Address
                          </label>

                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="collab@snippetcommerce360.com"
                            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Phone Number
                          </label>

                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+xx xxxxx xxxxx"
                            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {!isUpgrade && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Country
                      </label>
                      <select
                        value={countryCode}
                        onChange={(e) =>
                          setCountryCode(e.target.value as CountryCode)
                        }
                        className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="IN">India</option>
                        <option value="AE">United Arab Emirates</option>
                      </select>
                    </div>
                  )}
                  {!isUpgrade && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {countryCode === "AE"
                          ? "TRN (Optional)"
                          : "GSTIN (Optional)"}
                      </label>

                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="Tax Registration Number"
                        className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="bg-white rounded-3xl border shadow-sm p-8 sticky top-6">
              <h3 className="text-xl font-bold">Order Summary</h3>

              <div className="mt-6">
                <div className="flex justify-between">
                  <span>Plan</span>
                  <span className="font-semibold">{planConfig.LABEL}</span>
                </div>

                <div className="flex justify-between mt-3">
                  <span>
                    {isAddingOrganization ? "Subscription" : "Billing"}
                  </span>

                  <span className="capitalize">
                    {isAddingOrganization
                      ? "Already Active"
                      : isFreePlan
                        ? "Free Forever"
                        : billingCycle}
                  </span>
                </div>

                <div className="border-t my-5" />

                {!isAddingOrganization && (
                  <>
                    <div className="border-t my-5" />

                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>

                      <span>
                        {isFreePlan
                          ? "Free"
                          : `${currencySymbol}${selectedPrice.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="border-t my-5" />
                  </>
                )}

                <div className="border-t my-5" />

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Employees</span>
                    <span>{planConfig.LIMITS.EMPLOYEES}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Organizations</span>
                    <span>{planConfig.LIMITS.ORGANIZATIONS}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Clients</span>
                    <span>{planConfig.LIMITS.CLIENTS.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Projects</span>
                    <span>{planConfig.LIMITS.PROJECTS.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tasks / Month</span>
                    <span>
                      {planConfig.LIMITS.TASKS_PER_MONTH.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Storage</span>
                    <span>{planConfig.LIMITS.STORAGE_GB} GB</span>
                  </div>
                </div>
              </div>

              {isAddingOrganization && !hasReachedOrganizationLimit && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
                  <h4 className="font-semibold text-green-800">
                    No Additional Payment Required
                  </h4>

                  <p className="mt-2 text-sm text-green-700">
                    Your current {planConfig.LABEL} subscription already
                    includes up to {planConfig.LIMITS.ORGANIZATIONS}{" "}
                    organizations. This organization will be created under your
                    existing subscription.
                  </p>
                </div>
              )}
              {hasReachedOrganizationLimit && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <h4 className="font-semibold text-red-800">
                    Organization Limit Reached
                  </h4>

                  <p className="mt-2 text-sm text-red-700">
                    Your current {planConfig.LABEL} subscription allows a
                    maximum of {planConfig.LIMITS.ORGANIZATIONS} organizations.
                    <br />
                    You already have {linkedOrganizations.length} organizations
                    linked to this subscription.
                    <br />
                    Upgrade your subscription to add more organizations.
                  </p>
                </div>
              )}

              {!isFreePlan && !isAddingOrganization && (
                <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />

                    <span className="font-semibold text-blue-700">
                      Secure Payment Processing
                    </span>
                  </div>

                  <p className="text-sm text-blue-600 mt-2">
                    Payments are securely processed through Razorpay. We never
                    store your card information.
                  </p>
                </div>
              )}

              <div className="relative mt-8">
                <button
                  type="button"
                  onClick={scrollFeaturesUp}
                  className="absolute right-3 top-3 z-10 rounded-full bg-white border shadow-md p-2 hover:bg-gray-50"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>

                <div
                  ref={featuresScrollRef}
                  className="max-h-[420px] overflow-y-auto pr-10 space-y-3 border-t pt-6 scroll-smooth"
                >
                  {planFeatures.map((feature) => {
                    const isCategory =
                      feature === feature.toUpperCase() &&
                      !feature.includes("/") &&
                      !feature.includes("GB");

                    return (
                      <div key={feature} className="flex items-center gap-3">
                        {isCategory ? (
                          <span className="text-sm font-semibold text-indigo-600 mt-2">
                            {feature}
                          </span>
                        ) : (
                          <>
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-sm text-gray-700">
                              {feature}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={scrollFeaturesDown}
                  className="absolute right-3 bottom-3 z-10 rounded-full bg-white border shadow-md p-2 hover:bg-gray-50"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={hasReachedOrganizationLimit}
                className={`w-full mt-8 py-3 rounded-xl font-semibold transition ${
                  hasReachedOrganizationLimit
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {hasReachedOrganizationLimit
                  ? "Organization Limit Reached"
                  : isUpgrade
                    ? `Upgrade to ${planConfig.LABEL}`
                    : isAddingOrganization
                      ? "Create Organization"
                      : isFreePlan
                        ? "Create Organization"
                        : "Proceed to Payment"}
              </button>
              {!isAddingOrganization && (
                <p className="text-center text-xs text-gray-500 mt-4">
                  Secure payment processing.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
