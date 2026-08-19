// src/features/organization/departments/designations/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  designationsApi,
  CreateDesignationInput,
  UpdateDesignationInput,
} from './api';
import { useAuth } from '../../../auth/AuthProvider';
import { parseApiError } from '../../../../utils/parseApiError';
import { emitApiError } from '../../../../lib/error-bus';

const keys = {
  list: (deptId: string, page: number, limit: number, search?: string) =>
    ['designations', deptId, page, limit, search ?? ''] as const,
  one: (deptId: string, id: string) => ['designations', deptId, id] as const,
};

export function useDesignations(
  deptId: string,
  page: number,
  limit: number,
  search?: string
) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.list(deptId, page, limit, search)
      : ['designations', 'no-org'],
    queryFn: () =>
      designationsApi.list(organization_id!, deptId, page, limit, search),
    enabled: !!organization_id && !!deptId,
    keepPreviousData: true,
  });
}

/**
 * 🔹 Fetch designations by organization & department (for Active Directory filters)
 * Works even if the logged-in user is from another organization.
 */
export function useDesignationsByOrgId(
  organizationId?: string,
  departmentId?: string,
  page = 1,
  limit = 1000,
  search?: string
) {
  const orgParam = organizationId && organizationId !== '' ? organizationId : 'all';

  return useQuery({
    queryKey: ['designations', 'by-org', orgParam, departmentId ?? '', page, limit, search ?? ''],
    queryFn: () => designationsApi.list(orgParam, departmentId ?? '', page, limit, search),
    // ✅ Fetch whenever a department is selected (even if org = all)
    enabled: !!departmentId,
    keepPreviousData: true,
  });
}



export function useDesignation(deptId: string, designationId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(deptId, designationId)
      : ['designations', 'no-org', designationId],
    queryFn: () =>
      designationsApi.get(organization_id!, deptId, designationId),
    enabled: !!organization_id && !!deptId && !!designationId,
  });
}

export function useCreateDesignation(deptId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateDesignationInput) =>
      designationsApi.create(organization_id!, deptId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations', deptId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateDesignation(deptId: string, designationId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateDesignationInput) =>
      designationsApi.update(organization_id!, deptId, designationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations', deptId] });
      qc.invalidateQueries({
        queryKey: ['designations', deptId, designationId],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteDesignation(deptId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (designationId: string) =>
      designationsApi.remove(organization_id!, deptId, designationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations', deptId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
