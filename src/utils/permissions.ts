// src/utils/permissions.ts
import { useAuth } from "../features/auth/AuthProvider";

export function useCan() {
  const { profile } = useAuth();

  const role = profile?.role;
  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
    ? [profile.roles]
    : [];

  const allSlugs = [role?.slug, ...roles.map((r: any) => r.slug)].filter(Boolean);

  const allPermissions: string[] = [
    ...(role?.permissions || []),
    ...roles.flatMap((r: any) => r.permissions || []),
  ];

  return (permission: string): boolean => {
    const [resource, action] = permission.split(":");
    const ownVariant = `${permission}_own_record_only`;
    const wildcard = `${resource}:*`;
 

    const admin = allSlugs.includes("admin");
    if (admin) {
      return true;
    }

    const hasExact = allPermissions.includes(permission);
    const hasOwn = allPermissions.includes(ownVariant);
    const hasWildcard = allPermissions.includes(wildcard);
    const hasStar = allPermissions.includes("*");

    // 🚫 Do NOT let _own_record_only imply full access
    const allowed = hasExact || hasWildcard || hasStar;

    if (!allowed) {
      // ✅ Only return true if the request *specifically asks for* the own variant
      if (permission.endsWith("_own_record_only")) {
        return hasOwn;
      }
      return false;
    }

    // ⚙️ Require view permission for update/delete actions
    if (["update", "delete"].includes(action)) {
      const mustHaveView =
        allPermissions.includes(`${resource}:view`) ||
        allPermissions.includes(`${resource}:view_own_record_only`);
      if (!mustHaveView) {
        return false;
      }
    }
    return true;
  };
}
