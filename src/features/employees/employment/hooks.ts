// src/employment/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeeEmploymentApi,
  CreateEmployeeEmploymentInput,
  UpdateEmployeeEmploymentInput,
} from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { parseApiError } from "../../../utils/parseApiError";
import { emitApiError } from "../../../lib/error-bus";

const keys = {
  one: (orgId: string, employeeId: string) =>
    ["employeeEmployment", orgId, employeeId] as const,
};

/**
 * Fetch single employee's employment info
 */
export function useEmployeeEmployment(employeeId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, employeeId)
      : ["employeeEmployment", "no-org", employeeId],
    queryFn: () => employeeEmploymentApi.get(organization_id!, employeeId),
    enabled: !!organization_id && !!employeeId,
  });
}

/**
 * Create employment info for an employee
 */
export function useCreateEmployeeEmployment(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateEmployeeEmploymentInput) =>
      employeeEmploymentApi.create(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, employeeId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * Update employment info
 */
export function useUpdateEmployeeEmployment(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateEmployeeEmploymentInput) =>
      employeeEmploymentApi.update(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, employeeId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}


/**
 * Delete employment info
 */
export function useDeleteEmployeeEmployment(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: () =>
      employeeEmploymentApi.remove(organization_id!, employeeId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, employeeId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

