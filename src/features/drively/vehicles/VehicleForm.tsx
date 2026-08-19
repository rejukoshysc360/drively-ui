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
  CreateVehicleInput,
} from "./vehiclesApi";

import {
  useCreateVehicle,
  useUpdateVehicle,
  useVehicle,
} from "./useVehicles";

import {
  useCustomers,
} from "../customers/useCustomers";

const initialForm: CreateVehicleInput = {
  customer_id: "",
  registration_number: "",
  vin: "",
  make: "",
  model: "",
  variant: "",
  model_year: undefined,
  color: "",
  fuel_type: "",
  transmission: "",
  current_mileage: 0,
  warranty_start_date: "",
  warranty_end_date: "",
  notes: "",
  is_active: true,
};

export default function VehicleForm() {
  const navigate = useNavigate();

  const { vehicleId } =
    useParams();

  const { profile } =
    useAuth();

  const organizationId =
    profile?.organization_id || "";

  const isEdit =
    Boolean(vehicleId);

  const {
    data: vehicle,
    isLoading: loadingVehicle,
    error: vehicleError,
  } = useVehicle(
    organizationId,
    vehicleId || "",
  );

  const {
    data: customersData,
    isLoading: customersLoading,
  } = useCustomers(
    organizationId,
    1,
    100,
    "",
  );

  const customers =
    customersData?.customers ?? [];

  const createMutation =
    useCreateVehicle(
      organizationId,
    );

  const updateMutation =
    useUpdateVehicle(
      organizationId,
      vehicleId || "",
    );

  const [form, setForm] =
    useState<CreateVehicleInput>(
      initialForm,
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!vehicle) {
      return;
    }

    setForm({
      customer_id:
        vehicle.customer_id || "",

      registration_number:
        vehicle.registration_number ||
        "",

      vin:
        vehicle.vin ?? "",

      make:
        vehicle.make ?? "",

      model:
        vehicle.model ?? "",

      variant:
        vehicle.variant ?? "",

      model_year:
        vehicle.model_year ??
        undefined,

      color:
        vehicle.color ?? "",

      fuel_type:
        vehicle.fuel_type ?? "",

      transmission:
        vehicle.transmission ?? "",

      current_mileage:
        Number(
          vehicle.current_mileage ??
            0,
        ),

      warranty_start_date:
        vehicle.warranty_start_date ??
        "",

      warranty_end_date:
        vehicle.warranty_end_date ??
        "",

      notes:
        vehicle.notes ?? "",

      is_active:
        vehicle.is_active !== false,
    });
  }, [vehicle]);

  const updateField = <
    K extends keyof CreateVehicleInput,
  >(
    field: K,
    value: CreateVehicleInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const normalizeOptionalString = (
    value?: string | null,
  ) => {
    const trimmed =
      value?.trim();

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

    if (!form.customer_id) {
      setError(
        "Customer is required",
      );
      return;
    }

    if (
      !form.registration_number.trim()
    ) {
      setError(
        "Registration number is required",
      );
      return;
    }

    setError("");

    const payload: CreateVehicleInput =
      {
        customer_id:
          form.customer_id,

        registration_number:
          form.registration_number
            .trim()
            .toUpperCase(),

        vin:
          normalizeOptionalString(
            form.vin,
          ),

        make:
          normalizeOptionalString(
            form.make,
          ),

        model:
          normalizeOptionalString(
            form.model,
          ),

        variant:
          normalizeOptionalString(
            form.variant,
          ),

        model_year:
          form.model_year
            ? Number(
                form.model_year,
              )
            : null,

        color:
          normalizeOptionalString(
            form.color,
          ),

        fuel_type:
          normalizeOptionalString(
            form.fuel_type,
          ),

        transmission:
          normalizeOptionalString(
            form.transmission,
          ),

        current_mileage:
          Number(
            form.current_mileage ||
              0,
          ),

        warranty_start_date:
          normalizeOptionalString(
            form.warranty_start_date,
          ),

        warranty_end_date:
          normalizeOptionalString(
            form.warranty_end_date,
          ),

        notes:
          normalizeOptionalString(
            form.notes,
          ),

        is_active:
          form.is_active !== false,
      };

    try {
      if (
        isEdit &&
        vehicleId
      ) {
        await updateMutation.mutateAsync(
          payload,
        );
      } else {
        await createMutation.mutateAsync(
          payload,
        );
      }

      navigate("/vehicles");
    } catch (err: any) {
      console.error(
        "Vehicle save failed:",
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to save vehicle",
      );
    }
  };

  const saving =
    createMutation.isPending ||
    updateMutation.isPending;

  if (
    isEdit &&
    loadingVehicle
  ) {
    return (
      <div className="p-6">
        Loading vehicle...
      </div>
    );
  }

  if (
    isEdit &&
    vehicleError
  ) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load vehicle
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
              ? "Edit Vehicle"
              : "Add Vehicle"}
          </h1>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Customer
              </label>

              <select
                required
                value={
                  form.customer_id
                }
                disabled={
                  customersLoading
                }
                onChange={(e) =>
                  updateField(
                    "customer_id",
                    e.target.value,
                  )
                }
                className="input w-full"
              >
                <option value="">
                  {customersLoading
                    ? "Loading customers..."
                    : "Select customer"}
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                    >
                      {customer.name}
                      {customer.mobile
                        ? ` - ${customer.mobile}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Registration Number
              </label>

              <input
                required
                value={
                  form.registration_number
                }
                onChange={(e) =>
                  updateField(
                    "registration_number",
                    e.target.value.toUpperCase(),
                  )
                }
                className="input w-full uppercase"
                placeholder="KL-07-AB-1234"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                VIN
              </label>

              <input
                value={
                  form.vin ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "vin",
                    e.target.value,
                  )
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Make
              </label>

              <input
                value={
                  form.make ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "make",
                    e.target.value,
                  )
                }
                className="input w-full"
                placeholder="Toyota"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Model
              </label>

              <input
                value={
                  form.model ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "model",
                    e.target.value,
                  )
                }
                className="input w-full"
                placeholder="Innova"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Variant
              </label>

              <input
                value={
                  form.variant ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "variant",
                    e.target.value,
                  )
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Model Year
              </label>

              <input
                type="number"
                min="1900"
                max="2100"
                value={
                  form.model_year ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "model_year",
                    e.target.value
                      ? Number(
                          e.target
                            .value,
                        )
                      : undefined,
                  )
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Color
              </label>

              <input
                value={
                  form.color ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "color",
                    e.target.value,
                  )
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Fuel Type
              </label>

              <select
                value={
                  form.fuel_type ?? ""
                }
                onChange={(e) =>
                  updateField(
                    "fuel_type",
                    e.target.value,
                  )
                }
                className="input w-full"
              >
                <option value="">
                  Select fuel type
                </option>

                <option value="petrol">
                  Petrol
                </option>

                <option value="diesel">
                  Diesel
                </option>

                <option value="electric">
                  Electric
                </option>

                <option value="hybrid">
                  Hybrid
                </option>

                <option value="cng">
                  CNG
                </option>

                <option value="lpg">
                  LPG
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Transmission
              </label>

              <select
                value={
                  form.transmission ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "transmission",
                    e.target.value,
                  )
                }
                className="input w-full"
              >
                <option value="">
                  Select transmission
                </option>

                <option value="manual">
                  Manual
                </option>

                <option value="automatic">
                  Automatic
                </option>

                <option value="amt">
                  AMT
                </option>

                <option value="cvt">
                  CVT
                </option>

                <option value="dct">
                  DCT
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Current Mileage
              </label>

              <input
                type="number"
                min="0"
                value={
                  form.current_mileage ??
                  0
                }
                onChange={(e) =>
                  updateField(
                    "current_mileage",
                    Number(
                      e.target.value,
                    ),
                  )
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Warranty Start Date
              </label>

              <input
                type="date"
                value={
                  form.warranty_start_date ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "warranty_start_date",
                    e.target.value,
                  )
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Warranty End Date
              </label>

              <input
                type="date"
                value={
                  form.warranty_end_date ??
                  ""
                }
                onChange={(e) =>
                  updateField(
                    "warranty_end_date",
                    e.target.value,
                  )
                }
                className="input w-full"
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
                  Active Vehicle
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
                className="input w-full"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                navigate(
                  "/vehicles",
                )
              }
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Vehicle"
                  : "Create Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}