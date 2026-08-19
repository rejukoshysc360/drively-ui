import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_CONFIG } from "../../config/appConfig";

type PlanKey = keyof typeof APP_CONFIG.SUBSCRIPTIONS;

const normalizePlanKey = (plan: string | null): PlanKey => {
  const value = (plan ?? "growth").toLowerCase();

  if (value === "free") return "Free";
  if (value === "enterprise") return "Enterprise";

  return "Growth";
};

const getMergedFeatures = (planKey: PlanKey): Record<string, string[]> => {
  const planConfig = APP_CONFIG.SUBSCRIPTIONS[planKey];

  const merged: Record<string, string[]> = {};

  if ("INHERITS" in planConfig && planConfig.INHERITS?.length) {
    planConfig.INHERITS.forEach((parentKey) => {
      const parentFeatures = getMergedFeatures(parentKey as PlanKey);

      Object.entries(parentFeatures).forEach(([category, items]) => {
        merged[category] = [...(merged[category] || []), ...items];
      });
    });
  }

  Object.entries(planConfig.FEATURES || {}).forEach(([category, items]) => {
    merged[category] = [...(merged[category] || []), ...(items as string[])];
  });

  return merged;
};

const buildPlanFeatures = (planKey: PlanKey) => {
  const planConfig = APP_CONFIG.SUBSCRIPTIONS[planKey];

  const mergedFeatures = getMergedFeatures(planKey);

  return [
    `Up to ${planConfig.LIMITS.EMPLOYEES} Employees`,
    `Up to ${planConfig.LIMITS.ORGANIZATIONS} Organization${
      planConfig.LIMITS.ORGANIZATIONS > 1 ? "s" : ""
    }`,
    `${planConfig.LIMITS.CLIENTS.toLocaleString()} Client${
      planConfig.LIMITS.CLIENTS > 1 ? "s" : ""
    }`,
    `${planConfig.LIMITS.PROJECTS.toLocaleString()} Project${
      planConfig.LIMITS.PROJECTS > 1 ? "s" : ""
    }`,
    `${planConfig.LIMITS.TASKS_PER_MONTH.toLocaleString()} Tasks / Month`,
    `${planConfig.LIMITS.STORAGE_GB} GB Storage`,
    ...Object.entries(mergedFeatures).flatMap(([category, items]) => [
      category.replace(/_/g, " "),
      ...items,
    ]),
  ];
};

export default function SubscriptionSuccessPage() {
  const nav = useNavigate();

  const [searchParams] = useSearchParams();

  const planKey = normalizePlanKey(searchParams.get("plan"));

  const successType = searchParams.get("type");

  const isOrganizationCreation = successType === "organization";

  const isFreePlan = planKey === "Free";

  const planConfig = APP_CONFIG.SUBSCRIPTIONS[planKey];

  const features = buildPlanFeatures(planKey);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border p-10 text-center">
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-bold text-gray-900">
          {isOrganizationCreation
            ? "Organization Created"
            : isFreePlan
              ? "Organization Created"
              : "Subscription Activated"}
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          {isOrganizationCreation
            ? `Your new organization has been created successfully under your existing ${planConfig.LABEL} subscription.`
            : isFreePlan
              ? "Your organization has been created successfully."
              : `Your ${planConfig.LABEL} subscription has been successfully activated.`}
        </p>
        <p className="mt-8 text-sm text-gray-600 leading-6">
          {isOrganizationCreation
            ? "You can now switch to your new organization from within your existing primary billing account and begin managing it independently."
            : isFreePlan
              ? "An onboarding email containing your username and temporary password has been sent to your registered email address. Please use these credentials to log in and change your password after your first login."
              : "An onboarding email containing your username and temporary password, as well as a payment confirmation email, have been sent to your registered email address. Please use these credentials to log in and change your password after your first login."}
        </p>

        <div className="mt-8 rounded-2xl bg-green-50 border border-green-200 p-6 text-left">
          <h2 className="font-semibold text-green-800 mb-4">What's Included</h2>

          <div className="space-y-3">
            {features.slice(0, 8).map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          {features.length > 8 && (
            <p className="mt-4 text-xs text-gray-500">
              + {features.length - 8} additional features included
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => nav("/login")}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
          >
            Login
          </button> 

        </div>

        {!isOrganizationCreation && (
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left">
            <h3 className="font-semibold text-blue-800">Next Steps</h3>

            <ul className="mt-3 space-y-2 text-sm text-blue-700 list-disc pl-5">
              <li>Check your registered email inbox.</li>
              <li>
                You'll receive an onboarding email containing your username and
                temporary password.
              </li>
              <li>Use those credentials to log in to HROpera.</li>
              <li>
                For security, you'll be prompted to change your password after
                your first login.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
