import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  documentsApi,
  genericDocumentsApi,
  type DocumentCategory,
} from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { emitApiError } from "../../../lib/error-bus";
import { parseApiError } from "../../../utils/parseApiError";

type DocumentType = "onboarding" | "compliance" | "leaves";

// 🟩 React Query key helper with document type included (critical for separating onboarding vs compliance)
const keys = {
  list: (
    orgId: string,
    employeeId: string | "self",
    type: DocumentType,
    page = 1,
    limit = 20
  ) =>
    [
      "employee-documents",
      orgId,
      employeeId,
      type,
      page,
      limit,
    ] as const,
};

type UploadArgs = {
  file: File;
  name: string;
  onProgress?: (p: number) => void;
};



/* ---------------------------------------------------------------------------
   🟢 Generic document list hook (supports both onboarding & compliance)
--------------------------------------------------------------------------- */
export function useDocumentsDb(
  employeeId: string,
  type: DocumentType = "onboarding",
  page = 1,
  limit = 20
) {
  const { organization_id } = useAuth();
  const orgId = organization_id ?? undefined;

  return useQuery({
   queryKey: orgId
  ? keys.list(orgId, employeeId, type, page, limit)
  : [
      "employee-documents",
      "no-org",
      employeeId,
      type,
      page,
      limit,
    ],
    queryFn: () =>
      documentsApi.listDb(
      orgId!,
      employeeId,
      type as DocumentCategory,
      page,
      limit
    ),
    enabled: !!orgId && !!employeeId,
  });
}

/* ---------------------------------------------------------------------------
   🟢 Employee self-documents (no explicit employeeId)
--------------------------------------------------------------------------- */
export function useEmployeeDocuments(
  type: DocumentType = "onboarding",
  page = 1,
  limit = 20
) {
  const { organization_id, user } = useAuth();
  const orgId = organization_id ?? undefined;
  const employeeKey = (user?.employee_id as string | undefined) ?? "self";

  return useQuery({
   queryKey: orgId
  ? keys.list(
      orgId,
      employeeKey,
      type,
      page,
      limit
    )
  : [
      "employee-documents",
      "no-org",
      employeeKey,
      type,
      page,
      limit,
    ],
    queryFn: () =>
      documentsApi.listDb(
      orgId!,
      employeeKey === "self" ? undefined : employeeKey,
      type as DocumentCategory,
      page,
      limit
    ),
    enabled: !!orgId,
  });
}

