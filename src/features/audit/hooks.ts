import { useQuery } from "@tanstack/react-query";
import { auditApi } from "./api";
import { useAuth } from "../auth/AuthProvider";

/* ---------------------------------------------
   Get paginated audit logs
---------------------------------------------- */
export function useAuditLogs(filters: any) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["audit_logs", organization_id, filters],
    queryFn: () => auditApi.list(organization_id!, filters),
    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

/* ---------------------------------------------
   Get a single audit log by ID
---------------------------------------------- */
export function useAuditLog(id?: string | null) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["audit_log_one", organization_id, id],
    queryFn: () => auditApi.getOne(organization_id!, id!),
    enabled: !!organization_id && !!id,
  });
}

/* ---------------------------------------------
   NEW: Fetch DISTINCT table names for dropdown
---------------------------------------------- */
export function useAuditTables() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["audit_tables", organization_id],
    queryFn: () => auditApi.getTables(organization_id!),
    enabled: !!organization_id,
    staleTime: 60_000 * 10, // cache 10 mins
  });
}
