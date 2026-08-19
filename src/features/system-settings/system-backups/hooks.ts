import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemBackupsApi } from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { emitApiError } from "../../../lib/error-bus";
import { parseApiError } from "../../../../src/utils/parseApiError";
import { emitSuccess } from "../../../lib/success-bus";

// 🔹 List all backup jobs (schedules)
export function useBackupSchedules() {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ["system-backups", organization_id],
    queryFn: () => systemBackupsApi.list(organization_id!),
    enabled: !!organization_id,
  });
}

// 🔹 Update backup job schedule (cron)
export function useUpdateBackupSchedule() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { key: string; schedule: string }) =>
      systemBackupsApi.update({ orgId: organization_id!, ...args }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["system-backups", organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// 🔹 Run backup manually (“Run Now”)
export function useRunBackup() {
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (args: { key: string; runDate?: string }) =>
      systemBackupsApi.run({ orgId: organization_id!, ...args }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// 🔹 Fetch backup execution history (paginated)
export function useBackupHistory(
  page: number,
  filters: { job_name?: string; executed_at?: string }
) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ["system-backups-history", organization_id, page, filters],
    queryFn: () =>
      systemBackupsApi.history(organization_id!, {
        page,
        limit: 10,
        ...filters,
      }),
    enabled: !!organization_id,
    onError: (err) => emitApiError(parseApiError(err)),
    keepPreviousData: true,
  });
}


export function useReloadBackups() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: () => systemBackupsApi.reload(organization_id!),
    onSuccess: () => emitSuccess({ message: "Backup scheduler reloaded successfully", type: "success" }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}