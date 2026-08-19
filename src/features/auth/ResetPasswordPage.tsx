import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { parseApiError } from '../../utils/parseApiError';
import { emitApiError } from '../../lib/error-bus';

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || ''; // passed from login

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setInlineError('New passwords do not match');
      return;
    }
    setSubmitting(true);
    setInlineError(null);

    try {
      await api.post('/auth/reset-password', {
        email,
        oldPassword,
        newPassword,
      });

      // Once reset, go to dashboard
      nav('/login', { replace: true });
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
        onSubmit={doReset}
        className="card w-full max-w-sm space-y-3 bg-white shadow p-6 rounded"
      >
        <h1 className="text-lg font-semibold">Reset Your Password</h1>

        {inlineError && (
          <div className="text-red-600 text-sm">{inlineError}</div>
        )}

        <input
          className="input w-full bg-gray-100"
          type="email"
          value={email}
          disabled
        />

        <input
          className="input w-full"
          type="password"
          placeholder="Current Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          disabled={submitting}
        />

        <input
          className="input w-full"
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={submitting}
        />

        <input
          className="input w-full"
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={submitting}
        />

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
