import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CreateVehicleInput,
  UpdateVehicleInput,
  vehiclesApi,
} from "./vehiclesApi";

export const VEHICLE_QUERY_KEYS = {
  all: ["vehicles"] as const,

  organization: (
    organizationId: string,
  ) =>
    [
      ...VEHICLE_QUERY_KEYS.all,
      organizationId,
    ] as const,

  lists: (
    organizationId: string,
  ) =>
    [
      ...VEHICLE_QUERY_KEYS.organization(
        organizationId,
      ),
      "list",
    ] as const,

  list: (
    organizationId: string,
    page: number,
    limit: number,
    search: string,
    customerId: string,
  ) =>
    [
      ...VEHICLE_QUERY_KEYS.lists(
        organizationId,
      ),
      page,
      limit,
      search,
      customerId,
    ] as const,

  details: (
    organizationId: string,
  ) =>
    [
      ...VEHICLE_QUERY_KEYS.organization(
        organizationId,
      ),
      "detail",
    ] as const,

  detail: (
    organizationId: string,
    vehicleId: string,
  ) =>
    [
      ...VEHICLE_QUERY_KEYS.details(
        organizationId,
      ),
      vehicleId,
    ] as const,
};

export function useVehicles(
  organizationId: string,
  page = 1,
  limit = 10,
  search = "",
  customerId = "",
) {
  return useQuery({
    queryKey:
      VEHICLE_QUERY_KEYS.list(
        organizationId,
        page,
        limit,
        search,
        customerId,
      ),

    queryFn: () =>
      vehiclesApi.list(
        organizationId,
        page,
        limit,
        search,
        customerId,
      ),

    enabled: !!organizationId,
  });
}

export function useVehicle(
  organizationId: string,
  vehicleId: string,
) {
  return useQuery({
    queryKey:
      VEHICLE_QUERY_KEYS.detail(
        organizationId,
        vehicleId,
      ),

    queryFn: () =>
      vehiclesApi.get(
        organizationId,
        vehicleId,
      ),

    enabled:
      !!organizationId &&
      !!vehicleId,
  });
}

export function useCreateVehicle(
  organizationId: string,
) {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CreateVehicleInput,
    ) =>
      vehiclesApi.create(
        organizationId,
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          VEHICLE_QUERY_KEYS.lists(
            organizationId,
          ),
      });
    },
  });
}

export function useUpdateVehicle(
  organizationId: string,
  vehicleId: string,
) {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: UpdateVehicleInput,
    ) =>
      vehiclesApi.update(
        organizationId,
        vehicleId,
        payload,
      ),

    onSuccess: async (
      updatedVehicle,
    ) => {
      queryClient.setQueryData(
        VEHICLE_QUERY_KEYS.detail(
          organizationId,
          vehicleId,
        ),
        updatedVehicle,
      );

      await queryClient.invalidateQueries({
        queryKey:
          VEHICLE_QUERY_KEYS.lists(
            organizationId,
          ),
      });
    },
  });
}

export function useDeleteVehicle(
  organizationId: string,
) {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      vehicleId: string,
    ) =>
      vehiclesApi.remove(
        organizationId,
        vehicleId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          VEHICLE_QUERY_KEYS.lists(
            organizationId,
          ),
      });
    },
  });
}