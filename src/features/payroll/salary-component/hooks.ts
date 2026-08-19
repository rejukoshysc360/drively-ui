import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  componentsApi,
  CreateComponentInput,
  UpdateComponentInput,
  rulesApi,
  UpdateRuleInput,
  SalaryComponentRule,
} from './api';
import { useAuth } from '../../auth/AuthProvider';
import { parseApiError } from '../../../utils/parseApiError';
import { emitApiError } from '../../../lib/error-bus';

const keys = {
  list: (
    orgId: string,
    categoryId: string,
    page: number,
    limit: number,
    search?: string
  ) =>
    ['salary_components', orgId, categoryId, page, limit, search ?? ''] as const,
  one: (orgId: string, id: string) =>
    ['salary_component', orgId, id] as const,
};

/**
 * Components by category
 */
export function useComponentsByCategory(
  categoryId: string,
  page: number,
  limit: number,
  search?: string
) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.list(organization_id, categoryId, page, limit, search)
      : ['salary_components', 'no-org'],
    queryFn: () =>
      componentsApi.list(organization_id!, categoryId, page, limit, search),
    enabled: !!organization_id && !!categoryId,
    keepPreviousData: true,
  });
}

/**
 * Single component (with rules)
 */
export function useComponent(
  componentId: string,
  opts?: { enabled?: boolean }
) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, componentId)
      : ['salary_component', 'no-org', componentId],
    queryFn: () => componentsApi.get(organization_id!, componentId),
    enabled: !!organization_id && !!componentId && (opts?.enabled ?? true),
  });
}

/**
 * Create component
 */
export function useCreateComponent() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateComponentInput) =>
      componentsApi.create(organization_id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_components', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * Update component definition
 */
export function useUpdateComponent(componentId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateComponentInput) =>
      componentsApi.update(organization_id!, componentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_components', organization_id] });
      qc.invalidateQueries({
        queryKey: ['salary_component', organization_id, componentId],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * All components (for dropdowns / formulas)
 */
export function useAllComponents() {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ['salary_components_all', organization_id],
    queryFn: () => componentsApi.listAll(organization_id!),
    enabled: !!organization_id,
  });
}

/**
 * Update single rule
 */
export function useUpdateRule() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      ruleId,
      payload,
    }: {
      ruleId: string;
      payload: UpdateRuleInput;
    }) => {
      return rulesApi.update(organization_id!, ruleId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_components', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * Create single rule (needed when editing a component that didn’t have a rule yet)
 */
export function useCreateRule() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      componentId,
      payload,
    }: {
      componentId: string;
      payload: Omit<SalaryComponentRule, 'id' | 'component_id' | 'organization_id'>;
    }) => {
      // backend expects component_id + org id along with payload
      return rulesApi.create(organization_id!, componentId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_components', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * Delete component
 */
export function useDeleteComponent() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (componentId: string) =>
      componentsApi.remove(organization_id!, componentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_components', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * ✅ Update display_order of components (for drag-and-drop reordering)
 */
/**
 * ✅ Update display_order of components (for drag-and-drop reordering)
 */
/**
 * ✅ Update display_order of components (for drag-and-drop reordering)
 */
export function useUpdateComponentOrder() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      category_id,
      items,
    }: {
      category_id: string;
      items: { id: string; display_order: number }[];
    }) => {
      // ✅ pass both category_id and items in one payload
      return componentsApi.reorder(organization_id!, { category_id, items });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary_components', organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}