/* ---------------------------------------------------------------------------
   🟢 Upload document → S3 + DB
--------------------------------------------------------------------------- */
export function useUploadEmployeeDocument(
  employeeId?: string,
  type: DocumentType // ✅ removed default "onboarding" to prevent fallback
) {
  if (!type) throw new Error("❌ Missing document type in useUploadEmployeeDocument");

  const { organization_id, user } = useAuth();
  const orgId = organization_id ?? undefined;
  const qc = useQueryClient();

  const resolvedEmployeeId =
    (employeeId as string | undefined) ??
    (user?.employee_id as string | undefined) ??
    "self";

  return useMutation({
    mutationFn: (args: UploadArgs) => {
      console.log("📤 Uploading document type:", type); // Debug log
      return documentsApi.uploadDb(
      orgId!,
      resolvedEmployeeId === "self" ? undefined : resolvedEmployeeId,
      args.file,
      args.name,
      type as DocumentCategory,
      { onProgress: args.onProgress }
);
    },
    onSuccess: () => {
      if (!orgId) return;
      qc.invalidateQueries({
        queryKey: keys.list(orgId, resolvedEmployeeId, type),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Convenience hooks for upload */
export const useUploadOnboardingDocument = (employeeId?: string) =>
  useUploadEmployeeDocument(employeeId, "onboarding");

export const useUploadComplianceDocument = (employeeId?: string) =>
  useUploadEmployeeDocument(employeeId, "compliance");

/* ---------------------------------------------------------------------------
   🟢 Delete document → S3 + DB
--------------------------------------------------------------------------- */
export function useDeleteEmployeeDocument(
  employeeId?: string,
  type: DocumentType // ✅ removed default "onboarding"
) {
  if (!type) throw new Error("❌ Missing document type in useDeleteEmployeeDocument");

  const { organization_id, user } = useAuth();
  const orgId = organization_id ?? undefined;
  const qc = useQueryClient();

  const resolvedEmployeeId =
    (employeeId as string | undefined) ??
    (user?.employee_id as string | undefined) ??
    "self";

  return useMutation({
    mutationFn: (docId: string) =>
     documentsApi.removeDb(
      orgId!,
      resolvedEmployeeId === "self" ? undefined : resolvedEmployeeId,
      docId,
      type as DocumentCategory
    ),
    onSuccess: () => {
      if (!orgId) return;
      qc.invalidateQueries({
        queryKey: keys.list(orgId, resolvedEmployeeId, type),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Convenience hooks for delete */
export const useDeleteOnboardingDocument = (employeeId?: string) =>
  useDeleteEmployeeDocument(employeeId, "onboarding");

export const useDeleteComplianceDocument = (employeeId?: string) =>
  useDeleteEmployeeDocument(employeeId, "compliance");

/* ---------------------------------------------------------------------------
   🟢 Download document → presigned URL
--------------------------------------------------------------------------- */
export function useDownloadEmployeeDocument(
  employeeId?: string,
  type: DocumentType // ✅ removed default "onboarding"
) {
  if (!type) throw new Error("❌ Missing document type in useDownloadEmployeeDocument");

  const { organization_id, user } = useAuth();
  const orgId = organization_id ?? undefined;

  const resolvedEmployeeId =
    (employeeId as string | undefined) ??
    (user?.employee_id as string | undefined) ??
    "self";

  return useMutation({
    mutationFn: (docId: string) =>
      documentsApi.getDownloadUrl(
      orgId!,
      resolvedEmployeeId === "self" ? undefined : resolvedEmployeeId,
      docId,
      type as DocumentCategory
    ),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Convenience hooks for download */
export const useDownloadOnboardingDocument = (employeeId?: string) =>
  useDownloadEmployeeDocument(employeeId, "onboarding");

export const useDownloadComplianceDocument = (employeeId?: string) =>
  useDownloadEmployeeDocument(employeeId, "compliance");

/* ---------------------------------------------------------------------------
   🟢 Send onboarding email
--------------------------------------------------------------------------- */
export function useSendOnboardingEmail() {
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (employeeId: string) =>
      documentsApi.sendOnboardingEmail(organization_id!, employeeId),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ---------------------------------------------------------------------------
   🟢 Upload Generic (Organization-Level) Document → S3 + DB
--------------------------------------------------------------------------- */
export function useUploadGenericDocument(type: DocumentType = "onboarding") {
  if (!type) throw new Error("❌ Missing document type in useUploadGenericDocument");

  const { organization_id } = useAuth();
  const orgId = organization_id ?? undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: UploadArgs) => {
      console.log("📤 Uploading generic document:", args.name);
      return genericDocumentsApi.uploadDb(
            orgId!,
            args.file,
            args.name,
            type as DocumentCategory,
            { onProgress: args.onProgress }
          );
    },
    onSuccess: () => {
      if (!orgId) return;
      qc.invalidateQueries({
        queryKey: ["organization-generic-documents", orgId, type],
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ---------------------------------------------------------------------------
   🟢 Generic (Organization-Level) Document Hooks
--------------------------------------------------------------------------- */
export function useGenericDocuments(
  type: DocumentType = "onboarding",
  page = 1,
  limit = 20
) {
  const { organization_id } = useAuth();
  const orgId = organization_id ?? undefined;

  return useQuery({
    queryKey: [
      "organization-generic-documents",
      orgId,
      type,
      page,
      limit,
    ],
    queryFn: () => genericDocumentsApi.listDb(
  orgId!,
  type as DocumentCategory,
  page,
  limit
),
    enabled: !!orgId,
  });
}

export function useDeleteGenericDocument(type: DocumentType = "onboarding") {
  const { organization_id } = useAuth();
  const orgId = organization_id ?? undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => genericDocumentsApi.removeDb(
  orgId!,
  docId,
  type as DocumentCategory
),
    onSuccess: () => {
      if (!orgId) return;
      qc.invalidateQueries({ queryKey: ["organization-generic-documents", orgId, type] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDownloadGenericDocument(type: DocumentType = "onboarding") {
  const { organization_id } = useAuth();
  const orgId = organization_id ?? undefined;

  return useMutation({
    mutationFn: (docId: string) => genericDocumentsApi.getDownloadUrl(
    orgId!,
    docId,
    type as DocumentCategory
  ),
    onError: (err) => emitApiError(parseApiError(err)),
  });
} 
export function useSendBulkOnboardingDocuments() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (payload: { employee_ids: string[]; document_ids: string[] }) =>
      genericDocumentsApi.sendBulkOnboardingDocuments(organization_id!, payload),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
