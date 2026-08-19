import { api } from "../../../lib/axios";

export const systemBackupsApi = {
  // List all defined backup jobs
  list: async (orgId: string) => {
    const { data } = await api.get(`/organization/${orgId}/backups`);
    return data;
  },

  // Update (change cron expression)
  update: async ({
    orgId,
    key,
    schedule,
  }: {
    orgId: string;
    key: string;
    schedule: string;
  }) => {
    const { data } = await api.patch(`/organization/${orgId}/backups/${key}`, {
      cron_expression: schedule,
      is_active: true,
    });
    return data;
  },

  // Enable / disable backup job
  toggle: async ({
    orgId,
    key,
    is_active,
  }: {
    orgId: string;
    key: string;
    is_active: boolean;
  }) => {
    const { data } = await api.patch(
      `/organization/${orgId}/backups/${key}/toggle`,
      { is_active }
    );
    return data;
  },

  // Run a backup manually
  run: async ({
    orgId,
    key,
    runDate,
  }: {
    orgId: string;
    key: string;
    runDate?: string;
  }) => {
    const { data } = await api.post(
      `/organization/${orgId}/backups/${key}/run`,
      { runDate }
    );
    return data;
  },

  // Fetch backup history (executions)
  history: async (
    orgId: string,
    params: { page?: number; limit?: number; job_name?: string; executed_at?: string }
  ) => {
    const { data } = await api.get(`/organization/${orgId}/backups/history`, {
      params,
    });
    return data;
  },
    // 🆕 NEW reload endpoint
  reload: async (orgId: string) => {
    const { data } = await api.post(`/organization/${orgId}/backups/reload`);
    return data;
  },
};
