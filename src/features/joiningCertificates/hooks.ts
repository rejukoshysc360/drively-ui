import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { joiningCertificateApi, JoiningCertificateInput } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";
import { toast } from "react-hot-toast";

/** ---------------------------
 *  Query Keys
 * --------------------------- */
const keys = {
  all: (orgId: string) => ["joining-certificates", orgId] as const,
};

/** ---------------------------
 *  List Joining Certificates
 * --------------------------- */
export function useJoiningCertificates({
  page = 1,
  limit = 10,
  employee_id,
  search = "",
  status = "",
}: {
  page?: number;
  limit?: number;
  employee_id?: string;
  search?: string;
  status?: string;
}) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "joining-certificates",
      organization_id,
      employee_id,
      page,
      limit,
      search,
      status,
    ],
    enabled: !!organization_id,
    queryFn: () => {
      if (employee_id) {
        return joiningCertificateApi.listByEmployee(organization_id!, employee_id, {
          page,
          limit,
          search,
          status,
        });
      }
      return joiningCertificateApi.listAll(organization_id!, {
        page,
        limit,
        search,
        status,
      });
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

/** ---------------------------
 *  Employee: Request Certificate
 * --------------------------- */
export function useRequestJoiningCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ employee_id, note }: { employee_id: string; note?: string }) =>
      joiningCertificateApi.request(organization_id!, employee_id, { note }), // ✅ pass body
    onSuccess: () => {
      toast.success("Joining certificate request submitted successfully");
      qc.invalidateQueries({ queryKey: ["joining-certificates", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}


/** ---------------------------
 *  HR: Generate/Release Certificate
 * --------------------------- */
export function useGenerateJoiningCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ employee_id }: { employee_id: string }) =>
      joiningCertificateApi.generate(organization_id!, employee_id),

    onSuccess: (newCert) => {
      toast.success("Joining certificate generated and released");

      qc.setQueriesData(
        {
          queryKey: ["joining-certificates", organization_id],
          exact: false,
        },
        (oldData: any) => {
          if (!oldData?.certificates) return oldData;

          const updated = [newCert, ...oldData.certificates];

          return {
            ...oldData,
            certificates: updated.slice(0, oldData.paginationMetaInfo?.limit ?? 10),
            paginationMetaInfo: {
              ...oldData.paginationMetaInfo,
              total: (oldData.paginationMetaInfo?.total ?? 0) + 1,
              totalPages: Math.ceil(
                ((oldData.paginationMetaInfo?.total ?? 0) + 1) /
                  (oldData.paginationMetaInfo?.limit ?? 10)
              ),
            },
          };
        }
      );

      qc.invalidateQueries({
        queryKey: ["joining-certificates", organization_id],
        exact: false,
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Delete Certificate
 * --------------------------- */
export function useDeleteJoiningCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ certificate_id }: { certificate_id: string }) =>
      joiningCertificateApi.remove(organization_id!, certificate_id),
    onSuccess: () => {
      toast.success("Joining certificate deleted");
      qc.invalidateQueries({ queryKey: ["joining-certificates", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Download Certificate PDF (Employee)
 * --------------------------- */
export function useDownloadJoiningCertificatePDF() {
  const { organization_id, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ certificateId }: { certificateId: string }) => {
      if (!organization_id || !profile?.id) {
        throw new Error("Missing organization or employee ID");
      }

      const data = await joiningCertificateApi.download(
        organization_id,
        profile.id,
        certificateId
      );

      if (!data?.url) {
        toast.error("No downloadable PDF found for this certificate");
        throw new Error("Missing PDF URL");
      }

      return data; // { url }
    },

    onError: (err: any) => {
      console.error("Download joining certificate failed:", err);
      toast.error("Failed to get download link");
    },
  });
}

/** ---------------------------
 *  HR: Release Existing Certificate
 * --------------------------- */
export function useReleaseJoiningCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (certificate_id: string) =>
      joiningCertificateApi.release(organization_id!, certificate_id),
    onSuccess: async (_, certificate_id) => {
      toast.success("Joining certificate released successfully");

      qc.setQueriesData(["joining-certificates", organization_id], (oldData: any) => {
        if (!oldData?.certificates) return oldData;
        const updated = oldData.certificates.map((c: any) =>
          c.id === certificate_id ? { ...c, status: "released" } : c
        );
        return { ...oldData, certificates: updated };
      });

      qc.invalidateQueries({
        queryKey: ["joining-certificates", organization_id],
        refetchType: "inactive",
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Get Presigned URL for Preview/Download
 * --------------------------- */
export function useGetJoiningCertificatePresignedURL() {
  const { organization_id, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ certificateId }: { certificateId: string }) => {
      if (!organization_id || !profile?.id) {
        throw new Error("Missing organization or employee ID");
      }

      const data = await joiningCertificateApi.download(
        organization_id,
        profile.id,
        certificateId
      );

      if (!data?.url) {
        throw new Error("Failed to retrieve presigned URL");
      }

      return data; // { url }
    },
    onError: (err: any) => {
      console.error("Presigned URL fetch failed:", err);
      toast.error("Failed to load certificate PDF");
    },
  });
}
