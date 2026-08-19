import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, CreateCategoryInput, UpdateCategoryInput } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { parseApiError } from '../../../utils/parseApiError';
import { emitApiError } from '../../../lib/error-bus';

const keys = {
  list: (orgId: string, page: number, limit: number, search?: string) =>
    ['salary_categories', orgId, page, limit, search ?? ''] as const,
  one: (orgId: string, id: string) =>
    ['salary_categories', orgId, id] as const,
};

export function useCategories(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();
  return useQuery({
  queryKey: organization_id
    ? keys.list(organization_id, page, limit, search)
    : ['salary_categories', 'no-org'],
  queryFn: () =>
    categoriesApi.list(organization_id!, page, limit, search),
  enabled: !!organization_id,
});
}

export function useCategory(categoryId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, categoryId)
      : ['salary_category', 'no-org', categoryId],
    queryFn: () => categoriesApi.get(organization_id!, categoryId),
    enabled: !!organization_id && !!categoryId,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      categoriesApi.create(organization_id!, input),
   onSuccess: async () => {
  await qc.invalidateQueries({
    queryKey: ['salary_categories', organization_id],
  });

  await qc.refetchQueries({
    queryKey: ['salary_categories', organization_id],
    type: "active",
  });
},
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateCategory(categoryId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateCategoryInput) =>
      categoriesApi.update(organization_id!, categoryId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_categories', organization_id] });
      qc.invalidateQueries({
        queryKey: ['salary_categories', organization_id, categoryId],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.remove(organization_id!, categoryId),
   onSuccess: async () => {
  await qc.invalidateQueries({
    queryKey: ['salary_categories', organization_id],
  });

  await qc.refetchQueries({
    queryKey: ['salary_categories', organization_id],
    type: "active",
  });
},
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
