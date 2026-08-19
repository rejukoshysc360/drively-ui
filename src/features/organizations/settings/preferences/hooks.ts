import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi, UpdateOrganizationInput } from "./api";
import { useAuth } from "../../../auth/AuthProvider";
import { emitApiError } from "../../../../lib/error-bus";
import { parseApiError } from "../../../../utils/parseApiError";
import { api } from "../../../../lib/axios";

const keys = {
  one: (orgId: string) => ["organization", orgId] as const,
  expiryFields: (orgId: string) => ["employee-expiry-fields", orgId] as const,
};

/** ---------------------------
 *  Get Organization
 * --------------------------- */
export function useOrganization() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id ? keys.one(organization_id) : ["organization", "no-org"],
    queryFn: () => organizationApi.get(organization_id!),
    enabled: !!organization_id,
  });
}

/** ---------------------------
 *  Update Organization Settings
 * --------------------------- */
export function useUpdateOrganizationSettings() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) =>
      organizationApi.updateSettings(organization_id!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization", organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Fetch Employee *_expiry Fields (Organization Scoped)
 * --------------------------- */
export function useEmployeeExpiryFields() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? keys.expiryFields(organization_id)
      : ["employee-expiry-fields", "no-org"],
    enabled: !!organization_id,
    queryFn: async () => {
      const { data } = await api.get(
        `/organization/${organization_id}/hr-management/employee-fields`
      );
      // ✅ Backend already filters expiry fields (including probation_end_date)
      return data || [];
    },
  });
}

/** Upload Organization Photo */
export function useUploadOrganizationPhoto() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: { file: File; onProgress?: (p: number) => void }) =>
      organizationApi.uploadPhoto(organization_id!, args.file, {
        onProgress: args.onProgress,
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organization", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** Get Organization Photo URL */
export function useOrganizationPhotoUrl() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: () =>
      organizationApi.getPhotoDownloadUrl(organization_id!),

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** Upload Organization Seal */
export function useUploadOrganizationSeal() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: { file: File; onProgress?: (p: number) => void }) =>
      organizationApi.uploadSeal(organization_id!, args.file, {
        onProgress: args.onProgress,
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organization", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** Get Organization Seal URL */
export function useOrganizationSealUrl() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: () =>
      organizationApi.getSealDownloadUrl(organization_id!),

    onError: (err) => emitApiError(parseApiError(err)),
  });
}