import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CreateCustomerInput,
  UpdateCustomerInput,
  customersApi,
} from "./customersApi";

export const CUSTOMER_QUERY_KEYS = {
  all: ["customers"] as const,

  organization: (organizationId: string) =>
    [
      ...CUSTOMER_QUERY_KEYS.all,
      organizationId,
    ] as const,

  lists: (organizationId: string) =>
    [
      ...CUSTOMER_QUERY_KEYS.organization(
        organizationId,
      ),
      "list",
    ] as const,

  list: (
    organizationId: string,
    page: number,
    limit: number,
    search: string,
  ) =>
    [
      ...CUSTOMER_QUERY_KEYS.lists(
        organizationId,
      ),
      page,
      limit,
      search,
    ] as const,

  details: (organizationId: string) =>
    [
      ...CUSTOMER_QUERY_KEYS.organization(
        organizationId,
      ),
      "detail",
    ] as const,

  detail: (
    organizationId: string,
    customerId: string,
  ) =>
    [
      ...CUSTOMER_QUERY_KEYS.details(
        organizationId,
      ),
      customerId,
    ] as const,
};

export function useCustomers(
  organizationId: string,
  page = 1,
  limit = 10,
  search = "",
) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.list(
      organizationId,
      page,
      limit,
      search,
    ),

    queryFn: () =>
      customersApi.list(
        organizationId,
        page,
        limit,
        search,
      ),

    enabled: !!organizationId,
  });
}

export function useCustomer(
  organizationId: string,
  customerId: string,
) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.detail(
      organizationId,
      customerId,
    ),

    queryFn: () =>
      customersApi.get(
        organizationId,
        customerId,
      ),

    enabled:
      !!organizationId &&
      !!customerId,
  });
}

export function useCreateCustomer(
  organizationId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CreateCustomerInput,
    ) =>
      customersApi.create(
        organizationId,
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          CUSTOMER_QUERY_KEYS.lists(
            organizationId,
          ),
      });
    },
  });
}

export function useUpdateCustomer(
  organizationId: string,
  customerId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: UpdateCustomerInput,
    ) =>
      customersApi.update(
        organizationId,
        customerId,
        payload,
      ),

    onSuccess: async (
      updatedCustomer,
    ) => {
      queryClient.setQueryData(
        CUSTOMER_QUERY_KEYS.detail(
          organizationId,
          customerId,
        ),
        updatedCustomer,
      );

      await queryClient.invalidateQueries({
        queryKey:
          CUSTOMER_QUERY_KEYS.lists(
            organizationId,
          ),
      });
    },
  });
}

export function useDeleteCustomer(
  organizationId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      customerId: string,
    ) =>
      customersApi.remove(
        organizationId,
        customerId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          CUSTOMER_QUERY_KEYS.lists(
            organizationId,
          ),
      });
    },
  });
}