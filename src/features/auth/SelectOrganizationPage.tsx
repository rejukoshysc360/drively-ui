import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getToken } from '../../lib/storage';
import { useQueryClient } from '@tanstack/react-query';
import { useOrganizations } from '../organizations/hooks';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function SelectOrganizationPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { state } = useLocation();
  const qc = useQueryClient();

  const page = 1;
  const limit = 50;
  const { data, isLoading, error } = useOrganizations(page, limit);
  const orgs = state?.orgs?.length ? state.orgs : data?.organizations ?? [];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const token = getToken();

  const handleSelect = (org: any) => {
    if (!token) {
      setSelectedOrg(null);
      setConfirmOpen(true);
      return;
    }

    // ✅ If we came directly from login (has orgs in location.state)
    if (state?.orgs?.length) {
      handleConfirm(org);
      return;
    }

    // Otherwise, manual switch — show confirmation
    setSelectedOrg(org);
    setConfirmOpen(true);
  };

  const handleConfirm = async (orgParam?: any) => {
    const org = orgParam || selectedOrg;
    if (!org) return;

    login({
      token: getToken(),
      organization_id: org.id,
      organization_name: org.name,
      organization_country_code: org.country_code,
      organization_currency: org.currency,
      organization_address: org.address,
      organization_email: org.email,
      organization_plan: org.plan, 

      assigned_organizations: orgs,

      has_multiple_organizations:
        orgs.length > 1,
    });
    qc.invalidateQueries({ queryKey: ['organization'] });
    setConfirmOpen(false);
    nav('/', { replace: true });
  };

  // ✅ Optional: auto-select if there’s only one org from login
  useEffect(() => {
    if (state?.orgs?.length === 1) {
      handleConfirm(state.orgs[0]);
    }
  }, [state]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Select Organization
        </h2>

        {isLoading && (
          <p className="text-center text-gray-500 py-2">
            Loading organizations...
          </p>
        )}

        {error && (
          <p className="text-center text-red-500 py-2">
            {(error as Error).message || 'Failed to load organizations'}
          </p>
        )}

        {!isLoading && !error && orgs.length === 0 && (
          <p className="text-center text-gray-500 py-2">
            No organizations found.
          </p>
        )}

        {!isLoading &&
          !error &&
          orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelect(org)}
              className="block w-full p-3 mb-2 bg-gray-100 hover:bg-gray-200 rounded text-center font-medium text-gray-700 transition"
            >
              {org.name}
              {org.country_code && (
                <span className="text-xs text-gray-500 ml-2">
                  ({org.country_code})
                </span>
              )}
            </button>
          ))}
      </div>

      {/* Confirmation Dialog (shown only for manual switches) */}
      <ConfirmDialog
        open={confirmOpen}
        title={token ? 'Switch Organization' : 'Session Expired'}
        description={
          token
            ? `Are you sure you want to switch to "${selectedOrg?.name}" organization?`
            : 'Your session has expired. Please log in again to continue.'
        }
        confirmLabel={token ? 'Switch' : 'Login'}
        danger={!token}
        isLoading={false}
        onConfirm={() => {
          if (!token) {
            setConfirmOpen(false);
            nav('/login', { replace: true });
          } else {
            handleConfirm();
          }
        }}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedOrg(null);
        }}
      />
    </div>
  );
}
