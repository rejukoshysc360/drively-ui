import { api } from "../../lib/axios";

export type OrganizationRow = {
  id: string;
  name: string;
  plan: string;
  subscription_status: string;
  country_code: string;
  currency: string;
  subscription_end_date?: string | null;
  created_at: string;
};

export const superAdminOrganizationsApi = {
  list: async (
    page: number,
    limit: number,
    search?: string
  ) => {
    const { data } = await api.get(
      "/super-admin/organizations",
      {
        params: {
          page,
          limit,
          search,
        },
      }
    );

    return data;
  },
  updateFreeOrganizationStatus: async (
  organizationId: string,
  status: "active" | "paused",
) => {
  const { data } = await api.patch(
    `/subscription/free/${organizationId}/status`,
    { status }
  );

  return data;
},
deleteOrganization: async (
  organizationId: string
) => {
  const { data } = await api.delete(
    `/subscription/organization/${organizationId}`
  );

  return data;
},
};