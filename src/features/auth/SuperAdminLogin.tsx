// src/features/auth/SuperAdminLoginPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthProvider";

import { api } from "../../lib/axios";
import { setTokens } from "../../lib/storage";

import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";

export default function SuperAdminLoginPage() {
  const { login } = useAuth();

  const nav = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [inlineError, setInlineError] =
    useState<string | null>(null);

  const doLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSubmitting(true);

    setInlineError(null);

    try {
      const { data } =
        await api.post(
          "/auth/login",
          {
            email,
            password,
          }
        );

      const roleSlug =
        data?.profile?.roles?.slug;

      // =====================================================
      // SUPER ADMIN ONLY
      // =====================================================

      if (
        roleSlug !==
        "superadmin"
      ) {
        throw new Error(
          "Super Admin access required"
        );
      }

      // =====================================================
      // STORE TOKENS
      // =====================================================

      setTokens(
        data.access_token,
        data.refresh_token
      );

      // =====================================================
      // LOGIN WITHOUT ORGANIZATION
      // =====================================================

      login({
        token:
          data.access_token,

        user:
          data.user,

        profile:
          data.profile,

        organization_id: null,
        organization_name: null,
        organization_country_code: null,
        organization_currency: null,
        organization_logo_url: null,
        organization_plan: null,
        organization_address: null,
        organization_email: null,

        assigned_organizations: [],
        has_multiple_organizations: false,
      });

      // =====================================================
      // GO TO MCP
      // =====================================================

      nav("/mcp", {
        replace: true,
      });

    } catch (err) {
      const parsed =
        parseApiError(err);

      setInlineError(
        parsed.message
      );

      emitApiError(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl px-10 pt-12 pb-16">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/hroperalogo.png"
              alt="HROpera"
              className="h-10 object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-center text-gray-900">
            Super Admin Login
          </h1>

          <p className="text-sm text-center text-gray-500 mt-2 mb-8">
            Platform Maintenance & Control
          </p>

          <form
            onSubmit={doLogin}
            className="space-y-6"
          >
            {inlineError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center">
                {inlineError}
              </div>
            )}

            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              disabled={submitting}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              disabled={submitting}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-4 rounded-xl transition"
            >
              {submitting
                ? "Signing In..."
                : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}