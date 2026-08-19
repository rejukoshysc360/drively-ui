import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Star, Crown, Rocket, ChevronUp, ChevronDown } from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuth } from "../../features/auth/AuthProvider";

export default function PricingPlans() {

  const nav = useNavigate();

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      nav("/dashboard", { replace: true });
    }
  }, [token, nav]);

  const [countryCode, setCountryCode] = useState<"IN" | "AE">("IN");

  const currency = countryCode === "AE" ? "AED" : "INR";

  const growthMonthly = APP_CONFIG.SUBSCRIPTIONS.Growth[currency].MONTHLY_PRICE;

  const growthAnnual = APP_CONFIG.SUBSCRIPTIONS.Growth[currency].ANNUAL_PRICE;

  const enterpriseMonthly =
    APP_CONFIG.SUBSCRIPTIONS.Enterprise[currency].MONTHLY_PRICE;

  const enterpriseAnnual =
    APP_CONFIG.SUBSCRIPTIONS.Enterprise[currency].ANNUAL_PRICE;

  const country =
    APP_CONFIG.COUNTRIES.find((c) => c.code === countryCode) ||
    APP_CONFIG.COUNTRIES[0];

  const currencySymbol = country.currencySymbol;

const getMergedFeatures = (
  planKey: string,
): Record<string, string[]> => {
  const plan =
    APP_CONFIG.SUBSCRIPTIONS[
      planKey as keyof typeof APP_CONFIG.SUBSCRIPTIONS
    ];

  const merged: Record<string, string[]> = {};

  if (plan.INHERITS?.length) {
    plan.INHERITS.forEach((parentKey) => {
      const parentFeatures = getMergedFeatures(parentKey);

      Object.entries(parentFeatures).forEach(([category, items]) => {
        merged[category] = Array.from(
          new Set([
            ...(merged[category] || []),
            ...items,
          ]),
        );
      });
    });
  }

  Object.entries(plan.FEATURES || {}).forEach(([category, items]) => {
    merged[category] = Array.from(
      new Set([
        ...(merged[category] || []),
        ...(items as string[]),
      ]),
    );
  });

  return merged;
};

 const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

const scrollUp = (planKey: string) => {
  scrollRefs.current[planKey]?.scrollBy({
    top: -300,
    behavior: "smooth",
  });
};

