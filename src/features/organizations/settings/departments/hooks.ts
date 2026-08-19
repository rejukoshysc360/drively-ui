import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, CreateDepartmentInput, UpdateDepartmentInput } from './api';
import { useAuth } from '../../../auth/AuthProvider';
import { parseApiError } from '../../../../utils/parseApiError';
import { emitApiError } from '../../../../lib/error-bus';

const keys = {
  list: (orgId: string, page: number, limit: number, search?: string) =>
    ['departments', orgId, page, limit, search ?? ''] as const,
  one: (orgId: string, id: string) => ['departments', orgId, id] as const,
};

export function useDepartments(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.list(organization_id, page, limit, search) : ['departments', 'no-org'],
    queryFn: () => departmentsApi.list(organization_id!, page, limit, search),
    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

/**
 * 🔹 Fetch departments for a specific organization (used in Active Directory filter)
 * Works even if the logged-in user belongs to a different org.
 */
/**
 * 🔹 Fetch departments for a specific organization
 * If `organizationId` is "all" or empty, fetch all departments across orgs.
 */
export function useDepartmentsByOrgId(
  organizationId?: string,
  page = 1,
  limit = 1000,
  search?: string
) {
  return useQuery({
    queryKey: ['departments', 'by-org', organizationId ?? 'all', page, limit, search ?? ''],
    queryFn: async () => {
      const orgParam = organizationId && organizationId !== '' && organizationId !== 'all'
        ? organizationId
        : 'all';

      // ✅ If "all", call the cross-org departments endpoint
      return departmentsApi.list(orgParam, page, limit, search);
    },
    enabled: true, // always enabled, because "all" is a valid mode
  });
}



export function useDepartment(departmentId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, departmentId) : ['department', 'no-org', departmentId],
    queryFn: () => departmentsApi.get(organization_id!, departmentId),
    enabled: !!organization_id && !!departmentId,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => departmentsApi.create(organization_id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateDepartment(departmentId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateDepartmentInput) => departmentsApi.update(organization_id!, departmentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', organization_id] });
      qc.invalidateQueries({ queryKey: ['departments', organization_id, departmentId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (departmentId: string) => departmentsApi.remove(organization_id!, departmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
