// src/features/employee-groups/api.ts
import { api } from "../../../lib/axios";

export type EmployeeGroup = {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  employee_ids: string[]; // can be replaced later with relational table
  created_at?: string;
  updated_at?: string;
};

export type CreateEmployeeGroupInput = Omit<
  EmployeeGroup,
  "id" | "created_at" | "updated_at"
>;

export type UpdateEmployeeGroupInput = Partial<
  Omit<EmployeeGroup, "organization_id" | "created_at" | "updated_at">
>;

export type EmployeeGroupsResponse = {
  groups: EmployeeGroup[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) =>
  `/organization/${orgId}/hr-management/employee-groups`;

/** ✅ List groups */
export async function listEmployeeGroups(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<EmployeeGroupsResponse> {
  const params: Record<string, any> = { page, limit };
  if (search?.trim()) params.search = search.trim();

  const { data } = await api.get(base(orgId), { params });

  if (data?.paginationMetaInfo) {
    return {
      groups: data.groups ?? data.data ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // fallback
  const all = Array.isArray(data) ? data : data?.groups ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    groups: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.ceil(all.length / limit) || 1,
      currentPage: page,
      limit,
    },
  };
}

export const employeeGroupsApi = {
  list: listEmployeeGroups,

  get: async (orgId: string, groupId: string) => {
    const { data } = await api.get(`${base(orgId)}/${groupId}`);
    return data as EmployeeGroup;
  },

  create: async (orgId: string, input: CreateEmployeeGroupInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as EmployeeGroup;
  },

  update: async (
    orgId: string,
    groupId: string,
    input: UpdateEmployeeGroupInput
  ) => {
    const { data } = await api.patch(
      `${base(orgId)}/${groupId}`,
      input
    );
    return data as EmployeeGroup;
  },

  remove: async (orgId: string, groupId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${groupId}`);
    return data as { message: string };
  },
};