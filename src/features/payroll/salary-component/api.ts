import { api } from '../../../lib/axios';

export type SalaryComponent = {
  id: string;
  category_id: string;
  code: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  amount_type: 'FIXED' | 'PERCENTAGE'; // example field
  amount_value: number;
  created_at?: string;
  updated_at?: string;

  // 👇 include rules if returned by backend
  rules?: SalaryComponentRule[];
};

export type SalaryComponentRule = {
  id: string;
  component_id: string;
  organization_id: string;
  rule_type: 'FIXED_AMOUNT' | 'PERCENT_OF_COMPONENT' | 'FORMULA';
  fixed_amount?: number | null;
  percent_rate?: number | null;
  percent_reference_component_id?: string | null;
  formula?: string | null;
  rounding_mode?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateComponentInput = Omit<
  SalaryComponent,
  'id' | 'created_at' | 'updated_at' | 'rules'
>;

export type UpdateComponentInput = Partial<CreateComponentInput>;

export type ComponentsResponse = {
  components: SalaryComponent[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

// ✅ API base — backend expects category as query param
const base = (orgId: string) => `/organization/${orgId}/payroll/components`;
const rulesBase = (orgId: string) => `/organization/${orgId}/payroll/rules`;

/**
 * Components API
 */
export async function listComponents(
  orgId: string,
  categoryId: string,
  page: number,
  limit: number,
  search?: string
): Promise<ComponentsResponse> {
  const params: Record<string, any> = { page, limit, category_id: categoryId };
  if (search && search.trim()) params.search = search.trim();

  const { data } = await api.get(base(orgId), { params });

  if (data && data.paginationMetaInfo && Array.isArray(data.components)) {
    return data as ComponentsResponse;
  }

  // fallback (non-paginated response)
  const all: SalaryComponent[] = Array.isArray(data)
    ? data
    : (data?.components ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    components: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

export const componentsApi = {
  list: listComponents,

  listAll: async (orgId: string): Promise<SalaryComponent[]> => {
    const { data } = await api.get(`/organization/${orgId}/payroll/components`);
    return data?.components ?? [];
  },

  get: async (orgId: string, componentId: string) => {
    const { data } = await api.get(`${base(orgId)}/${componentId}`);
    return data as SalaryComponent;
  },

  create: async (orgId: string, input: CreateComponentInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as SalaryComponent;
  },

  update: async (
    orgId: string,
    componentId: string,
    input: UpdateComponentInput
  ) => {
    const { data } = await api.patch(`${base(orgId)}/${componentId}`, input);
    return data as SalaryComponent;
  },

  remove: async (orgId: string, componentId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${componentId}`);
    return data as { message: string };
  },

  /**
   * ✅ Reorder components by display_order (for drag-and-drop)
   * Expects items: [{ id, display_order }]
   */
reorder: async (
  orgId: string,
  payload: { category_id: string; items: { id: string; display_order: number }[] }
) => {
  const { data } = await api.patch(
    `/organization/${orgId}/payroll/components/reorder`,
    payload
  );
  return data;
},

};

/**
 * Rules API
 */
export type UpdateRuleInput = Partial<
  Omit<SalaryComponentRule, 'id' | 'component_id' | 'organization_id'>
>;

export const rulesApi = {
  update: async (orgId: string, ruleId: string, input: UpdateRuleInput) => {
    const { data } = await api.patch(`${rulesBase(orgId)}/${ruleId}`, input);
    return data as SalaryComponentRule;
  },

  remove: async (orgId: string, ruleId: string) => {
    const { data } = await api.delete(`${rulesBase(orgId)}/${ruleId}`);
    return data as { message: string };
  },
};
