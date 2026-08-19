import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { invoiceApi } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";
import { toast } from "react-hot-toast";

const keys = {
  list: (
    orgId: string,
    page: number,
    limit: number,
    search?: string,
    clientId?: string,
    projectId?: string,
    contractId?: string,
    fromDate?: string,
    toDate?: string,
    payStatus?: string
  ) =>
    [
      "invoices",
      orgId,
      page,
      limit,
      search ?? "",
      clientId ?? "",
      projectId ?? "",
      contractId ?? "",
      fromDate ?? "",
      toDate ?? "",
      payStatus ?? "",
    ] as const,

  one: (orgId: string, id: string) =>
    ["invoices", orgId, id] as const,

  lastNotes: (orgId: string, clientId: string) =>
    ["invoice-last-notes", orgId, clientId] as const,

  contractUsage: (orgId: string, contractId: string) =>
    ["contract-usage", orgId, contractId] as const,
};

//
// ✅ LIST INVOICES (UPDATED WITH PAY STATUS)
//
export function useInvoices(
  page: number,
  limit: number,
  search?: string,
  clientId?: string,
  projectId?: string,
  contractId?: string,
  fromDate?: string,
  toDate?: string,
  payStatus?: string
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? keys.list(
          organization_id,
          page,
          limit,
          search,
          clientId,
          projectId,
          contractId,
          fromDate,
          toDate,
          payStatus
        )
      : ["invoices", "no-org"],

    queryFn: () =>
      invoiceApi.list(organization_id!, {
        page,
        limit,
        search,
        client_id: clientId,
        project_id: projectId,
        contract_id: contractId,
        from_date: fromDate,
        to_date: toDate,
        pay_status: payStatus, // ✅ NEW
      }),

    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

//
// ✅ GET SINGLE INVOICE
//
export function useInvoice(invoiceId: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, invoiceId)
      : ["invoices", "no-org", invoiceId],

    queryFn: () =>
      invoiceApi.get(organization_id!, invoiceId),

    enabled: !!organization_id && !!invoiceId,
  });
}

//
// ✅ CREATE INVOICE
//
export function useCreateInvoice() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: any) =>
      invoiceApi.create(organization_id!, body),

    onSuccess: (_, variables) => {
      toast.success("Invoice created");

      // ✅ 1. Refresh invoice list (ALL variations: pagination, filters)
      qc.invalidateQueries({
        queryKey: ["invoices", organization_id],
        exact: false,
      });

      // ✅ 2. Refresh contract usage (🔥 THIS FIXES REMAINING ISSUE)
      qc.invalidateQueries({
        queryKey: ["contract-usage"],
        exact: false,
      });

      // ✅ 3. Refresh last notes (client specific)
      if (variables?.client_id) {
        qc.invalidateQueries({
          queryKey: keys.lastNotes(
            organization_id!,
            variables.client_id
          ),
        });
      } else {
        qc.invalidateQueries({
          queryKey: ["invoice-last-notes"],
          exact: false,
        });
      }
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

//
// ✅ UPDATE INVOICE
//
export function useUpdateInvoice() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, body }: any) =>
      invoiceApi.update(organization_id!, invoiceId, body),

    onSuccess: (_, variables) => {
      toast.success("Invoice updated");

      // ✅ 1. Refresh ALL invoice lists (pagination, filters, etc.)
      qc.invalidateQueries({
        queryKey: ["invoices", organization_id],
        exact: false,
      });

      // ✅ 2. Refresh SINGLE invoice cache
      qc.invalidateQueries({
        queryKey: ["invoices", organization_id, variables.invoiceId],
      });

      // ✅ 3. Refresh contract usage (🔥 fixes remaining issue)
      qc.invalidateQueries({
        queryKey: ["contract-usage", organization_id],
        exact: false,
      });

      // ✅ 4. Refresh last notes
      const clientId = variables?.body?.client_id;

      if (clientId) {
        qc.invalidateQueries({
          queryKey: keys.lastNotes(organization_id!, clientId),
        });
      } else {
        qc.invalidateQueries({
          queryKey: ["invoice-last-notes"],
          exact: false,
        });
      }
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

//
// ✅ DOWNLOAD PDF
//
export function useDownloadInvoicePDF() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      invoiceId,
    }: {
      invoiceId: string;
    }) => {
      const data = await invoiceApi.download(
        organization_id!,
        invoiceId
      );

      if (!data?.url) throw new Error("No PDF found");
      return data;
    },

    onError: (err) => {
      emitApiError(parseApiError(err));
      toast.error("Failed to generate PDF");
    },
  });
}

//
// ✅ GET PRESIGNED URL
//
export function useGetPresignedUrl() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({ key }: { key: string }) => {
      const data = await invoiceApi.getPresignedUrl(
        organization_id!,
        key
      );

      if (!data?.url) throw new Error("No preview URL found");
      return data;
    },

    onError: (err) => {
      emitApiError(parseApiError(err));
      toast.error("Failed to load preview");
    },
  });
}

//
// ✅ GET LAST INVOICE NOTES
//
export function useLastInvoiceNotes(projectId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey:
      organization_id && projectId
        ? keys.lastNotes(organization_id, projectId)
        : ["invoice-last-notes", "no-org", projectId],

    queryFn: async () => {
      const data = await invoiceApi.getLastNotes(
        organization_id!,
        projectId!
      );
      return data;
    },

    enabled: !!organization_id && !!projectId,

    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,

    retry: false,
  });
}

//
// ✅ UPDATE PAYMENT STATUS
//
export function useUpdateInvoiceStatus() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, pay_status }: any) =>
      invoiceApi.updateStatus(
        organization_id!,
        invoiceId,
        pay_status
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["invoices", organization_id],
      });
    },
  });
}

//
// ✅ GET CONTRACT USAGE
//
export function useContractUsage(contractId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey:
      organization_id && contractId
        ? keys.contractUsage(organization_id, contractId)
        : ["contract-usage", "no-org", contractId],

    queryFn: async () => {
      if (!organization_id || !contractId) {
        return { used: 0 };
      }

      const res = await invoiceApi.getContractUsage(
        organization_id,
        contractId
      );

      return {
        used: Number(res?.used ?? 0),
      };
    },

    enabled: !!organization_id && !!contractId,

    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,

    retry: false,
  });
}

export function useDeleteInvoice() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) =>
      invoiceApi.remove(organization_id!, invoiceId),

    onSuccess: (_, invoiceId) => {
      toast.success("Invoice deleted");

      // ✅ 1. Optimistically remove from list (instant UI update)
      qc.setQueriesData(
        { queryKey: ["invoices", organization_id] },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            invoices: old.invoices.filter(
              (inv: any) => inv.id !== invoiceId
            ),
          };
        }
      );

      // ✅ 2. Ensure full sync (pagination / filters)
      qc.invalidateQueries({
        queryKey: ["invoices", organization_id],
        exact: false,
      });

      // ✅ 3. Refresh contract usage (🔥 fixes remaining)
      qc.invalidateQueries({
        queryKey: ["contract-usage", organization_id],
        exact: false,
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}