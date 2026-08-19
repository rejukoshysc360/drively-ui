import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function RecoveryPasswordPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initializeRecovery = async () => {
      try {
        // This reads the recovery session created by the email link
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setInlineError(
            "This password recovery link is invalid or has expired."
          );
        }
      } catch {
        setInlineError(
          "Unable to verify the recovery link."
        );
      } finally {
        setLoading(false);
      }
    };

    initializeRecovery();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setInlineError(null);

    if (password.length < 8) {
      setInlineError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setInlineError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSubmitting(false);

    if (error) {
      setInlineError(error.message);
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl px-10 pt-12 pb-16">
          <h1 className="text-2xl font-semibold text-center text-gray-900 mb-10">
            Reset Password
          </h1>

          {inlineError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {inlineError}
            </div>
          )}

          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 text-center">
              Password updated successfully.
              <br />
              Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="w-full px-6 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white transition"
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                className="w-full px-6 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white transition"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition duration-200"
              >
                {submitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}