// src/features/customers/CustomerDetail.tsx

import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useCustomer } from "./useCustomers";

export default function CustomerDetail() {
  const navigate = useNavigate();

  const { customerId } = useParams<{
    customerId: string;
  }>();

  const { profile } = useAuth();

  const organizationId =
    profile?.organization_id || "";

  const {
    data: customer,
    isLoading,
    isFetching,
    error,
  } = useCustomer(
    organizationId,
    customerId || "",
  );

  if (!organizationId) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Organization not available
        </div>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Invalid customer
        </div>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="p-4 sm:p-6">
        Loading customer...
      </div>
    );
  }

  if (error || !customer) {
    const errorMessage =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      "Customer not found";

    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate("/customers")
              }
              className="mb-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Customers
            </button>

            <h1 className="text-2xl font-semibold text-gray-900">
              {customer.name}
            </h1>

            <div className="mt-1 text-sm text-gray-500">
              {customer.customer_code ||
                "No customer code"}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/customers/${customer.id}/edit`,
              )
            }
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Edit Customer
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold text-gray-900">
                Customer Information
              </h2>

              <span
                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                  customer.is_active !== false
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {customer.is_active !== false
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <Detail
              label="Customer Code"
              value={customer.customer_code}
            />

            <Detail
              label="Customer Type"
              value={customer.customer_type}
              capitalize
            />

            <Detail
              label="Customer Name"
              value={customer.name}
            />

            <Detail
              label="Mobile"
              value={customer.mobile}
            />

            <Detail
              label="Alternate Mobile"
              value={customer.alternate_mobile}
            />

            <Detail
              label="Email"
              value={customer.email}
            />

            <Detail
              label="Tax Number"
              value={customer.tax_number}
            />

            <Detail
              label="City"
              value={customer.city}
            />

            <Detail
              label="State"
              value={customer.state}
            />

            <Detail
              label="Country"
              value={customer.country}
            />

            <Detail
              label="Postal Code"
              value={customer.postal_code}
            />

            <Detail
              label="Outstanding Balance"
              value={String(
                customer.outstanding_balance ?? 0,
              )}
            />

            <div className="md:col-span-2">
              <Detail
                label="Address"
                value={customer.address}
              />
            </div>

            <div className="md:col-span-2">
              <Detail
                label="Notes"
                value={customer.notes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value?: string | null;
  capitalize?: boolean;
}) {
  return (
    <div className="border-b border-gray-100 p-4 sm:p-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>

      <div
        className={`break-words text-sm text-gray-900 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}