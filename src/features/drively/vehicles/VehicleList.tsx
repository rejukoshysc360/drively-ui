// src/features/drively/vehicles/VehicleList.tsx

import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Car,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { useAuth } from "../../auth/AuthProvider";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

import {
  useDeleteVehicle,
  useVehicles,
} from "./useVehicles";

import type { Vehicle } from "./vehiclesApi";

const PAGE_SIZE = 10;

export default function VehicleList() {
  const navigate = useNavigate();

  const { profile } = useAuth();

  const organizationId =
    profile?.organization_id || "";

  const [page, setPage] =
    useState(1);

  const [search, setSearch] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<Vehicle | null>(
    null,
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useVehicles(
    organizationId,
    page,
    PAGE_SIZE,
    search,
  );

  const deleteMutation =
    useDeleteVehicle(
      organizationId,
    );

  const vehicles =
    data?.vehicles ?? [];

  const totalPages =
    data?.paginationMetaInfo
      ?.totalPages ?? 1;

  const totalCount =
    data?.paginationMetaInfo
      ?.totalCount ?? 0;

  useEffect(() => {
    if (
      page > totalPages &&
      totalPages > 0
    ) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSearch = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setPage(1);
    setSearch(
      searchInput.trim(),
    );
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleDelete = (
    vehicle: Vehicle,
  ) => {
    setDeleteTarget(vehicle);
  };

  const confirmDelete =
    async () => {
      if (!deleteTarget) {
        return;
      }

      try {
        await deleteMutation.mutateAsync(
          deleteTarget.id,
        );

        toast.success(
          "Vehicle deleted",
        );

        setDeleteTarget(null);
      } catch (err: any) {
        toast.error(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Failed to delete vehicle",
        );
      }
    };

  const getCustomerName = (
    vehicle: Vehicle,
  ) => {
    const customer = (
      vehicle as any
    ).customer;

    if (Array.isArray(customer)) {
      return (
        customer[0]?.name ||
        "—"
      );
    }

    return (
      customer?.name ||
      "—"
    );
  };

  const getVehicleName = (
    vehicle: Vehicle,
  ) => {
    const name = [
      vehicle.make,
      vehicle.model,
      vehicle.variant,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      name ||
      vehicle.registration_number ||
      "Vehicle"
    );
  };

  if (!organizationId) {
    return (
      <div className="p-4 sm:p-6">
        Organization not available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              <Car className="h-6 w-6 text-indigo-600" />

              Vehicles
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {totalCount} vehicle
              {totalCount === 1
                ? ""
                : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/vehicles/create",
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />

            Add Vehicle
          </button>
        </div>

        {/* SEARCH */}

        <form
          onSubmit={handleSearch}
          className="rounded-xl border bg-white p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={
                searchInput
              }
              onChange={(e) =>
                setSearchInput(
                  e.target.value,
                )
              }
              placeholder="Search registration, VIN, make or model"
              className="input w-full sm:max-w-xl"
            />

            <button
              type="submit"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Search
            </button>

            {(search ||
              searchInput) && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* ERROR */}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load vehicles
          </div>
        )}

        {/* MOBILE */}

        <div className="md:hidden">
          {isLoading ? (
            <div className="flex justify-center rounded-xl border bg-white py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : vehicles.length ===
            0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              No vehicles found
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(
                (vehicle) => (
                  <div
                    key={
                      vehicle.id
                    }
                    className="rounded-xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/vehicles/${vehicle.id}`,
                            )
                          }
                          className="block max-w-full text-left"
                        >
                          <div className="truncate font-semibold text-gray-900">
                            {getVehicleName(
                              vehicle,
                            )}
                          </div>
                        </button>

                        <div className="mt-1 text-xs font-mono text-indigo-600">
                          {vehicle.registration_number ||
                            "No registration number"}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          vehicle.is_active !==
                          false
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {vehicle.is_active !==
                        false
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-400">
                          Customer
                        </div>

                        <div className="mt-1 text-gray-700">
                          {getCustomerName(
                            vehicle,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">
                          VIN
                        </div>

                        <div className="mt-1 break-all text-gray-700">
                          {vehicle.vin ||
                            "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">
                          Make / Model
                        </div>

                        <div className="mt-1 text-gray-700">
                          {[
                            vehicle.make,
                            vehicle.model,
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " ",
                            ) ||
                            "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">
                          Model Year
                        </div>

                        <div className="mt-1 text-gray-700">
                          {vehicle.model_year ??
                            "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">
                          Mileage
                        </div>

                        <div className="mt-1 text-gray-700">
                          {vehicle.current_mileage !==
                            null &&
                          vehicle.current_mileage !==
                            undefined
                            ? Number(
                                vehicle.current_mileage,
                              ).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/vehicles/${vehicle.id}`,
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />

                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/vehicles/${vehicle.id}/edit`,
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                      >
                        <Pencil className="h-4 w-4" />

                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            vehicle,
                          )
                        }
                        disabled={
                          deleteMutation.isPending
                        }
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />

                        Delete
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
          <div className="grid grid-cols-8 gap-4 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500">
            <div>
              Registration
            </div>

            <div>
              Vehicle
            </div>

            <div>
              Customer
            </div>

            <div>
              VIN
            </div>

            <div>
              Year
            </div>

            <div>
              Mileage
            </div>

            <div>
              Status
            </div>

            <div className="text-right">
              Actions
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : vehicles.length ===
            0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No vehicles found
            </div>
          ) : (
            vehicles.map(
              (vehicle) => (
                <div
                  key={
                    vehicle.id
                  }
                  className="grid grid-cols-8 items-center gap-4 border-b px-4 py-4 last:border-none hover:bg-gray-50"
                >
                  <div className="text-xs font-mono text-indigo-600">
                    {vehicle.registration_number ||
                      "—"}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/vehicles/${vehicle.id}`,
                        )
                      }
                      className="text-left font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {getVehicleName(
                        vehicle,
                      )}
                    </button>

                    {vehicle.color && (
                      <div className="mt-1 text-xs text-gray-500">
                        {
                          vehicle.color
                        }
                      </div>
                    )}
                  </div>

                  <div className="truncate text-sm text-gray-600">
                    {getCustomerName(
                      vehicle,
                    )}
                  </div>

                  <div className="truncate text-sm text-gray-600">
                    {vehicle.vin ||
                      "—"}
                  </div>

                  <div className="text-sm text-gray-600">
                    {vehicle.model_year ??
                      "—"}
                  </div>

                  <div className="text-sm text-gray-600">
                    {vehicle.current_mileage !==
                      null &&
                    vehicle.current_mileage !==
                      undefined
                      ? Number(
                          vehicle.current_mileage,
                        ).toLocaleString()
                      : "—"}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        vehicle.is_active !==
                        false
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {vehicle.is_active !==
                      false
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/vehicles/${vehicle.id}`,
                        )
                      }
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/vehicles/${vehicle.id}/edit`,
                        )
                      }
                      className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          vehicle,
                        )
                      }
                      disabled={
                        deleteMutation.isPending
                      }
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ),
            )
          )}

          {isFetching &&
            !isLoading && (
              <div className="flex justify-center border-t py-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              </div>
            )}
        </div>

        {/* PAGINATION */}

        {totalCount >
          PAGE_SIZE && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() =>
                setPage((p) =>
                  Math.max(
                    1,
                    p - 1,
                  ),
                )
              }
              disabled={
                page === 1 ||
                isFetching
              }
              className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-center text-sm text-gray-600">
              Page {page} of{" "}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage(
                  (p) => p + 1,
                )
              }
              disabled={
                page >=
                  totalPages ||
                isFetching
              }
              className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* DELETE CONFIRM */}

        <ConfirmDialog
          open={
            !!deleteTarget
          }
          title="Delete Vehicle"
          description={`Delete "${
            deleteTarget
              ? getVehicleName(
                  deleteTarget,
                )
              : ""
          }"?`}
          confirmLabel="Delete"
          danger
          isLoading={
            deleteMutation.isPending
          }
          onConfirm={
            confirmDelete
          }
          onClose={() =>
            setDeleteTarget(
              null,
            )
          }
        />
      </div>
    </div>
  );
}