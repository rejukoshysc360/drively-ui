// src/client-companies/api.ts
import { api } from '../../lib/axios';

export type ClientCompany = {
  address: string;
  id: string;
  organization_id: string;
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  billing_currency?: string | null; // e.g., "USD"
  tax_identifier?:string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateClientCompanyInput = Omit<ClientCompany, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClientCompanyInput = Partial<Omit<ClientCompany, 'organization_id' | 'created_at' | 'updated_at'>>;

export type ClientCompaniesResponse = {
  client_companies: ClientCompany[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/hr-management/client-companies`;

export async function listClientCompanies(orgId: string, page: number, limit: number, search?: string): Promise<ClientCompaniesResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();
  const { data } = await api.get(base(orgId), { params });

  if (data && data.paginationMetaInfo) {
    const rows = data.client_companies ?? data.list ?? data.data ?? [];
    return { client_companies: rows, paginationMetaInfo: data.paginationMetaInfo };
  }

  const all: ClientCompany[] = Array.isArray(data) ? data : (data?.client_companies ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    client_companies: paged,
    paginationMetaInfo: { totalCount, totalPages, currentPage: page, limit },
  };
}

function normalizeOne(data: any): ClientCompany {
  // handles: {client_company: {...}}, {...}, or {client_companies: [{...}]}
  const maybe =
    data?.client_company ??
    (Array.isArray(data?.client_companies) ? data.client_companies[0] : undefined) ??
    data;
  return maybe as ClientCompany;
}

export const clientCompaniesApi = {
  list: listClientCompanies,
  get: async (orgId: string, companyId: string) => {
    const { data } = await api.get(`${base(orgId)}/${companyId}`);
    return normalizeOne(data);
  },
  create: async (orgId: string, input: CreateClientCompanyInput) => {
    const { data } = await api.post(base(orgId), input);
    return normalizeOne(data);
  },
  update: async (orgId: string, companyId: string, input: UpdateClientCompanyInput) => {
    const { data } = await api.put(`${base(orgId)}/${companyId}`, input);
    return normalizeOne(data);
  },
  remove: async (orgId: string, companyId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${companyId}`);
    return data as { message: string };
  },
};
