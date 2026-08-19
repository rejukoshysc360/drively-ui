import { api } from "../../../lib/axios";

export type Vehicle = {
  id: string;
  organization_id: string;
  customer_id: string;

  registration_number: string;
  vin?: string | null;

  make?: string | null;
  model?: string | null;
  variant?: string | null;
  model_year?: number | null;

  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;

  current_mileage: number;

  warranty_start_date?: string | null;
  warranty_end_date?: string | null;

  notes?: string | null;
  is_active?: boolean;

  created_by?: string | null;
  updated_by?: string | null;

  created_at?: string;
  updated_at?: string;

  customer?: {
    id: string;
    name: string;
    customer_code?: string | null;
    mobile?: string | null;
    email?: string | null;
  } | null;
};

export type CreateVehicleInput = {
  customer_id: string;

  registration_number: string;
  vin?: string | null;

  make?: string | null;
  model?: string | null;
  variant?: string | null;
  model_year?: number | null;

  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;

  current_mileage?: number;

  warranty_start_date?: string | null;
  warranty_end_date?: string | null;

  notes?: string | null;
  is_active?: boolean;
};

export type UpdateVehicleInput =
  Partial<CreateVehicleInput>;

export type VehiclesResponse = {
  vehicles: Vehicle[];

  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (organizationId: string) =>
  `/organization/${organizationId}/vehicles`;

export async function listVehicles(
  organizationId: string,
  page: number,
  limit: number,
  search?: string,
  customerId?: string,
  isActive?: boolean,
): Promise<VehiclesResponse> {
  const params: Record<string, any> = {
    page,
    limit,
  };

  if (search && search.trim()) {
    params.search = search.trim();
  }

  if (customerId) {
    params.customer_id = customerId;
  }

  if (typeof isActive === "boolean") {
    params.is_active = isActive;
  }

  const { data } = await api.get(
    base(organizationId),
    {
      params,
    },
  );

  if (data?.paginationMetaInfo) {
    return {
      vehicles:
        data.vehicles ??
        data.list ??
        data.data ??
        [],

      paginationMetaInfo:
        data.paginationMetaInfo,
    };
  }

  const all: Vehicle[] =
    Array.isArray(data)
      ? data
      : data?.vehicles ?? [];

  const start =
    (page - 1) * limit;

  const paged = all.slice(
    start,
    start + limit,
  );

  return {
    vehicles: paged,

    paginationMetaInfo: {
      totalCount: all.length,

      totalPages: Math.max(
        1,
        Math.ceil(
          all.length / limit,
        ),
      ),

      currentPage: page,
      limit,
    },
  };
}

export const vehiclesApi = {
  list: listVehicles,

  get: async (
    organizationId: string,
    vehicleId: string,
  ): Promise<Vehicle> => {
    const { data } = await api.get(
      `${base(
        organizationId,
      )}/${vehicleId}`,
    );

    return data?.vehicle ?? data;
  },

  create: async (
    organizationId: string,
    input: CreateVehicleInput,
  ): Promise<Vehicle> => {
    const { data } = await api.post(
      base(organizationId),
      input,
    );

    return data?.vehicle ?? data;
  },

  update: async (
    organizationId: string,
    vehicleId: string,
    input: UpdateVehicleInput,
  ): Promise<Vehicle> => {
    const { data } = await api.patch(
      `${base(
        organizationId,
      )}/${vehicleId}`,
      input,
    );

    return data?.vehicle ?? data;
  },

  remove: async (
    organizationId: string,
    vehicleId: string,
  ): Promise<{ message: string }> => {
    const { data } = await api.delete(
      `${base(
        organizationId,
      )}/${vehicleId}`,
    );

    return data;
  },
};