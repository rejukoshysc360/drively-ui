import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeAccountsApi,
  CreateEmployeeAccountInput,
  UpdateEmployeeAccountInput,
} from './api';
import { useAuth } from '../../auth/AuthProvider';
import { parseApiError } from '../../../utils/parseApiError';
import { emitApiError } from '../../../lib/error-bus';

const keys = {
  list: (orgId: string, employeeId: string) =>
    ['employee-accounts', orgId, employeeId] as const,
  one: (orgId: string, employeeId: string, accountId: string) =>
    ['employee-accounts', orgId, employeeId, accountId] as const,
};

export function useEmployeeAccounts(employeeId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.list(organization_id, employeeId)
      : ['employee-accounts', 'no-org', employeeId],
    queryFn: () => employeeAccountsApi.list(organization_id!, employeeId),
    enabled: !!organization_id && !!employeeId,
  });
}

export function useCreateEmployeeAccount(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: CreateEmployeeAccountInput) =>
      employeeAccountsApi.create(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, employeeId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateEmployeeAccount(employeeId: string, accountId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateEmployeeAccountInput) =>
      employeeAccountsApi.update(organization_id!, employeeId, accountId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, employeeId) });
      qc.invalidateQueries({ queryKey: keys.one(organization_id!, employeeId, accountId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteEmployeeAccount(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (accountId: string) =>
      employeeAccountsApi.remove(organization_id!, employeeId, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, employeeId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
