// src/features/organization/departments/designations/api.ts
import { api } from '../../../../lib/axios';

export type Designation = {
  id: string;
  department_id: string;
  organization_id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateDesignationInput = Omit<
  Designation,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdateDesignationInput = Partial<
  Omit<Designation, 'organization_id' | 'created_at' | 'updated_at'>
>;

export type DesignationsResponse = {
  designations: Designation[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string, deptId: string) =>
  `/organization/${orgId}/departments/${deptId}/designations`;

export async function listDesignations(
  orgId: string,
  deptId: string,
  page: number,
  limit: number,
  search?: string
): Promise<DesignationsResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();

  // 🧩 Support “All Organizations” mode:
  // If orgId === 'all' → fetch directly by department ID only
const endpoint =
  !orgId || orgId === '' || orgId === 'all'
    ? `/organization/all/departments/${deptId}/designations`
    : `/organization/${orgId}/departments/${deptId}/designations`;


  const { data } = await api.get(endpoint, { params });

  // ✅ Prefer backend pagination
  if (data && data.paginationMetaInfo) {
    return {
      designations: data.designations ?? data.list ?? data.data ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // 🧩 Fallback for array responses
  const all: Designation[] = Array.isArray(data)
    ? data
    : data?.designations ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    designations: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

export const designationsApi = {
  list: listDesignations,
  get: async (orgId: string, deptId: string, designationId: string) => {
    const { data } = await api.get(`${base(orgId, deptId)}/${designationId}`);
    return data as Designation;
  },
  create: async (orgId: string, deptId: string, input: CreateDesignationInput) => {
    const { data } = await api.post(base(orgId, deptId), input);
    return data as Designation;
  },
  update: async (
    orgId: string,
    deptId: string,
    designationId: string,
    input: UpdateDesignationInput
  ) => {
    const { data } = await api.patch(
      `${base(orgId, deptId)}/${designationId}`,
      input
    );
    return data as Designation;
  },
  remove: async (orgId: string, deptId: string, designationId: string) => {
    const { data } = await api.delete(
      `${base(orgId, deptId)}/${designationId}`
    );
    return data as { message: string };
  },
};
