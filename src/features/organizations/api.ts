import { api } from '../../lib/axios';

export type Organization = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  company_group_id?: string;
};

export type CreateOrganizationInput = Omit<
  Organization,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateOrganizationInput = Partial<
  Omit<Organization, 'id' | 'created_at' | 'updated_at'>
>;

export type OrganizationsResponse = {
  organizations: Organization[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = '/organization';

/** ---------------------------
 *  List Organizations
 * --------------------------- */
export async function listOrganizations(
  page: number,
  limit: number
): Promise<OrganizationsResponse> {
  const params: Record<string, any> = { page, limit };
  const { data } = await api.get(base, { params });

  if (data?.paginationMetaInfo) {
    return {
      organizations: data.organizations ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // fallback if backend returns raw array
  const all: Organization[] = Array.isArray(data)
    ? data
    : data?.organizations ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    organizations: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
}

/** ---------------------------
 *  CRUD API
 * --------------------------- */
export const organizationApi = {
  list: listOrganizations,

  get: async (orgId: string) => {
    const { data } = await api.get(`${base}/${orgId}`);
    return data as Organization;
  },

  create: async (input: CreateOrganizationInput) => {
    const { data } = await api.post(base, input);
    return data as Organization;
  },

  update: async (orgId: string, input: UpdateOrganizationInput) => {
    const { data } = await api.patch(`${base}/${orgId}`, input);
    return data as Organization;
  },

  remove: async (orgId: string) => {
    const { data } = await api.delete(`${base}/${orgId}`);
    return data as { message: string };
  },
};
