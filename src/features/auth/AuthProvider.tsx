import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken, clearToken } from '../../lib/storage';
import { useOrganizationLogo } from './hooks';

type LoginPayload =
  | string
  | {
      token: string;
      user?: any | null;
      profile?: any | null;
      organization_id?: string | null;
      organization_name?: string | null;
      organization_country_code?: string | null;
      organization_currency?: string | null;
      organization_logo_url?: string | null;
      organization_plan?: string | null;
      organization_address: string | null;
      organization_email: string | null;
      assigned_organizations?: any[];
      has_multiple_organizations?: boolean;
    };

type Ctx = {
  token: string | null;
  user?: any | null;
  profile?: any | null;
  organization_id?: string | null;
  organization_name?: string | null;
  organization_country_code?: string | null;
  organization_currency?: string | null;
  organization_logo_url?: string | null;
  organization_plan?: string | null;
  organization_address: string | null;
  organization_email: string | null;
  assigned_organizations?: any[];
  has_multiple_organizations?: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  setOrganizationLogo: (url: string | null) => void;
};

const LS_EXTRAS_KEY = 'sc360.auth.extras';

// ---------------------------------------------------------------------------
// Load saved extras from localStorage
// ---------------------------------------------------------------------------
function loadExtras() {
  try {
    const raw = localStorage.getItem(LS_EXTRAS_KEY);

    if (!raw)
      return {
        user: null,
        profile: null,
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
      };

    const parsed = JSON.parse(raw);

    return {
      user: parsed.user ?? null,
      profile: parsed.profile ?? null,
      organization_id: parsed.organization_id ?? null,
      organization_name: parsed.organization_name ?? null,
      organization_country_code: parsed.organization_country_code ?? null,
      organization_currency: parsed.organization_currency ?? null,
      organization_logo_url: parsed.organization_logo_url ?? null,
      organization_address: parsed.organization_address ?? null,
      organization_email: parsed.organization_email ?? null,
      organization_plan: parsed.organization_plan ?? null,
      assigned_organizations: parsed.assigned_organizations ?? [],
      has_multiple_organizations:
        parsed.has_multiple_organizations ?? false,
    };
  } catch {
    return {
      user: null,
      profile: null,
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
    };
  }
}

const AuthCtx = createContext<Ctx>({
  token: null,
  user: null,
  profile: null,
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
  login: () => {},
  logout: () => {},
  setOrganizationLogo: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken() || null);

  const [extras, setExtras] = useState<{
    user: any | null;
    profile: any | null;
    organization_id: string | null;
    organization_name: string | null;
    organization_country_code: string | null;
    organization_currency: string | null;
    organization_logo_url: string | null;
    organization_plan: string | null;
    organization_address: string | null;
    organization_email: string | null;
    assigned_organizations: any[];
    has_multiple_organizations: boolean;
  }>(loadExtras);

  const { data: logoUrl, isLoading } = useOrganizationLogo(extras.organization_id);

  const setOrganizationLogo = (url: string | null) => {
    setExtras((prev) => {
      const updated = {
        ...prev,
        organization_logo_url: url,
      };

      localStorage.setItem(
        LS_EXTRAS_KEY,
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  useEffect(() => {
    if (isLoading) return;

    setExtras((prev) => {
      if (
        (prev.organization_logo_url || null) ===
        (logoUrl || null)
      ) {
        return prev;
      }

      const updated = {
        ...prev,
        organization_logo_url: logoUrl ?? null,
      };

      localStorage.setItem(
        LS_EXTRAS_KEY,
        JSON.stringify(updated)
      );

      return updated;
    });
  }, [logoUrl, isLoading]);

  // -------------------------------------------------------------------------
  // LOGIN — accepts token only or full payload
  // -------------------------------------------------------------------------
  const login: Ctx['login'] = (payload) => {

      console.log("LOGIN PAYLOAD", payload);
      
    if (typeof payload === 'string') {
      setToken(payload);
      setTok(payload); 
      localStorage.setItem(
        LS_EXTRAS_KEY,
        JSON.stringify(extras)
      );

      return;
    }

    const roleSlug = payload?.profile?.roles?.slug;

if (roleSlug === "superadmin") {

  const next = {
    user: payload.user ?? null,
    profile: payload.profile ?? null,

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
  };

  setToken(payload.token);
  setTok(payload.token);
  setExtras(next);

  localStorage.setItem(
    LS_EXTRAS_KEY,
    JSON.stringify(next)
  );

  return;
}

    const next = {
      user: payload.user ?? extras.user ?? null,
      profile: payload.profile ?? extras.profile ?? null,
      organization_id:
        payload.organization_id ??
        extras.organization_id ??
        null,
      organization_name:
        payload.organization_name ??
        extras.organization_name ??
        null,
      organization_country_code:
        payload.organization_country_code ??
        extras.organization_country_code ??
        null,
      organization_currency:
        payload.organization_currency ??
        extras.organization_currency ??
        null,
      organization_logo_url:
        payload.organization_logo_url ??
        extras.organization_logo_url ??
        null,
      organization_plan:
        payload.organization_plan ??
        extras.organization_plan ??
        null,
      organization_address:
        payload.organization_address ??
        extras.organization_address ??
        null,
      organization_email:
        payload.organization_email ??
        extras.organization_email ??
        null,
      assigned_organizations:
        payload.assigned_organizations ??
        extras.assigned_organizations ??
        [],
      has_multiple_organizations:
        payload.has_multiple_organizations ??
        extras.has_multiple_organizations ??
        false,
    };

    setToken(payload.token);
    setTok(payload.token);

    setExtras(next);

    localStorage.setItem(
      LS_EXTRAS_KEY,
      JSON.stringify(next)
    );
  };

  // -------------------------------------------------------------------------
  // LOGOUT — clear everything
  // -------------------------------------------------------------------------
  const logout = () => {
    clearToken();
    setTok(null);

    const cleared = {
      user: null,
      profile: null,
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
    };

    setExtras(cleared); 
    localStorage.removeItem(LS_EXTRAS_KEY);
  };

  // -------------------------------------------------------------------------
  // Memoized Context Value
  // -------------------------------------------------------------------------
  const value = useMemo<Ctx>(
    () => ({
      token,
      user: extras.user,
      profile: extras.profile,
      organization_id: extras.organization_id,
      organization_name: extras.organization_name,
      organization_country_code:
        extras.organization_country_code,
      organization_currency:
        extras.organization_currency,
      organization_plan:
        extras.organization_plan,
      organization_logo_url:
        extras.organization_logo_url,
      organization_address:
        extras.organization_address,
      organization_email:
        extras.organization_email,
      assigned_organizations:
        extras.assigned_organizations,
      has_multiple_organizations:
        extras.has_multiple_organizations,
      login,
      logout,
      setOrganizationLogo,
    }),
    [token, extras]
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}
// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export const useAuth = () => useContext(AuthCtx);