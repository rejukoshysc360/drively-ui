import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emailTemplatesApi } from "./api";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";

const keys = {
  list: (orgId: string) => ["email-templates", orgId] as const,
  single: (orgId: string, type: string) => ["email-template", orgId, type] as const,
};

/**
 * 🔹 List all templates for an organization
 */
export function useEmailTemplates(orgId: string) {
  return useQuery({
    queryKey: keys.list(orgId),
    queryFn: () => emailTemplatesApi.list(orgId),
    enabled: !!orgId,
    refetchOnWindowFocus: false,
  });
}

/**
 * 🔹 Get a single template by type
 */
export function useEmailTemplate(orgId: string, type: string) {
  return useQuery({
    queryKey: keys.single(orgId, type),
    queryFn: () => emailTemplatesApi.getByType(orgId, type),
    enabled: !!orgId && !!type,
    refetchOnWindowFocus: false,
  });
}

/**
 * 🔹 Upsert (create or update) template
 */
export function useUpsertEmailTemplate(orgId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { type: string; subject: string; html: string }) =>
      emailTemplatesApi.upsert(orgId, payload.type, {
        organization_id: orgId,
        subject: payload.subject,
        html: payload.html,
      }),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * 🔹 Delete a template
 */
export function useDeleteEmailTemplate(orgId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (type: string) => emailTemplatesApi.remove(orgId, type),
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * 🔹 Send an email using a saved template
 */
export function useSendEmailTemplate(orgId: string) {
  return useMutation({
    mutationFn: (payload: {
      to: string | string[];
      type: string;
      subject?: string;
      data?: Record<string, any>;
      attachments?: any[];
    }) => emailTemplatesApi.sendEmail(orgId, payload),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
