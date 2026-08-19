import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi, CreateOrganizationInput, UpdateOrganizationInput } from './api';
import { useAuth } from '../auth/AuthProvider';
import { parseApiError } from '../../utils/parseApiError';
import { emitApiError } from '../../lib/error-bus';

const keys = {
  list: (page: number, limit: number) => ['organizations', page, limit] as const,
  one: (orgId: string) => ['organization', orgId] as const,
};

/** ---------------------------
 *  Get Organizations (paginated)
 * --------------------------- */
export function useOrganizations(page: number, limit: number) {
  return useQuery({
    queryKey: keys.list(page, limit),
    queryFn: () => organizationApi.list(page, limit),
  });
}

/** ---------------------------
 *  Get Single Organization
 * --------------------------- */
export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: keys.one(orgId),
    queryFn: () => organizationApi.get(orgId),
    enabled: !!orgId,
  });
}

/** ---------------------------
 *  Create Organization
 * --------------------------- */
export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => organizationApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Update Organization
 * --------------------------- */
export function useUpdateOrganization(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => organizationApi.update(orgId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      qc.invalidateQueries({ queryKey: ['organization', orgId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Delete Organization
 * --------------------------- */
export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => organizationApi.remove(orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
