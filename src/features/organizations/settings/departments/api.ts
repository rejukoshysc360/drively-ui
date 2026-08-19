import { api } from '../../../../lib/axios';

export type Department = {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateDepartmentInput = Omit<Department, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDepartmentInput = Partial<Omit<Department, 'organization_id' | 'created_at' | 'updated_at'>>;

export type DepartmentsResponse = {
  departments: Department[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/departments`;

export async function listDepartments(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<DepartmentsResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();

  // ✅ Handle cross-org (All Organizations) mode safely
  const endpoint =
    !orgId || orgId === '' || orgId === 'all'
      ? `/organization/all/departments`
      : `/organization/${orgId}/departments`;

  const { data } = await api.get(endpoint, { params });

  // ✅ Use backend pagination if provided
  if (data && data.paginationMetaInfo) {
    return {
      departments: data.departments ?? data.list ?? data.data ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // 🧩 Fallback for legacy array response
  const all: Department[] = Array.isArray(data)
    ? data
    : data?.departments ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    departments: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}


export const departmentsApi = {
  list: listDepartments,
  get: async (orgId: string, departmentId: string) => {
    const { data } = await api.get(`${base(orgId)}/${departmentId}`);
    return data as Department;
  },
  create: async (orgId: string, input: CreateDepartmentInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as Department;
  },
  update: async (orgId: string, departmentId: string, input: UpdateDepartmentInput) => {
    const { data } = await api.patch(`${base(orgId)}/${departmentId}`, input);
    return data as Department;
  },
  remove: async (orgId: string, departmentId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${departmentId}`);
    return data as { message: string };
  },
};
