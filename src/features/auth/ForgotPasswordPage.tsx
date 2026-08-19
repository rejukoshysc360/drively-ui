import { useLocation } from "react-router-dom";
import { useState } from "react";

import { api } from "../../lib/axios";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";

export default function ForgotPasswordPage() {
  const location = useLocation();

  const [email] = useState(
    (location.state as any)?.email || ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendResetLink = async () => {
    setSubmitting(true);
    setInlineError(null);
    setSuccess(null);

    try {
      const { data } = await api.post("/auth/forgot-password", {
        email,
      });

      setSuccess(
        data?.message ??
          "If the account is eligible, a password reset link has been sent."
      );
    } catch (err) {
      const parsed = parseApiError(err);

      setInlineError(parsed.message);
      emitApiError(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="card w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-semibold">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-500">
          We'll send a password reset link to your email.
        </p>

        {inlineError && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {inlineError}
          </div>
        )}

        {success && (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <input
          className="input w-full bg-gray-100"
          value={email}
          disabled
        />

        <button
          className="btn-primary w-full"
          disabled={submitting}
          onClick={sendResetLink}
        >
          {submitting
            ? "Sending..."
            : "Send Reset Link"}
        </button>
      </div>
    </div>
  );
}