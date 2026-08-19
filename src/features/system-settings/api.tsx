// src/features/system-jobs/api.ts

import { api } from "../../lib/axios";

export const systemJobsApi = {
  /** 🔹 Fetch all system jobs for an organization */
  list: async (orgId: string) => {
    const { data } = await api.get(`/organization/${orgId}/jobs`);

    return data;
  },

  /** 🔹 Update a job’s cron schedule */
  update: async ({
    orgId,
    jobKey,
    schedule,
  }: {
    orgId: string;
    jobKey: string;
    schedule: string;
  }) => {
    const { data } = await api.patch(`/organization/${orgId}/jobs/${jobKey}`, {
      cron_expression: schedule,
      is_active: true,
    });

    return data;
  },

  /** 🔹 Toggle job active/inactive */
  toggle: async ({
    orgId,
    jobKey,
    is_active,
  }: {
    orgId: string;
    jobKey: string;
    is_active: boolean;
  }) => {
    const { data } = await api.patch(
      `/organization/${orgId}/jobs/${jobKey}/toggle`,
      { is_active },
    );

    return data;
  },

  /** 🔹 Run a job manually */
  run: async ({
    orgId,
    jobKey,
    runDate,
    employeeId,
    forceFullAccrual,
  }: {
    orgId: string;
    jobKey: string;
    runDate?: string;
    employeeId?: string | null;
    forceFullAccrual?: boolean;
  }) => {
    const { data } = await api.post(
      `/organization/${orgId}/jobs/${jobKey}/run`,
      {
        runDate,
        employeeId: employeeId || null,
        forceFullAccrual: !!forceFullAccrual,
      },
    );

    return data;
  },

  /** 🔹 Fetch paginated job execution history */
  history: async (
    orgId: string,
    params: {
      page?: number;
      limit?: number;
      job_name?: string;
      executed_at?: string;
    },
  ) => {
    const { data } = await api.get(`/organization/${orgId}/jobs/history`, {
      params,
    });

    return data;
  },

  /** 🔹 Fetch email audit logs */
  emailAudit: async (orgId: string, executionId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/jobs/history/${executionId}/email-audit`,
    );

    return data;
  },

  /** 🔹 Reload all or specific job schedulers */
  reload: async (orgId: string, jobParam?: string) => {
    const { data } = await api.post(`/organization/${orgId}/jobs/reload`, {
      jobParam,
    });

    return data;
  },

  // =========================================================
  //  SYSTEM MAINTENANCE (SUPER ADMIN)
  // =========================================================

  /** 🔹 Fetch maintenance settings */
  getMaintenanceSettings: async () => {
    const { data } = await api.get("/system-maintenance");

    return data;
  },

  /** 🔹 Update maintenance settings */
  updateMaintenanceSettings: async ({
    enabled,
    message,
  }: {
    enabled: boolean;
    message: string;
  }) => {
    const { data } = await api.patch("/system-maintenance", {
      enabled,
      message,
    });

    return data;
  },

  // =========================================================
  // 🔥 PUBLIC MAINTENANCE STATUS
  // =========================================================

  /** 🔹 Public maintenance check */
  getMaintenanceStatus: async (token: string) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/system-maintenance`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch maintenance status");
    }

    return res.json();
  },
};
