import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salaryApi, SalaryRecord } from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { emitApiError } from "../../../lib/error-bus";
import { parseApiError } from "../../../utils/parseApiError";

/**
 * Fetch salary/compensation history (optionally filtered by type_id)
 */
export function useSalaryHistory(employeeId: string, _: any, typeId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["salary_history", organization_id, employeeId, typeId || "all"],
    queryFn: () => salaryApi.list(organization_id!, employeeId, typeId),
    enabled: !!organization_id && !!employeeId,
  });
}

/**
 * Fetch currently active compensation record (UUID-based only)
 */
export function useCurrentSalary(employeeId: string, typeId: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["salary_current", organization_id, employeeId, typeId],
    queryFn: () => salaryApi.current(organization_id!, employeeId, typeId),
    enabled: !!organization_id && !!employeeId && !!typeId,
  });
}

/**
 * Add new compensation record
 */
export function useAddSalary(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async (
      input: Omit<
        SalaryRecord,
        "id" | "organization_id" | "employee_id" | "created_at"
      >
    ) => {
      const newRec = await salaryApi.add(organization_id!, employeeId, input);
      return newRec;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["salary_history", organization_id, employeeId],
      });
      qc.invalidateQueries({
        queryKey: ["salary_current", organization_id, employeeId],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * Update existing compensation record
 */
export function useUpdateSalary(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: ({
      salaryId,
      input,
    }: {
      salaryId: string;
      input: Partial<SalaryRecord>;
    }) => salaryApi.update(organization_id!, employeeId, salaryId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["salary_history", organization_id, employeeId],
      });
      qc.invalidateQueries({
        queryKey: ["salary_current", organization_id, employeeId],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * Delete compensation record
 */
export function useDeleteSalary(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (salaryId: string) =>
      salaryApi.remove(organization_id!, employeeId, salaryId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["salary_history", organization_id, employeeId],
      });
      qc.invalidateQueries({
        queryKey: ["salary_current", organization_id, employeeId],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
