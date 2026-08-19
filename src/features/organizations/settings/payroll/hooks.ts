import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollSettingsApi, PayrollSettings } from "./api";
import { useAuth } from "../../../auth/AuthProvider";
import { parseApiError } from "../../../../utils/parseApiError";
import { emitApiError } from "../../../../lib/error-bus";
import { emitSuccess } from "../../../../lib/success-bus";

const keys = {
  one: (orgId: string) => ["payroll-settings", orgId] as const,
};

export function usePayrollSettings() {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id) : ["payroll-settings", "no-org"],
    queryFn: () => payrollSettingsApi.get(organization_id!),
    enabled: !!organization_id,
  });
}

export function useUpsertPayrollSettings() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: Partial<PayrollSettings>) =>
      payrollSettingsApi.upsert(organization_id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-settings", organization_id] });
      emitSuccess({ message: "Payroll settings saved successfully!", type: "success" });  
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}