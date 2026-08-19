// src/features/organizations/settings/leave-policy/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leavePoliciesApi, CreateLeavePolicyInput, UpdateLeavePolicyInput } from './api';
import { useAuth } from '../../../auth/AuthProvider';
import { parseApiError } from '../../../../utils/parseApiError';
import { emitApiError } from '../../../../lib/error-bus';

const keys = {
  list: (orgId: string, page: number, limit: number, employeeId?: string) =>
    ['leave-policies', orgId, page, limit, employeeId ?? ''] as const,
  one: (orgId: string, id: string) => ['leave-policy', orgId, id] as const,
};

/**
 * ✅ Updated hook: allows optional `employeeId`
 * If provided, backend will use that employee’s org instead of the current org.
 */
export function useLeavePolicies(page: number, limit: number, employeeId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? keys.list(organization_id, page, limit, employeeId)
      : ['leave-policies', 'no-org'],
    queryFn: () => leavePoliciesApi.list(organization_id!, page, limit, employeeId),
    enabled: !!organization_id
  });
}

export function useLeavePolicy(policyId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, policyId)
      : ['leave-policy', 'no-org', policyId],
    queryFn: () => leavePoliciesApi.get(organization_id!, policyId),
    enabled: !!organization_id && !!policyId,
  });
}

export function useCreateLeavePolicy() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateLeavePolicyInput) =>
      leavePoliciesApi.create(organization_id!, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['leave-policies', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateLeavePolicy(policyId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateLeavePolicyInput) =>
      leavePoliciesApi.update(organization_id!, policyId, input),
   onSuccess: async () => {
  await qc.invalidateQueries({
    queryKey: ['leave-policies', organization_id],
  });

  await qc.invalidateQueries({
    queryKey: ['leave-policy', organization_id, policyId],
  });
},
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteLeavePolicy() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (policyId: string) => leavePoliciesApi.remove(organization_id!, policyId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['leave-policies', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
