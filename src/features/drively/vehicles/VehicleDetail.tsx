// src/features/drively/vehicles/VehicleDetail.tsx

import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Car,
  Loader2,
  Pencil,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";

import {
  Vehicle,
  vehiclesApi,
} from "./vehiclesApi";

export default function VehicleDetail() {
  const navigate = useNavigate();

  const { vehicleId } = useParams<{
    vehicleId: string;
  }>();

  const { profile } = useAuth();

  const organizationId =
    profile?.organization_id || "";

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!organizationId) {
      setError(
        "Organization not available",
      );
      setLoading(false);
      return;
    }

    if (!vehicleId) {
      setError("Invalid vehicle");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadVehicle = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await vehiclesApi.get(
            organizationId,
            vehicleId,
          );

        if (!cancelled) {
          setVehicle(data);
        }
      } catch (err: any) {
        console.error(
          "Failed to load vehicle:",
          err,
        );

        if (!cancelled) {
          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Failed to load vehicle",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadVehicle();

    return () => {
      cancelled = true;
    };
  }, [
    organizationId,
    vehicleId,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() =>
              navigate("/vehicles")
            }
            className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Vehicles
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error ||
              "Vehicle not found"}
          </div>
        </div>
      </div>
    );
  }

  const registrationNumber =
    vehicle.registration_number ||
    "No registration number";

  const customerName =
    (vehicle as any).customer
      ?.name ||
    (vehicle as any).customer_name ||
    "—";

  const makeModel = [
    vehicle.make,
    vehicle.model,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate("/vehicles")
              }
              className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Vehicles
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Car className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  {registrationNumber}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {makeModel ||
                    "Vehicle Details"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/vehicles/${vehicle.id}/edit`,
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 sm:w-auto"
          >
            <Pencil className="h-4 w-4" />
            Edit Vehicle
          </button>
        </div>

        {/* STATUS */}

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              vehicle.is_active !== false
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {vehicle.is_active !== false
              ? "Active"
              : "Inactive"}
          </span>

          {vehicle.status && (
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-700">
              {vehicle.status}
            </span>
          )}
        </div>

        {/* VEHICLE INFORMATION */}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-gray-50 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Vehicle Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <Detail
              label="Registration Number"
              value={
                vehicle.registration_number
              }
            />

            <Detail
              label="Make"
              value={vehicle.make}
            />

            <Detail
              label="Model"
              value={vehicle.model}
            />

            <Detail
              label="Variant"
              value={
                (vehicle as any).variant
              }
            />

            <Detail
              label="Year"
              value={
                vehicle.year !==
                  undefined &&
                vehicle.year !== null
                  ? String(vehicle.year)
                  : null
              }
            />

            <Detail
              label="Color"
              value={vehicle.color}
            />

            <Detail
              label="Fuel Type"
              value={vehicle.fuel_type}
              capitalize
            />

            <Detail
              label="Transmission"
              value={
                vehicle.transmission
              }
              capitalize
            />

            <Detail
              label="Status"
              value={vehicle.status}
              capitalize
            />
          </div>
        </section>

        {/* CUSTOMER */}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-gray-50 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Customer
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
            <Detail
              label="Customer"
              value={customerName}
            />

            <Detail
              label="Customer ID"
              value={
                vehicle.customer_id
              }
            />
          </div>
        </section>

        {/* IDENTIFICATION */}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-gray-50 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Vehicle Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
            <Detail
              label="VIN / Chassis Number"
              value={
                (vehicle as any)
                  .vin_number ||
                (vehicle as any)
                  .chassis_number
              }
            />

            <Detail
              label="Engine Number"
              value={
                (vehicle as any)
                  .engine_number
              }
            />
          </div>
        </section>

        {/* ADDITIONAL INFORMATION */}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-gray-50 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Additional Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
            <Detail
              label="Odometer"
              value={
                (vehicle as any)
                  .odometer !==
                  undefined &&
                (vehicle as any)
                  .odometer !== null
                  ? `${(vehicle as any).odometer} km`
                  : null
              }
            />

            <Detail
              label="Last Service Date"
              value={
                (vehicle as any)
                  .last_service_date
              }
            />

            <Detail
              label="Created"
              value={formatDate(
                vehicle.created_at,
              )}
            />

            <Detail
              label="Last Updated"
              value={formatDate(
                vehicle.updated_at,
              )}
            />

            <div className="sm:col-span-2">
              <Detail
                label="Notes"
                value={vehicle.notes}
              />
            </div>
          </div>
        </section>
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
  value?:
    | string
    | number
    | null;
  capitalize?: boolean;
}) {
  const displayValue =
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
      ? String(value)
      : "—";

  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div
        className={`break-words text-sm font-medium text-gray-900 ${
          capitalize
            ? "capitalize"
            : ""
        }`}
      >
        {displayValue}
      </div>
    </div>
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return date.toLocaleString();
}