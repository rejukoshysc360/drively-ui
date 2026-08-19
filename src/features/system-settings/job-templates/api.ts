import { api } from "../../../lib/axios";

export const jobTemplatesApi = {
  getStatus: async (
    organizationId: string
  ) => {
    const { data } = await api.get(
      `/organization/${organizationId}/job-templates/status`
    );

    return data;
  },

  installDefaults: async (
    organizationId: string
  ) => {
    const { data } = await api.post(
      `/organization/${organizationId}/job-templates/install-defaults`
    );

    return data;
  },

  getCatalog: async (
    organizationId: string
  ) => {
    const { data } = await api.get(
      `/organization/${organizationId}/job-templates/catalog`
    );

    return data;
  },

  installTemplate: async (
    organizationId: string,
    job_name: string,
    force = false
  ) => {
    if (force) {
      const { data } = await api.post(
        `/organization/${organizationId}/job-templates/${job_name}/force-install`
      );

      return data;
    }

    const { data } = await api.post(
      `/organization/${organizationId}/job-templates/install`,
      {
        job_name,
        force,
      }
    );

    return data;
  },
};