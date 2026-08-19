import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salaryCertificateApi, SalaryCertificateInput } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";
import { toast } from "react-hot-toast";

/** ---------------------------
 *  Query Keys
 * --------------------------- */
const keys = {
  all: (orgId: string) => ["salary-certificates", orgId] as const,
};

/** ---------------------------
 *  List Salary Certificates
 * --------------------------- */
export function useSalaryCertificates({
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
    "salary-certificates",
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
      return salaryCertificateApi.listByEmployee(organization_id!, employee_id, {
        page,
        limit,
        search,
        status,
      });
    }
    return salaryCertificateApi.listAll(organization_id!, {
      page,
      limit,
      search,
      status,
    });
  },
  // 🔹 Always fetch fresh data when filters change
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  staleTime: 0,
});

}


/** ---------------------------
 *  Employee: Request Certificate
 * --------------------------- */
export function useRequestSalaryCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ employee_id, purpose }: SalaryCertificateInput) =>
      salaryCertificateApi.request(organization_id!, employee_id, { purpose }),
    onSuccess: () => {
      toast.success("Salary certificate request submitted successfully");
      qc.invalidateQueries({ queryKey: ["salary-certificates", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  HR: Generate/Release Certificate
 * --------------------------- */
/** ---------------------------
 *  HR: Generate/Release Certificate
 * --------------------------- */
export function useGenerateSalaryCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ employee_id, purpose }: { employee_id: string; purpose: string }) =>
      salaryCertificateApi.generate(organization_id!, employee_id, { purpose }),

    onSuccess: (newCert) => {
      toast.success("Salary certificate generated and released");

      // ✅ Update all matching cached pages
      qc.setQueriesData(
        {
          queryKey: ["salary-certificates", organization_id],
          exact: false, // allow matching paginated queries
        },
        (oldData: any) => {
          if (!oldData?.certificates) return oldData;

          // prepend the new item only if it belongs to the current filter/page
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

      // ✅ Re-fetch all variations (page, filter, etc.)
      qc.invalidateQueries({
        queryKey: ["salary-certificates", organization_id],
        exact: false,
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}




/** ---------------------------
 *  Delete Certificate
 * --------------------------- */
export function useDeleteSalaryCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ certificate_id }: { certificate_id: string }) =>
      salaryCertificateApi.remove(organization_id!, certificate_id),
    onSuccess: () => {
      toast.success("Salary certificate deleted");
      qc.invalidateQueries({ queryKey: ["salary-certificates", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDownloadSalaryCertificatePDF() {
  const { organization_id, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ certificateId }: { certificateId: string }) => {
      if (!organization_id || !profile?.id) {
        throw new Error("Missing organization or employee ID");
      }

      // 🟢 Request presigned S3 URL
      const data = await salaryCertificateApi.download(
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
      console.error("Download salary certificate failed:", err);
      toast.error("Failed to get download link");
    },
  });
}


export function useReleaseSalaryCertificate() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (certificate_id: string) =>
      salaryCertificateApi.release(organization_id!, certificate_id),
    onSuccess: async (_, certificate_id) => {
      toast.success("Salary certificate released successfully");

      // 🧠 Update the released certificate locally in the cache
      qc.setQueriesData(["salary-certificates", organization_id], (oldData: any) => {
        if (!oldData?.certificates) return oldData;
        const updated = oldData.certificates.map((c: any) =>
          c.id === certificate_id ? { ...c, status: "released" } : c
        );
        return { ...oldData, certificates: updated };
      });

      // 🧠 Background refresh (non-blocking, no flicker)
      qc.invalidateQueries({
        queryKey: ["salary-certificates", organization_id],
        refetchType: "inactive",
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}


/** ---------------------------
 *  NEW: Get Presigned URL for Preview/Download
 * --------------------------- */
export function useGetSalaryCertificatePresignedURL() {
  const { organization_id, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ certificateId }: { certificateId: string }) => {
      if (!organization_id || !profile?.id) {
        throw new Error("Missing organization or employee ID");
      }

      const data = await salaryCertificateApi.download(
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
