import { api } from '../../../lib/axios';

export type SalaryCategory = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  polarity: number; 
  component_count: number;
  created_at?: string;
  updated_at?: string;
}; 

export type CreateCategoryInput = Omit<
  SalaryCategory,
  'id' | 'created_at' | 'updated_at' | 'component_count'
>;
export type UpdateCategoryInput = Partial<
  Omit<SalaryCategory, 'id' | 'created_at' | 'updated_at' | 'component_count'>
>;

export type CategoriesResponse = {
  categories: SalaryCategory[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) =>
  `/organization/${orgId}/payroll/categories`;

export async function listCategories(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<CategoriesResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();

  const { data } = await api.get(base(orgId), { params });

  if (data && data.paginationMetaInfo && Array.isArray(data.categories)) {
    return data as CategoriesResponse;
  }

  const all: SalaryCategory[] = Array.isArray(data)
    ? data
    : (data?.categories ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    categories: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

export const categoriesApi = {
  list: listCategories,

  get: async (orgId: string, categoryId: string) => {
    const { data } = await api.get(`${base(orgId)}/${categoryId}`);
    return data as SalaryCategory;
  },

  create: async (orgId: string, input: CreateCategoryInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as SalaryCategory;
  },

  update: async (
    orgId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ) => {
    const { data } = await api.patch(`${base(orgId)}/${categoryId}`, input);
    return data as SalaryCategory;
  },

  remove: async (orgId: string, categoryId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${categoryId}`);
    return data as { message: string };
  },
};
