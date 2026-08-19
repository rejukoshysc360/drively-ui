import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complianceAuditsApi } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { emitSuccess } from "../../lib/success-bus";
import { parseApiError } from "../../utils/parseApiError";

/* -----------------------------
   REACT QUERY KEYS
----------------------------- */
const keys = {
  list: (
    orgId: string,
    page: number,
    limit: number,
    search: string,
    status: string,
    employeeId?: string
  ) => ["compliance-audits", orgId, page, limit, search, status, employeeId ?? ""] as const,
  one: (orgId: string, id: string) => ["compliance-audit", orgId, id] as const,
};

/* -----------------------------
   LIST HOOK (Supports Search + Filter + Employee)
----------------------------- */
export function useComplianceAudits(
  page: number,
  limit: number,
  search: string = "",
  status: string = "all",
  employeeId?: string // ✅ optional for employee dashboard
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: keys.list(organization_id!, page, limit, search, status, employeeId),
    queryFn: () =>
      complianceAuditsApi.list(
        organization_id!,
        page,
        limit,
        search?.trim(),
        status,
        employeeId // ✅ correctly passed to backend as employee_id
      ),
    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

/* -----------------------------
   CREATE HOOK
----------------------------- */
export function useCreateComplianceAudit(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: any) => complianceAuditsApi.create(organization_id!, employeeId, input),

    onSuccess: () => {
      emitSuccess({ message: "Compliance record added!", type: "success" });
      qc.invalidateQueries({ queryKey: ["compliance-audits", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* -----------------------------
   DELETE HOOK
----------------------------- */
export function useDeleteComplianceAudit() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (id: string) => complianceAuditsApi.remove(organization_id!, id),

    onSuccess: () => {
      emitSuccess({ message: "Record deleted!", type: "success" });
      qc.invalidateQueries({ queryKey: ["compliance-audits", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}
