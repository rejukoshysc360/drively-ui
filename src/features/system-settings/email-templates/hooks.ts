import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/AuthProvider";

import { emitApiError } from "../../../lib/error-bus";
import { emitSuccess } from "../../../lib/success-bus";

import { parseApiError } from "../../../utils/parseApiError";

import { emailTemplatesApi } from "./api";

export function useEmailTemplateStatus() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["email-template-status", organization_id],

    queryFn: () => emailTemplatesApi.getStatus(organization_id!),

    enabled: !!organization_id,
  });
}

export function useInstallDefaultTemplates() {
  const { organization_id } = useAuth();

  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => emailTemplatesApi.installDefaults(organization_id!),

    onSuccess: () => {
      emitSuccess({
        type: "success",
        message: "Default email templates installed successfully",
      });

      qc.invalidateQueries({
        queryKey: ["email-template-status", organization_id],
      });

      qc.invalidateQueries({
        queryKey: ["email-template-catalog", organization_id],
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useEmailTemplateCatalog() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["email-template-catalog", organization_id],

    queryFn: () => emailTemplatesApi.getCatalog(organization_id!),

    enabled: !!organization_id,
  });
}

export function useInstallTemplate() {
  const { organization_id } = useAuth();

  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ type, force = false }: { type: string; force?: boolean }) =>
      emailTemplatesApi.installTemplate(organization_id!, type, force),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["email-template-status", organization_id],
      });

      qc.invalidateQueries({
        queryKey: ["email-template-catalog", organization_id],
      });

      emitSuccess({
        message: "Template installed successfully",
        type: "success",
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}