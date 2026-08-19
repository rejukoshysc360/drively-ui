import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import debounce from "lodash/debounce";
import Select from "react-select";

import {
  Plus,
  Loader2,
  DollarSign,
  CheckCircle2,
  FileText,
  XCircle,
  UserCheck,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { APP_CONFIG } from "../../config/appConfig";
import DataTable from "../../components/ui/DataTable";
import { getReasonLabel } from "../../utils/getReasonLabel";
import FormDialog from "../../components/ui/FormDialog";
import {
  useFinalSettlements,
  useCreateFinalSettlement,
  useUpdateFinalSettlementStatus,
  useCancelFinalSettlement,
} from "./hooks";
import { useEmployeeEmployment } from "../employees/employment/hooks";
import { useFinalSettlementEmployees } from "../employees/hooks";
import FinalSettlementPreviewModal from "./FinalSettlementPreviewModal";
import { useAuth } from "../auth/AuthProvider";
import { useCan } from "../../utils/permissions";

type Row = {
  id: string;
  employee?: { full_name: string; email: string };
  last_working_date?: string;
  total_payable?: number;
  reason?: string;
  status: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function FinalSettlementsList() {
  const nav = useNavigate();
  const can = useCan();

  const canViewAll = can("final-settlement:view");
  if (!canViewAll) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-.01-10a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            You do not have permission to view this page. Please contact your HR
            or Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const { data: employment } = useEmployeeEmployment(selectedEmployeeId || "");

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [approveTarget, setApproveTarget] = useState<Row | null>(null);
  const [payTarget, setPayTarget] = useState<Row | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Row | null>(null);
  const [createDialog, setCreateDialog] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSettlement, setSelectedSettlement] = useState<Row | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    organization_currency,
    organization_id,
    organization_country_code,
    organization_name,
  } = useAuth();
  const { data, isFetching, isLoading } = useFinalSettlements({
    page,
    limit,
    search: debouncedSearch,
  });
  const create = useCreateFinalSettlement();
  const updateStatus = useUpdateFinalSettlementStatus();
  const cancel = useCancelFinalSettlement();

  const { data: empSearchData } = useFinalSettlementEmployees(1, 10, employeeSearchText);

  const canView =
    can("final-settlement:view") ||
    can("final-settlement:view_own_record_only");
  const canCreate = can("final-settlement:create");
  const canUpdate = can("final-settlement:update");

  if (!canView) {
    return (
      <div className="p-10 text-center text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p>You do not have permission to view final settlements.</p>
      </div>
    );
  }

  useEffect(() => {
    if (employment?.termination_reason) {
      setReasonCode(employment.termination_reason);
    }
  }, [employment]);

  const employeeOptions =
    empSearchData?.employees?.map((e: any) => ({
      value: e.id,
      label: `${e.full_name} (${e.email})`,
      email: e.email,
    })) || [];

  const loadEmployeeOptions = useCallback(
    debounce((inputValue: string, callback: any) => {
      setEmployeeSearchText(inputValue);
      callback(employeeOptions);
    }, 300),
    [employeeOptions],
  );

  useEffect(() => setPage(1), [debouncedSearch]);
  useEffect(() => {
    if (data && isInitialLoad) setIsInitialLoad(false);
  }, [data, isInitialLoad]);

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      {
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.original.employee?.full_name ?? "—"}
            </p>
            <p className="text-sm text-gray-500">
              {row.original.employee?.email ?? "—"}
            </p>
          </div>
        ),
      },
      {
        header: "Last Working Date",
        accessorKey: "last_working_date",
        cell: ({ getValue }) =>
          getValue() ? new Date(String(getValue())).toLocaleDateString() : "—",
      },
      {
        header: "Total Payable",
        accessorKey: "total_payable",
        cell: ({ getValue }) => {
          const val = getValue();
          return val != null
            ? `${organization_currency || "AED"} ${Number(val).toFixed(2)}`
            : `${organization_currency || "AED"} 0.00`;
        },
      },
      {
        header: "Reason",
        accessorKey: "reason",
        cell: ({ getValue }) => getReasonLabel(getValue() as string),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const status = String(getValue() || "").toUpperCase();
          const config: Record<
            string,
            { text: string; bg: string; border: string }
          > = {
            PAID: {
              text: "text-green-700",
              bg: "bg-green-50",
              border: "border-green-200",
            },
            APPROVED: {
              text: "text-blue-700",
              bg: "bg-blue-50",
              border: "border-blue-200",
            },
            DRAFT: {
              text: "text-yellow-700",
              bg: "bg-yellow-50",
              border: "border-yellow-200",
            },
            CANCELLED: {
              text: "text-red-700",
              bg: "bg-red-50",
              border: "border-red-200",
            },
          };
          const {
            text = "text-gray-700",
            bg = "bg-gray-50",
            border = "border-gray-200",
          } = config[status] || {};
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${text} ${bg} ${border}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const r = row.original;
          const isDraft = r.status?.toLowerCase() === "draft";
          const isApproved = r.status?.toLowerCase() === "approved";
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                title="View Settlement"
                className="p-2 rounded-lg hover:bg-emerald-50 transition"
                onClick={() => {
                  setSelectedSettlement(r);
                  setPreviewOpen(true);
                }}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
              </button>

              {canUpdate && isDraft && (
                <>
                  <button
                    title="Approve"
                    className="p-2 rounded-lg hover:bg-blue-50 transition"
                    onClick={() => setApproveTarget(r)}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    title="Cancel"
                    className="p-2 rounded-lg hover:bg-red-50 transition"
                    onClick={() => setCancelTarget(r)}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                  </button>
                </>
              )}

              {canUpdate && isApproved && (
                <button
                  title="Mark as Paid"
                  className="p-2 rounded-lg hover:bg-green-50 transition"
                  onClick={() => setPayTarget(r)}
                >
                  <DollarSign className="w-4 h-4 text-green-600" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [organization_currency, canUpdate],
  );

  const rows = (data?.settlements ?? []) as Row[];
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;
  const REASON_OPTIONS = APP_CONFIG.FINAL_SETTLEMENT.REASON_OPTIONS;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-indigo-600" />
          Final Settlements
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Manage employee exit settlements and payments
        </p>
      </div>

      {/* Search + Create Button */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>

          {/* Create Button */}
          {canCreate && (
            <button
              onClick={() => setCreateDialog(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md transition whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Settlement</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isInitialLoad && isLoading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {rows.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <UserCheck className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No settlements found
          </h3>
          <p className="text-gray-500">
            Try creating one or adjusting your search.
          </p>
        </div>
      )}

      {/* Desktop Table – Hidden on Mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          data={rows}
          columns={columns}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          isFetching={isFetching}
        />
      </div>

      {/* Mobile Cards – Only shown on mobile */}
      {/* Mobile Cards – Total Payable Fixed (Normal Size) */}
      <div className="md:hidden space-y-5 px-4">
        {rows.map((row) => {
          const isDraft = row.status?.toLowerCase() === "draft";
          const isApproved = row.status?.toLowerCase() === "approved";

          return (
            <div
              key={row.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-visible"
            >
              <div className="px-6 pt-6 pb-4">
                {/* Name + Status */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {row.employee?.full_name || "—"}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {row.employee?.email || "—"}
                    </p>
                  </div>
                  <span
                    className={`ml-3 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                      row.status === "draft"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : row.status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : row.status === "paid"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Working</span>
                    <span className="font-medium">
                      {row.last_working_date
                        ? new Date(row.last_working_date).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  {/* Total Payable – NOW NORMAL SIZE */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Payable</span>
                    <span className="text-base text-gray-900">
                      {organization_currency}{" "}
                      {Number(row.total_payable || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-gray-500 text-xs">Reason</span>
                    <p className="font-medium mt-1">
                      {getReasonLabel(row.reason || "")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="px-6 pb-6">
                <div className="grid gap-3">
                  <button
                    onClick={() => {
                      setSelectedSettlement(row);
                      setPreviewOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 transition text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View
                  </button>

                  {canUpdate && isDraft && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setApproveTarget(row)}
                        className="flex-1 px-6 py-3.5 bg-indigo-100 text-indigo-700 font-medium rounded-2xl hover:bg-indigo-200 transition text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setCancelTarget(row)}
                        className="flex-1 px-6 py-3.5 bg-red-100 text-red-700 font-medium rounded-2xl hover:bg-red-200 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {canUpdate && isApproved && (
                    <button
                      onClick={() => setPayTarget(row)}
                      className="px-6 py-3.5 bg-green-100 text-green-700 font-medium rounded-2xl hover:bg-green-200 transition text-sm"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE PAGINATION - EXACTLY LIKE EmployeesList.tsx */}
      <div className="md:hidden mt-6">
        {total > limit && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit) || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
      {/* All dialogs remain exactly the same */}
      {/* Create Dialog, Preview Modal, Approve/Pay/Cancel dialogs – unchanged */}
      {/* ... (keep all your existing dialogs below unchanged) ... */}

      {/* Create Dialog */}
      <FormDialog
        open={createDialog}
        title="Create Final Settlement"
        onClose={() => {
          setCreateDialog(false);
          setSelectedEmployee(null);
          setReasonCode("");
          setNotes("");
        }}
        primaryAction={{
          label: create.isPending ? "Creating..." : "Create Settlement",
          loading: create.isPending,
          onClick: async () => {
            if (!selectedEmployee?.value) {
              toast.error("Please select an employee");
              return;
            }
            if (!reasonCode) {
              toast.error("Please select a reason");
              return;
            }
            await create.mutateAsync({
              employee_id: selectedEmployee.value,
              reason: reasonCode,
              notes: notes.trim() || null,
              organization: {
                id: organization_id,
                name: organization_name,
                country_code: organization_country_code,
                currency: organization_currency,
              },
            });
            toast.success("Settlement created successfully");
            setCreateDialog(false);
          },
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setCreateDialog(false),
        }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee <span className="text-red-600">*</span>
            </label>
            <Select
              options={employeeSearchText.length >= 3 ? employeeOptions : []}
              value={selectedEmployee}
              onChange={(selected) => {
                setSelectedEmployee(selected);
                setSelectedEmployeeId(selected?.value || null);
              }}
              onInputChange={setEmployeeSearchText}
              placeholder="Search by name or email..."
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "0.5rem",
                  borderColor: "#d1d5db",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#9ca3af" },
                }),
                menu: (base) => ({ ...base, zIndex: 50 }),
                placeholder: (base) => ({ ...base, color: "#9ca3af" }),
              }}
              isClearable
              isSearchable
              noOptionsMessage={() =>
                employeeSearchText.length < 3
                  ? "Type at least 3 characters"
                  : "No employees found"
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a reason...</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Add HR remarks, exit interview notes, etc."
            />
          </div>
        </div>
      </FormDialog>

      {/* Preview Modal */}
      {previewOpen && selectedSettlement && (
        <FinalSettlementPreviewModal
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedSettlement(null);
          }}
          settlement={selectedSettlement as any}
        />
      )}

      {/* Approve Confirmation */}
      {approveTarget && (
        <FormDialog
          open={!!approveTarget}
          title="Approve Settlement"
          onClose={() => setApproveTarget(null)}
          primaryAction={{
            label: updateStatus.isPending ? "Approving..." : "Approve",
            loading: updateStatus.isPending,
            onClick: () => {
              updateStatus.mutate(
                { id: approveTarget.id, status: "approved" },
                { onSuccess: () => setApproveTarget(null) },
              );
            },
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setApproveTarget(null),
          }}
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to <strong>approve</strong> the settlement for{" "}
            <strong>{approveTarget.employee?.full_name}</strong>?
          </p>
        </FormDialog>
      )}

      {/* Pay Confirmation */}
      {payTarget && (
        <FormDialog
          open={!!payTarget}
          title="Mark as Paid"
          onClose={() => setPayTarget(null)}
          primaryAction={{
            label: updateStatus.isPending ? "Processing..." : "Mark Paid",
            loading: updateStatus.isPending,
            onClick: () => {
              updateStatus.mutate(
                { id: payTarget.id, status: "paid" },
                { onSuccess: () => setPayTarget(null) },
              );
            },
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setPayTarget(null),
          }}
        >
          <p className="text-sm text-gray-600">
            Confirm that <strong>{payTarget.employee?.full_name}</strong> has
            been paid{" "}
            <strong>
              {organization_currency} {payTarget.total_payable?.toFixed(2)}
            </strong>
            .
          </p>
        </FormDialog>
      )}

      {/* Cancel Confirmation */}
      {cancelTarget && (
        <FormDialog
          open={!!cancelTarget}
          title="Cancel Settlement"
          onClose={() => setCancelTarget(null)}
          primaryAction={{
            label: cancel.isPending ? "Cancelling..." : "Cancel Settlement",
            loading: cancel.isPending,
            onClick: () => {
              cancel.mutate(
                { id: cancelTarget.id },
                { onSuccess: () => setCancelTarget(null) },
              );
            },
          }}
          secondaryAction={{
            label: "Keep",
            onClick: () => setCancelTarget(null),
          }}
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to <strong>cancel</strong> the settlement for{" "}
            <strong>{cancelTarget.employee?.full_name}</strong>?
          </p>
        </FormDialog>
      )}
    </div>
  );
}
