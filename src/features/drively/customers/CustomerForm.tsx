import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";

import {
  CreateCustomerInput,
  CustomerType,
} from "./customersApi";

import {
  useCreateCustomer,
  useCustomer,
  useUpdateCustomer,
} from "./useCustomers";

const initialForm: CreateCustomerInput = {
  customer_code: "",
  customer_type: "individual",
  name: "",
  mobile: "",
  alternate_mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
  tax_number: "",
  outstanding_balance: 0,
  notes: "",
  is_active: true,
};

export default function CustomerForm() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const { profile } = useAuth();

  const organizationId =
    profile?.organization_id || "";

  const isEdit = Boolean(customerId);

  const {
    data: customer,
    isLoading: loadingCustomer,
    error: customerError,
  } = useCustomer(
    organizationId,
    customerId || "",
  );

  const createMutation =
    useCreateCustomer(organizationId);

  const updateMutation =
    useUpdateCustomer(
      organizationId,
      customerId || "",
    );

  const [form, setForm] =
    useState<CreateCustomerInput>(
      initialForm,
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!customer) {
      return;
    }

    setForm({
      customer_code:
        customer.customer_code ?? "",

      customer_type:
        customer.customer_type ??
        "individual",

      name:
        customer.name ?? "",

      mobile:
        customer.mobile ?? "",

      alternate_mobile:
        customer.alternate_mobile ?? "",

      email:
        customer.email ?? "",

      address:
        customer.address ?? "",

      city:
        customer.city ?? "",

      state:
        customer.state ?? "",

      country:
        customer.country ?? "",

      postal_code:
        customer.postal_code ?? "",

      tax_number:
        customer.tax_number ?? "",

      outstanding_balance:
        Number(
          customer.outstanding_balance ??
            0,
        ),

      notes:
        customer.notes ?? "",

      is_active:
        customer.is_active !== false,
    });
  }, [customer]);

  const updateField = <
    K extends keyof CreateCustomerInput,
  >(
    field: K,
    value: CreateCustomerInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const normalizeOptionalString = (
    value?: string | null,
  ) => {
    const trimmed = value?.trim();

    return trimmed
      ? trimmed
      : null;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!organizationId) {
      setError(
        "Organization not available",
      );
      return;
    }

    if (!form.name.trim()) {
      setError(
        "Customer name is required",
      );
      return;
    }

    setError("");

    const payload: CreateCustomerInput =
      {
        customer_code:
          normalizeOptionalString(
            form.customer_code,
          ),

        customer_type:
          form.customer_type,

        name:
          form.name.trim(),

        mobile:
          normalizeOptionalString(
            form.mobile,
          ),

        alternate_mobile:
          normalizeOptionalString(
            form.alternate_mobile,
          ),

        email:
          normalizeOptionalString(
            form.email,
          ),

        address:
          normalizeOptionalString(
            form.address,
          ),

        city:
          normalizeOptionalString(
            form.city,
          ),

        state:
          normalizeOptionalString(
            form.state,
          ),

        country:
          normalizeOptionalString(
            form.country,
          ),

        postal_code:
          normalizeOptionalString(
            form.postal_code,
          ),

        tax_number:
          normalizeOptionalString(
            form.tax_number,
          ),

        outstanding_balance:
          Number(
            form.outstanding_balance ||
              0,
          ),

        notes:
          normalizeOptionalString(
            form.notes,
          ),

        is_active:
          form.is_active !== false,
      };

    try {
      if (isEdit && customerId) {
        await updateMutation.mutateAsync(
          payload,
        );
      } else {
        await createMutation.mutateAsync(
          payload,
        );
      }

      navigate("/customers");
    } catch (err: any) {
      console.error(
        "Customer save failed:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save customer",
      );
    }
  };

  const saving =
    createMutation.isPending ||
    updateMutation.isPending;

  if (
    isEdit &&
    loadingCustomer
  ) {
    return (
      <div className="p-6">
        Loading customer...
      </div>
    );
  }

  if (
    isEdit &&
    customerError
  ) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load customer
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Organization not available
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold sm:text-2xl">
            {isEdit
              ? "Edit Customer"
              : "Add Customer"}
          </h1>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Customer Type
              </label>

              <select
                value={
                  form.customer_type
                }
                onChange={(e) =>
                  updateField(
                    "customer_type",
                    e.target
                      .value as CustomerType,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="individual">
                  Individual
                </option>

                <option value="business">
                  Business
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Customer Code
              </label>

              <input
                value={
                  form.customer_code ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "customer_code",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Customer code"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                {form.customer_type ===
                "business"
                  ? "Business Name"
                  : "Customer Name"}
              </label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Mobile
              </label>

              <input
                type="tel"
                value={
                  form.mobile ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "mobile",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Alternate Mobile
              </label>

              <input
                type="tel"
                value={
                  form.alternate_mobile ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "alternate_mobile",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={
                  form.email ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Tax Number
              </label>

              <input
                value={
                  form.tax_number ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "tax_number",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Address
              </label>

              <textarea
                rows={3}
                value={
                  form.address ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "address",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                City
              </label>

              <input
                value={
                  form.city ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "city",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                State
              </label>

              <input
                value={
                  form.state ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "state",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Country
              </label>

              <input
                value={
                  form.country ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "country",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Postal Code
              </label>

              <input
                value={
                  form.postal_code ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "postal_code",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Opening / Outstanding Balance
              </label>

              <input
                type="number"
                step="0.01"
                value={
                  form.outstanding_balance ??
                  0
                }
                onChange={(e) =>
                  updateField(
                    "outstanding_balance",
                    Number(
                      e.target.value,
                    ),
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    form.is_active !==
                    false
                  }
                  onChange={(e) =>
                    updateField(
                      "is_active",
                      e.target.checked,
                    )
                  }
                />

                <span className="text-sm font-medium">
                  Active Customer
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Notes
              </label>

              <textarea
                rows={4}
                value={
                  form.notes ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "notes",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                navigate("/customers")
              }
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Customer"
                  : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}