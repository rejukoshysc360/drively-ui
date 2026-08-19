// src/hooks/useRoles.ts

import { useAuth } from "../features/auth/useAuth";

interface Role {
  slug: string;
  name?: string;
  permissions?: string[];
}

export function useRoles() {
  const { profile } = useAuth();

  const roles: Role[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
      ? [profile.roles]
      : [];

  const slugs = roles.map((r) => r?.slug).filter(Boolean) as string[];

  // =====================================================
  // SUPER ADMIN
  // =====================================================

  const isSuperAdmin = slugs.includes("superadmin");

  // =====================================================
  // STANDARD ROLES
  // =====================================================

  const isAdmin = !isSuperAdmin && slugs.includes("admin");

  const isHR = !isSuperAdmin && slugs.includes("hr");

  const isManager =
    !isSuperAdmin && !isAdmin && !isHR && slugs.includes("manager");

  const isEmployeeOnly =
    !isSuperAdmin && !isAdmin && !isHR && !isManager && slugs.includes("emp");

  // =====================================================
  // HELPERS
  // =====================================================

  const hasRole = (slug: string) => slugs.includes(slug);

  const hasAnyRole = (slugsToCheck: string[]) =>
    slugsToCheck.some((slug) => slugs.includes(slug));

  return {
    isSuperAdmin,

    isAdmin,
    isHR,
    isManager,
    isEmployeeOnly,

    roles,
    slugs,

    hasRole,
    hasAnyRole,
  };
}
