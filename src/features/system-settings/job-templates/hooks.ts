import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/AuthProvider";

import { emitApiError } from "../../../lib/error-bus";
import { emitSuccess } from "../../../lib/success-bus";

import { parseApiError } from "../../../utils/parseApiError";

import { jobTemplatesApi } from "./api";

export function useJobTemplateStatus() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["job-template-status", organization_id],

    queryFn: () => jobTemplatesApi.getStatus(organization_id!),

    enabled: !!organization_id,
  });
}

export function useInstallDefaultJobs() {
  const { organization_id } = useAuth();

  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => jobTemplatesApi.installDefaults(organization_id!),

    onSuccess: () => {
      emitSuccess({
        type: "success",
        message: "Default jobs installed successfully",
      });

      qc.invalidateQueries({
        queryKey: ["job-template-status", organization_id],
      });

      qc.invalidateQueries({
        queryKey: ["job-template-catalog", organization_id],
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useJobTemplateCatalog() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["job-template-catalog", organization_id],

    queryFn: () => jobTemplatesApi.getCatalog(organization_id!),

    enabled: !!organization_id,
  });
}

export function useInstallJobTemplate() {
  const { organization_id } = useAuth();

  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      job_name,
      force = false,
    }: {
      job_name: string;
      force?: boolean;
    }) => jobTemplatesApi.installTemplate(organization_id!, job_name, force),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["job-template-status", organization_id],
      });

      qc.invalidateQueries({
        queryKey: ["job-template-catalog", organization_id],
      });

      emitSuccess({
        message: "Job installed successfully",
        type: "success",
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}
