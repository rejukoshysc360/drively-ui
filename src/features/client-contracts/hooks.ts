import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { contractApi } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";
import { toast } from "react-hot-toast";

// 🔑 QUERY KEYS
const keys = {
  list: (
    orgId: string,
    page: number,
    limit: number,
    search?: string,
    clientId?: string
  ) =>
    [
      "contracts",
      orgId,
      page,
      limit,
      search ?? "",
      clientId ?? "",
    ] as const,

  one: (orgId: string, id: string) =>
    ["contracts", orgId, id] as const,
};

//
// ✅ LIST CONTRACTS (SEARCH + PAGINATION)
//
export function useContracts(
  page: number,
  limit: number,
  search?: string,
  clientId?: string,
  projectId?: string,
  fromDate?: string,
  toDate?: string
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "contracts",
      organization_id,
      page,
      limit,
      search ?? "",
      clientId ?? "",
      projectId ?? "",
      fromDate ?? "",
      toDate ?? "",
    ],

    queryFn: () =>
      contractApi.list(organization_id!, {
        page,
        limit,
        search: search || undefined,
        client_id: clientId || undefined,
        project_id: projectId || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }),

    enabled: !!organization_id,

    // ✅ IMPORTANT
    keepPreviousData: true,
  });
}

//
// ✅ GET SINGLE CONTRACT
//
export function useContract(contractId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey:
      organization_id && contractId
        ? keys.one(organization_id, contractId)
        : ["contracts", "no-org", contractId],

    queryFn: () =>
      contractApi.get(organization_id!, contractId!),

    enabled: !!organization_id && !!contractId,
  });
}

//
// ✅ CREATE CONTRACT
//
export function useCreateContract() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: any) =>
      contractApi.create(organization_id!, body),

    onSuccess: () => {
      toast.success("Contract created");

      qc.invalidateQueries({
        queryKey: ["contracts", organization_id],
      });
    },

    onError: (err) =>
      emitApiError(parseApiError(err)),
  });
}

//
// ✅ UPDATE CONTRACT
//
export function useUpdateContract() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, body }: any) =>
      contractApi.update(
        organization_id!,
        contractId,
        body
      ),

    onSuccess: () => {
      toast.success("Contract updated");

      qc.invalidateQueries({
        queryKey: ["contracts", organization_id],
      });
    },

    onError: (err) =>
      emitApiError(parseApiError(err)),
  });
}

//
// ❌ DELETE CONTRACT
//
export function useDeleteContract() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) =>
      contractApi.remove(organization_id!, contractId),

    onSuccess: () => {
      toast.success("Contract deleted");

      qc.invalidateQueries({
        queryKey: ["contracts", organization_id],
      });
    },

    onError: (err) =>
      emitApiError(parseApiError(err)),
  });
}