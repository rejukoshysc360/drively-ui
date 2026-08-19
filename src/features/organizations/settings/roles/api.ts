import { api } from "../../../../lib/axios";

export type Role = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
};

export type CreateRoleInput = Omit<Role, "id" | "created_at" | "updated_at">;
export type UpdateRoleInput = Partial<Omit<Role, "organization_id" | "created_at" | "updated_at">>;

export type RolesResponse = {
  roles: Role[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/roles`;

export async function listRoles(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<RolesResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();

  const { data } = await api.get(base(orgId), { params });

  if (data && data.paginationMetaInfo) {
    return {
      roles: data.roles ?? data.list ?? data.data ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  const all: Role[] = Array.isArray(data) ? data : data?.roles ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    roles: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

export const rolesApi = {
  list: listRoles,
  get: async (orgId: string, roleId: string) => {
    const { data } = await api.get(`${base(orgId)}/${roleId}`);
    return data as Role;
  },
  create: async (orgId: string, input: CreateRoleInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as Role;
  },
  update: async (orgId: string, roleId: string, input: UpdateRoleInput) => {
    const { data } = await api.patch(`${base(orgId)}/${roleId}`, input);
    return data as Role;
  },
  remove: async (orgId: string, roleId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${roleId}`);
    return data as { message: string };
  },
};
