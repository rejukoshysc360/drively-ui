import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/axios";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";
import { useAuth } from "./useAuth";

export default function AdminChangePasswordPage() { 

  const { logout } = useAuth();
  const nav = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const doChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setInlineError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    setInlineError(null);
    setSuccess(null);

    try {
      await api.post("/auth/change-password", {
        newPassword,
      });

     setSuccess("Password updated successfully. Please sign in again.");

        setTimeout(() => {
        logout();
        nav("/login", { replace: true });
        }, 1500);
    } catch (err) {
      const parsed = parseApiError(err);
      setInlineError(parsed.message);
      emitApiError(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <form
        onSubmit={doChangePassword}
        className="w-full max-w-sm rounded-lg bg-white shadow p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-800">
          Change Password
        </h1>

        <p className="text-sm text-gray-500">
          Enter your new password below.
        </p>

        {inlineError && (
          <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {inlineError}
          </div>
        )}

        {success && (
          <div className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            New Password
          </label>
          <input
            type="password"
            className="input w-full"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            className="input w-full"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}