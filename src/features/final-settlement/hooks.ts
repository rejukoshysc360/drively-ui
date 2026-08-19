import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  finalSettlementApi,
  CreateFinalSettlementInput,
  UpdateSettlementStatusInput,
} from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";
import { toast } from "react-hot-toast";

/** ---------------------------
 *  Query Keys
 * --------------------------- */
const keys = {
  all: (orgId: string) => ["final-settlements", orgId] as const,
};

/** ---------------------------
 *  Get Final Settlements
 * --------------------------- */
export function useFinalSettlements({
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["final-settlements", organization_id, page, limit, search],

    enabled: !!organization_id,

    queryFn: () =>
      finalSettlementApi.list(organization_id!, {
        page,
        limit,
        search,
      }),
  });
}


/** ---------------------------
 *  Create Final Settlement
 * --------------------------- */
export function useCreateFinalSettlement() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFinalSettlementInput) =>
      finalSettlementApi.create(organization_id!, input),

    onSuccess: (res: any) => {
      if (res?.message === "STORAGE_LIMIT_EXCEEDED") {
        emitApiError({
          message:
            "Your storage limit has been reached. Please upgrade your subscription plan to generate new final settlements.",
        });
        return;
      }

      toast.success("Final settlement created successfully");

      qc.invalidateQueries({
        queryKey: ["final-settlements", organization_id],
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Update Final Settlement Status
 * --------------------------- */
export function useUpdateFinalSettlementStatus() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettlementStatusInput) =>
      finalSettlementApi.updateStatus(organization_id!, input),
    onSuccess: () => {
      toast.success("Settlement status updated");
      qc.invalidateQueries({ queryKey: ["final-settlements", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  ✏️ Update Final Settlement Values (Manual Edit)
 * --------------------------- */
export function useUpdateFinalSettlementValues() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; updates: Record<string, any> }) =>
      finalSettlementApi.updateValues(organization_id!, input),
    onSuccess: () => {
      toast.success("Settlement values updated and logged in audit trail");
      qc.invalidateQueries({ queryKey: ["final-settlements", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  Cancel Final Settlement
 * --------------------------- */
export function useCancelFinalSettlement() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
  finalSettlementApi.cancel(organization_id!, id),
    onSuccess: () => {
      toast.success("Settlement cancelled");
      qc.invalidateQueries({ queryKey: ["final-settlements", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ---------------------------
 *  📥 Download Final Settlement PDF (S3)
 * --------------------------- */
export function useDownloadFinalSettlementPDF() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      settlementId,
      auditId,
    }: {
      settlementId: string;
      auditId?: string;
    }) => {
      if (!organization_id) {
        throw new Error("Missing organization_id");
      }

      const res = await finalSettlementApi.download(organization_id, {
        settlement_id: settlementId,
        audit_id: auditId, // optional
      });

      return res; // { url }
    },

    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to download final settlement";
      toast.error(msg);
    },
  });
}