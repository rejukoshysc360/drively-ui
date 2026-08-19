import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { api } from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";
import { setTokens } from "../../lib/storage";
import { Rocket } from "lucide-react";

export default function LoginPage() {

  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setInlineError(null);
    setSubscriptionExpired(false);
    setShowForgotPassword(false);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      // 🔹 Redirect to reset password page BEFORE setting auth context
      if (data?.profile?.must_change_password) {
        nav("/reset-password", { state: { email: data.user?.email } });
        return;
      }

      // ✅ Safe to log user in
      setTokens(data.access_token, data.refresh_token);
      login({
        token: data.access_token,
        user: data.user,
        profile: data.profile,
        organization_id: data.organization_id ?? null,
        organization_name: data.organization_name ?? null,
        organization_country_code: data.organization_country_code ?? null,
        organization_currency: data.organization_currency ?? null,
        organization_logo_url: data.organization_logo_url,
        organization_address: data.organization_address,
        organization_plan: data.organization_plan ?? null, // <-- add this
        organization_email: data.organization_email,
        assigned_organizations: data.assigned_organizations ?? [],
        has_multiple_organizations: data.has_multiple_organizations ?? false,
      });

      if (data.organizations?.length > 1) {
        nav("/select-organization", { state: { orgs: data.organizations } });
        return;
      }

      nav("/", { replace: true });

   } catch (err: any) {

  const parsed = parseApiError(err);

  setInlineError(parsed.message);

  if (
  parsed.message === "No active organizations available." ||
  parsed.message === "Organization subscription has expired."
) {
  setSubscriptionExpired(true);
}  

  emitApiError(parsed);

  setShowForgotPassword(parsed.showForgotPassword === true);
} finally {
  setSubmitting(false);
}
  };

  const host = window.location.hostname;

  const isRowther = host.includes("rowtherec");

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl px-10 pt-12 pb-16">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <img
              src="/drivelylogo.png"
              alt="Organization Logo"
              className="h-30 object-contain"
            />
          </div>
          {/* Title */}
          <h1 className="text-2xl font-semibold text-center text-gray-900 mb-10">
            Sign in
          </h1>

          {/* Form */}
          <form onSubmit={doLogin} className="space-y-8">
            {/* Error */}
            {inlineError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-6 py-4 rounded-xl text-center">
                {inlineError}
              </div>
            )}
            {subscriptionExpired && (
  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
    <p className="text-sm text-amber-800 mb-4">
      Your subscription has expired. Renew your subscription to continue using HROpera.
    </p> 
    <button
      type="button"
      onClick={() =>
        nav(`/renew-subscription?email=${encodeURIComponent(email)}`)
      }
      className="rounded-xl bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
    >
      Renew Subscription
    </button>
  </div>
)}

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full px-6 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white transition"
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full px-6 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white transition"
            />
            {showForgotPassword && (
          <div className="text-right">
            <button
              type="button"
              onClick={() =>
                nav("/forgot-password", {
                  state: { email },
                })
              }
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

            {/* Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition duration-200 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
            {/* Sign Up CTA */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => nav("/pricing")}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Sign up here
                </button>
              </p>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Rocket className="h-4 w-4 text-indigo-600" />
            <span>
              Start your <span className="font-semibold text-indigo-600">FREE trial today</span>. No credit card required.
            </span>
          </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
