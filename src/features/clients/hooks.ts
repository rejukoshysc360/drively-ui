// src/client-companies/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientCompaniesApi, CreateClientCompanyInput, UpdateClientCompanyInput } from './api';
import { useAuth } from '../auth/AuthProvider';
import { parseApiError } from '../../utils/parseApiError';
import { emitApiError } from '../../lib/error-bus';

const keys = {
  list: (orgId: string, page: number, limit: number, search?: string) =>
    ['client-companies', orgId, page, limit, search ?? ''] as const,
  one: (orgId: string, id: string) =>
    ['client-companies', orgId, id] as const,
};

export function useClientCompanies(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.list(organization_id, page, limit, search) : ['client-companies', 'no-org'],
    queryFn: () => clientCompaniesApi.list(organization_id!, page, limit, search),
    enabled: !!organization_id,
  });
}

export function useClientCompany(companyId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, companyId) : ['client-companies', 'no-org', companyId],
    queryFn: () => clientCompaniesApi.get(organization_id!, companyId),
    enabled: !!organization_id && !!companyId,      // ✅ runs only when both exist
  });
}

export function useCreateClientCompany() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateClientCompanyInput) => clientCompaniesApi.create(organization_id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-companies', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateClientCompany(companyId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateClientCompanyInput) => clientCompaniesApi.update(organization_id!, companyId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-companies', organization_id] });
      qc.invalidateQueries({ queryKey: ['client-companies', organization_id, companyId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteClientCompany() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (companyId: string) => clientCompaniesApi.remove(organization_id!, companyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-companies', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
