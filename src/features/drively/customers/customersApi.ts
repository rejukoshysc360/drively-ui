// src/features/customers/customersApi.ts

import { api } from "../../../lib/axios";

export type CustomerType =
  | "individual"
  | "business";

export type Customer = {
  id: string;
  organization_id: string;
  customer_code?: string | null;
  customer_type: CustomerType;
  name: string;
  mobile?: string | null;
  alternate_mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  tax_number?: string | null;
  outstanding_balance?: number;
  notes?: string | null;
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateCustomerInput = {
  customer_code?: string | null;
  customer_type: CustomerType;
  name: string;
  mobile?: string | null;
  alternate_mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  tax_number?: string | null;
  outstanding_balance?: number;
  notes?: string | null;
  is_active?: boolean;
};

export type UpdateCustomerInput =
  Partial<CreateCustomerInput>;

export type CustomerFormData =
  CreateCustomerInput;

export type CustomersResponse = {
  customers: Customer[];

  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (
  organizationId: string,
) =>
  `/organization/${organizationId}/customers`;

export async function getCustomers(
  organizationId: string,
  page: number,
  limit: number,
  search?: string,
  isActive?: boolean,
): Promise<CustomersResponse> {
  const params: Record<string, any> = {
    page,
    limit,
  };

  if (search?.trim()) {
    params.search = search.trim();
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
      customers:
        data.customers ??
        data.list ??
        data.data ??
        [],

      paginationMetaInfo:
        data.paginationMetaInfo,
    };
  }

  const all: Customer[] =
    Array.isArray(data)
      ? data
      : data?.customers ?? [];

  const start =
    (page - 1) * limit;

  const paged =
    all.slice(
      start,
      start + limit,
    );

  return {
    customers: paged,

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

export async function getCustomer(
  organizationId: string,
  customerId: string,
): Promise<Customer> {
  const { data } = await api.get(
    `${base(
      organizationId,
    )}/${customerId}`,
  );

  return data?.customer ?? data;
}

export async function createCustomer(
  organizationId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  const { data } = await api.post(
    base(organizationId),
    input,
  );

  return data?.customer ?? data;
}

export async function updateCustomer(
  organizationId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const { data } = await api.patch(
    `${base(
      organizationId,
    )}/${customerId}`,
    input,
  );

  return data?.customer ?? data;
}

export async function deleteCustomer(
  organizationId: string,
  customerId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete(
    `${base(
      organizationId,
    )}/${customerId}`,
  );

  return data;
}

export const customersApi = {
  list: getCustomers,
  get: getCustomer,
  create: createCustomer,
  update: updateCustomer,
  remove: deleteCustomer,
};