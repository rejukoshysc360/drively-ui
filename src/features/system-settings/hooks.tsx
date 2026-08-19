// src/features/system-jobs/hooks.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { systemJobsApi } from "./api";

import { useAuth } from "../auth/AuthProvider";

import { emitApiError } from "../../lib/error-bus";

import { parseApiError } from "../../../src/utils/parseApiError";

import { emitSuccess } from "../../lib/success-bus";

// ======================================================
// 🔹 FETCH ALL SYSTEM JOBS
// ======================================================

export function useSystemJobs() {

  const { organization_id } = useAuth();

  return useQuery({

    queryKey: [
      "system-jobs",
      organization_id,
    ],

    queryFn: () =>
      systemJobsApi.list(
        organization_id!
      ),

    enabled: !!organization_id,
  });
}

// ======================================================
// 🔹 UPDATE JOB CRON SCHEDULE
// ======================================================

export function useUpdateJobSchedule() {

  const { organization_id } = useAuth();

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (args: {
      jobKey: string;
      schedule: string;
    }) =>
      systemJobsApi.update({
        orgId: organization_id!,
        ...args,
      }),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: [
          "system-jobs",
          organization_id,
        ],
      }),

    onError: (err) =>
      emitApiError(
        parseApiError(err)
      ),
  });
}

// ======================================================
// 🔹 RUN JOB MANUALLY
// ======================================================

export function useRunJob() {

  const { organization_id } = useAuth();

  return useMutation({

    mutationFn: (args: {
      jobKey: string;
      runDate?: string;
      employeeId?: string | null;
      forceFullAccrual?: boolean;
    }) =>
      systemJobsApi.run({
        orgId: organization_id!,
        jobKey: args.jobKey,
        runDate: args.runDate,
        employeeId:
          args.employeeId || null,
        forceFullAccrual:
          args.forceFullAccrual || false,
      }),

    onError: (err) =>
      emitApiError(
        parseApiError(err)
      ),
  });
}

// ======================================================
// 🔹 TOGGLE JOB ACTIVE / INACTIVE
// ======================================================

export function useToggleJob() {

  const { organization_id } = useAuth();

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (args: {
      jobKey: string;
      is_active: boolean;
    }) =>
      systemJobsApi.toggle({
        orgId: organization_id!,
        jobKey: args.jobKey,
        is_active: args.is_active,
      }),

    onSuccess: () => {

      qc.invalidateQueries({
        queryKey: [
          "system-jobs",
          organization_id,
        ],
      });

      emitSuccess({
        message:
          "Job status updated successfully!",
        type: "success",
      });
    },

    onError: (err) =>
      emitApiError(
        parseApiError(err)
      ),
  });
}

// ======================================================
// 🔹 RELOAD JOB SCHEDULERS
// ======================================================

export function useReloadJobs() {

  const { organization_id } = useAuth();

  return useMutation({

    mutationFn: (
      jobKey?: string
    ) =>
      systemJobsApi.reload(
        organization_id!,
        jobKey
      ),

    onError: (err) =>
      emitApiError(
        parseApiError(err)
      ),
  });
}

// ======================================================
// 🔹 FETCH JOB HISTORY
// ======================================================

export function useJobHistory(
  page: number,
  filters: {
    job_name?: string;
    executed_at?: string;
  }
) {

  const { organization_id } = useAuth();

  return useQuery({

    queryKey: [
      "system-jobs-history",
      organization_id,
      page,
      filters,
    ],

    queryFn: () =>
      systemJobsApi.history(
        organization_id!,
        {
          page,
          limit: 10,
          ...filters,
        }
      ),

    enabled: !!organization_id,

  });
}

// ======================================================
// 🔹 FETCH EMAIL AUDIT LOGS
// ======================================================

export function useEmailAudit(
  executionId?: string | null
) {

  const { organization_id } = useAuth();

  return useQuery({

    queryKey: [
      "email-audit",
      organization_id,
      executionId,
    ],

    queryFn: () =>
      systemJobsApi.emailAudit(
        organization_id!,
        executionId!
      ),

    enabled:
      !!organization_id &&
      !!executionId,

    onError: (err) =>
      emitApiError(
        parseApiError(err)
      ),
  });
}


// ======================================================
//  FETCH MAINTENANCE SETTINGS
// ======================================================

export function useMaintenanceSettings() {
  return useQuery({
    queryKey: ["maintenance-settings"],

    queryFn: () =>
      systemJobsApi.getMaintenanceSettings(),
  });
}

// ======================================================
// 🔥 UPDATE MAINTENANCE SETTINGS
// ======================================================

export function useUpdateMaintenanceSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      enabled: boolean;
      message: string;
    }) =>
      systemJobsApi.updateMaintenanceSettings({
        enabled: args.enabled,
        message: args.message,
      }),

    onSuccess: () => {
      emitSuccess({
        message:
          "Maintenance settings updated successfully!",
        type: "success",
      });

      qc.invalidateQueries({
        queryKey: ["maintenance-settings"],
      });
    },

    onError: (err) =>
      emitApiError(
        parseApiError(err)
      ),
  });
}

 
// ======================================================
// PUBLIC MAINTENANCE STATUS
// ======================================================

export function usePublicMaintenance() {
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      "maintenance-status",
    ],

    queryFn: () =>
      systemJobsApi.getMaintenanceStatus(
        token!
      ),

    enabled: !!token,

    retry: false,

    staleTime: Infinity,

    refetchOnMount: false,

    refetchOnWindowFocus: false,

    refetchOnReconnect: false,
  });
}
