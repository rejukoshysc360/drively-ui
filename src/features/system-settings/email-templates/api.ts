import { api } from "../../../lib/axios";

export const emailTemplatesApi = {
  getStatus: async (organizationId: string) => {
    const { data } = await api.get(
      `/organization/${organizationId}/email-templates/status`,
    );

    return data;
  },

  installDefaults: async (organizationId: string) => {
    const { data } = await api.post(
      `/organization/${organizationId}/email-templates/install-defaults`,
    );

    return data;
  },

  getCatalog: async (organizationId: string) => {
    const { data } = await api.get(
      `/organization/${organizationId}/email-templates/catalog`,
    );

    return data;
  },

  installTemplate: async (
    organizationId: string,
    type: string,
    force = false,
  ) => {
    const { data } = await api.post(
      `/organization/${organizationId}/email-templates/install`,
      {
        type,
        force,
      },
    );

    return data;
  },
};
