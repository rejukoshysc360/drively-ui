// src/features/organizations/api.ts

import { api } from "../../lib/axios";

export const organizationApi = {
  getPhoto: async (orgId: string): Promise<string | null> => { 
    const { data } = await api.get(
      `/organization/${orgId}/photo/download`
    );
    return data?.url || null;
  },
};