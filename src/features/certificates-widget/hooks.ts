import { useQuery } from "@tanstack/react-query";
import { certificateRequestsApi } from "./api";
import { useAuth } from "../auth/AuthProvider";

/* -----------------------------
   REACT QUERY KEYS
----------------------------- */
const keys = {
  recent: (orgId: string) => ["certificate-requests", orgId, "recent"] as const,
  salary: (orgId: string, page: number, limit: number, status: string) =>
    ["salary-certificate-requests", orgId, page, limit, status] as const,
  joining: (orgId: string, page: number, limit: number, status: string) =>
    ["joining-certificate-requests", orgId, page, limit, status] as const,
};

/* -----------------------------
   HOOK: Fetch recent certificate requests (last 7 days)
----------------------------- */
export function useRecentCertificateRequests() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id ? keys.recent(organization_id) : [],
    queryFn: async () => {
      if (!organization_id) throw new Error("Missing organization ID");
      return certificateRequestsApi.listRecentRequests(organization_id);
    },
    enabled: !!organization_id, // only run if logged in + orgId exists
    staleTime: 1000 * 60 * 5, // cache for 5 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/* -----------------------------
   HOOK: Paginated Salary Certificate Requests
----------------------------- */
export function useSalaryCertificateRequests(
  page: number,
  limit: number,
  status: string = "requested"
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id ? keys.salary(organization_id, page, limit, status) : [],
    queryFn: async () => {
      if (!organization_id) throw new Error("Missing organization ID");
      return certificateRequestsApi.listSalaryCertificates(organization_id, page, limit, status);
    },
    enabled: !!organization_id,
    staleTime: 1000 * 60 * 5,
  });
}

/* -----------------------------
   HOOK: Paginated Joining Certificate Requests
----------------------------- */
export function useJoiningCertificateRequests(
  page: number,
  limit: number,
  status: string = "requested"
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id ? keys.joining(organization_id, page, limit, status) : [],
    queryFn: async () => {
      if (!organization_id) throw new Error("Missing organization ID");
      return certificateRequestsApi.listJoiningCertificates(organization_id, page, limit, status);
    },
    enabled: !!organization_id,
    staleTime: 1000 * 60 * 5,
  });
}