const scrollDown = (planKey: string) => {
  scrollRefs.current[planKey]?.scrollBy({
    top: 300,
    behavior: "smooth",
  });
};

  const plans = [
    {
      key: "Free",
      icon: Rocket,
      price: `${currencySymbol}0`,
      badge: null,
      buttonClass: "bg-gray-900 hover:bg-black text-white",
      ...APP_CONFIG.SUBSCRIPTIONS.Free,
      FEATURES: getMergedFeatures("Free"),
    },

    {
      key: "Growth",
      icon: Star,
      price: `${currencySymbol}${growthMonthly.toLocaleString()}`,
      badge: "MOST POPULAR",
      buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
      ...APP_CONFIG.SUBSCRIPTIONS.Growth,
      FEATURES: getMergedFeatures("Growth"),
    },

    {
      key: "Enterprise",
      icon: Crown,
      price: `${currencySymbol}${enterpriseMonthly.toLocaleString()}`,
      badge: "BEST VALUE",
      buttonClass: "bg-slate-900 hover:bg-black text-white",
      ...APP_CONFIG.SUBSCRIPTIONS.Enterprise,
      FEATURES: getMergedFeatures("Enterprise"),
    },
  ];

  const { Free, Growth, Enterprise } = APP_CONFIG.SUBSCRIPTIONS;

  const comparisonRows = [
    [
      "Employees",
      Free.LIMITS.EMPLOYEES,
      Growth.LIMITS.EMPLOYEES,
      Enterprise.LIMITS.EMPLOYEES,
    ],
    [
      "Organizations",
      Free.LIMITS.ORGANIZATIONS,
      Growth.LIMITS.ORGANIZATIONS,
      Enterprise.LIMITS.ORGANIZATIONS,
    ],
    [
      "Clients",
      Free.LIMITS.CLIENTS,
      Growth.LIMITS.CLIENTS,
      Enterprise.LIMITS.CLIENTS,
    ],
    [
      "Projects",
      Free.LIMITS.PROJECTS,
      Growth.LIMITS.PROJECTS,
      Enterprise.LIMITS.PROJECTS,
    ],
    [
      "Tasks / Month",
      Free.LIMITS.TASKS_PER_MONTH,
      Growth.LIMITS.TASKS_PER_MONTH,
      Enterprise.LIMITS.TASKS_PER_MONTH,
    ],
    [
      "Storage",
      `${Free.LIMITS.STORAGE_GB} GB`,
      `${Growth.LIMITS.STORAGE_GB} GB`,
      `${Enterprise.LIMITS.STORAGE_GB} GB`,
    ],
    [
      "Priority Support",
      Free.COMPARISON.PRIORITY_SUPPORT ? "✓" : "✗",
      Growth.COMPARISON.PRIORITY_SUPPORT ? "✓" : "✗",
      Enterprise.COMPARISON.PRIORITY_SUPPORT ? "✓" : "✗",
    ],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900">HROpera Pricing</h1>

          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage employees, payroll, attendance,
            projects, compliance, and business operations in one platform.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              "Attendance",
              "Payroll",
              "Projects",
              "Compliance",
              "Multi Organization",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full bg-white border px-3 py-1 text-sm text-gray-700 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.key}
                className={`relative
    rounded-3xl
    border
    bg-white
    shadow-sm
    hover:shadow-xl
    transition-all
    duration-300
    min-h-[900px] ${
      plan.key === "Growth"
        ? "border-indigo-500 ring-2 ring-indigo-100 scale-105 lg:-mt-4"
        : "border-gray-200"
    }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-100 p-3">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold">{plan.LABEL}</h2>

                      <p className="text-sm text-gray-500">{plan.TAGLINE}</p>

                      <p className="text-xs text-gray-400 mt-1">
                        {plan.DESCRIPTION}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <span className="text-5xl font-bold">{plan.price}</span>

                    {plan.key !== "Free" && (
                      <span className="text-gray-500">/month</span>
                    )}

                    {plan.key !== "Free" && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Annual: {currencySymbol}
                        {(plan.key === "Enterprise"
                          ? enterpriseAnnual
                          : growthAnnual
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (plan.key === "Free") {
                        nav("/register?plan=free");
                      }

                      if (plan.key === "Growth") {
                        nav("/register?plan=growth");
                      }

                      if (plan.key === "Enterprise") {
                          nav("/register?plan=enterprise");
                      }
                    }}
                    className={`w-full mt-8 rounded-xl py-3 font-semibold transition ${plan.buttonClass}`}
                  >
                    {plan.CTA}
                  </button>
                  {plan.INHERITS?.length > 0 && (
                    <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 mt-8">
                      <p className="text-sm font-semibold text-indigo-700">
                        Everything included in {plan.INHERITS.join(" + ")}
                      </p>
                    </div>
                  )}

<div className="relative mt-8">
  <button
    onClick={() => scrollUp(plan.key)}
    className="absolute right-2 top-2 z-10 rounded-full bg-white shadow-md border p-2"
  >
    <ChevronUp size={16} />
  </button>

  <div
   ref={(el) => {
  scrollRefs.current[plan.key] = el;
}}
    className="
      h-[500px]
      overflow-y-auto
      border-t
      pt-6
      pr-3
      space-y-6
    "
  >
                    <div>
                      <h4 className="font-semibold text-indigo-600 mb-2">
                        Limits
                      </h4>

                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                          <span className="text-sm text-gray-700">Up to {plan.LIMITS.EMPLOYEES} Employees</span>
                        </div>

                        <div className="flex gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                         <span className="text-sm text-gray-700">
                            Up to {plan.LIMITS.ORGANIZATIONS} Organization
                            {plan.LIMITS.ORGANIZATIONS > 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                        <span className="text-sm text-gray-700">
                            {plan.LIMITS.CLIENTS.toLocaleString()} Clients
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                         <span className="text-sm text-gray-700">
                            {plan.LIMITS.PROJECTS.toLocaleString()} Projects
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                         <span className="text-sm text-gray-700">
                            {plan.LIMITS.TASKS_PER_MONTH.toLocaleString()} Tasks
                            / Month
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                         <span className="text-sm text-gray-700">{plan.LIMITS.STORAGE_GB} GB Storage</span>
                        </div>
                      </div>
                    </div>

{plan.key === "Enterprise" ? (
  <>
    <div>
      <h4 className="font-semibold text-indigo-600 mb-2">
        Enterprise Features
      </h4>

      <div className="space-y-2">
        {(plan.FEATURES.ENTERPRISE || []).map((item) => (
          <div key={item} className="flex gap-3">
            <Check className="h-4 w-4 text-green-500 mt-1" />
            <span className="text-sm text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  </>
) : (
  Object.entries(plan.FEATURES).map(([category, items]) => (
    <div key={category}>
      <h4 className="font-semibold text-indigo-600 mb-2">
        {category.replace(/_/g, " ")}
      </h4>

      <div className="space-y-2">
        {(items as string[]).map((item) => (
          <div key={item} className="flex gap-3">
            <Check className="h-4 w-4 text-green-500 mt-1" />
            <span className="text-sm text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  ))
)}
                 </div>

<button
  onClick={() => scrollDown(plan.key)}
  className="absolute right-2 bottom-2 z-10 rounded-full bg-white shadow-md border p-2"
>
  <ChevronDown size={16} />
</button>

</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>

          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4">Feature</th>
                  <th className="p-4">Free</th>
                  <th className="p-4">Growth</th>
                  <th className="p-4">Enterprise</th>
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row[0]} className="border-b">
                    <td className="p-4 font-medium">{row[0]}</td>
                    <td className="text-center p-4">{row[1]}</td>
                    <td className="text-center p-4">{row[2]}</td>
                    <td className="text-center p-4">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border p-6">
              <h3 className="font-semibold">Can I upgrade later?</h3>
              <p className="mt-2 text-gray-600">
                Yes. Upgrade anytime without losing data.
              </p>
            </div>

            <div className="rounded-2xl bg-white border p-6">
              <h3 className="font-semibold">Can I start with the Free plan?</h3>

              <p className="mt-2 text-gray-600">
                Yes. You can start with the Free plan and upgrade at any time.
              </p>
            </div>

            <div className="rounded-2xl bg-white border p-6">
              <h3 className="font-semibold">Do I need a credit card?</h3>
              <p className="mt-2 text-gray-600">No credit card required.</p>
            </div>

            <div className="rounded-2xl bg-white border p-6">
              <h3 className="font-semibold">
                Do you provide onboarding support?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes. Growth and Enterprise plans include support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
