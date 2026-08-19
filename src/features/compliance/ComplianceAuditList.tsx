import { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Trash2,
  AlertTriangle,
  Search,
  Calendar,
  UserX,
  Clock,
  CheckCircle,
  User,
} from "lucide-react";
import { useComplianceAudits, useDeleteComplianceAudit } from "./hooks";
import { APP_CONFIG } from "../../config/appConfig";
import DataTable from "../../components/ui/DataTable";
import { useCan } from "../../utils/permissions";
import { toReadableLabel } from "../../utils/StringUtils";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function ComplianceAuditList() {
  const can = useCan();
  const canView = can("compliance:view");

  if (!canView) {
    return (
      <div className="p-8 text-center text-gray-500">
        You don’t have permission to view compliance audits.
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "expired" | "expiring_soon" | "warning"
  >("all");

  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const { data, isFetching, isLoading } = useComplianceAudits(
    page,
    limit,
    debouncedSearch,
    statusFilter !== "all" ? statusFilter : undefined
  );

  const del = useDeleteComplianceAudit();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = data?.audits ?? [];
  const total = data?.paginationMetaInfo?.totalCount ?? 0;

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Employee",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {row.original.employee?.full_name ?? "—"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {row.original.employee?.email ?? "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Field",
        cell: ({ row }) => {
          const raw = row.original.computed_value || row.original.field_name;
          const label = toReadableLabel(raw);
          return <span className="font-bold text-indigo-700">{label}</span>;
        },
      },
      {
        header: ({ table }) => {
          const rows = table.getRowModel().rows;
          const anyMilestone = rows.some(
            (r) => r.original.status === "milestone"
          );
          return anyMilestone ? "Milestone Date" : "Expiry Date";
        },
        accessorKey: "expiry_date",
        cell: ({ getValue }) => {
          const val = getValue();
          if (!val) return "—";
          return (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {new Date(val).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          );
        },
      },
      {
        header: "Days Left",
        accessorKey: "days_left",
        cell: ({ getValue }) => {
          const days = Number(getValue() || 0);
          const isNegative = days < 0;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isNegative
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : days <= 7
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {isNegative ? (
                <UserX className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {Math.abs(days)} {Math.abs(days) === 1 ? "day" : "days"}
              {isNegative ? " overdue" : days <= 7 ? " left" : ""}
            </span>
          );
        },
      },
      {
  header: "Created At",
  accessorKey: "created_at",
  cell: ({ getValue }) => {
    const val = getValue();
    if (!val) return "—";

    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">
          {new Date(val as string).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>

        <span className="text-xs text-gray-500">
          {new Date(val as string).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  },
},
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const val = String(getValue() || "").toLowerCase();
          const config: Record<
            string,
            { icon: any; color: string; bg: string; border: string }
          > = {
            expired: {
              icon: AlertTriangle,
              color: "text-red-700",
              bg: "bg-red-50",
              border: "border-red-200",
            },
            expiring_soon: {
              icon: Clock,
              color: "text-yellow-700",
              bg: "bg-yellow-50",
              border: "border-yellow-200",
            },
            warning: {
              icon: AlertTriangle,
              color: "text-orange-700",
              bg: "bg-orange-50",
              border: "border-orange-200",
            },
            milestone: {
              icon: CheckCircle,
              color: "text-green-700",
              bg: "bg-green-50",
              border: "border-green-200",
            },
          };

          const {
            icon: Icon = CheckCircle,
            color = "text-gray-700",
            bg = "bg-gray-50",
            border = "border-gray-200",
          } = config[val] || {};

          return (
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold capitalize border ${color} ${bg} ${border}`}
            >
              <Icon className="w-4 h-4" /> {val || "—"}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          Compliance Alerts
        </h1>
        <p className="text-slate-600 mt-2">
          Monitor expiring employee documents and compliance milestones
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee, field, or status..."
              className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && !isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="expired">Expired</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && rows.length > 0 && (
        <div className="block lg:hidden space-y-4">
          {rows.map((item: any) => {
            const days = Number(item.days_left || 0);
            const isNegative = days < 0;
            const statusConfig =
              {
                expired: {
                  icon: AlertTriangle,
                  color: "text-red-700",
                  bg: "bg-red-100",
                },
                expiring_soon: {
                  icon: Clock,
                  color: "text-yellow-700",
                  bg: "bg-yellow-100",
                },
                warning: {
                  icon: AlertTriangle,
                  color: "text-orange-700",
                  bg: "bg-orange-100",
                },
                milestone: {
                  icon: CheckCircle,
                  color: "text-green-700",
                  bg: "bg-green-100",
                },
              }[item.status] || {
                icon: CheckCircle,
                color: "text-gray-700",
                bg: "bg-gray-100",
              };
            const Icon = statusConfig.icon;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm relative"
              >
                {/* ===== Mobile Card Header ===== */}
                <div className="relative mb-4">
                  <div className="flex items-center gap-3 pr-10">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {item.employee?.full_name ?? "—"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.employee?.email}
                      </p>
                    </div>
                  </div>

                  {/* Icon top-right */}
                  <div
                    className={`absolute top-0 right-0 p-2 rounded-xl ${statusConfig.bg}`}
                  >
                    <Icon className={`w-6 h-6 ${statusConfig.color}`} />
                  </div>
                </div>

                {/* ===== Card Body ===== */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Compliance Field</p>
                    <p className="text-sm text-indigo-700 line-clamp-2">
                      {toReadableLabel(
                        item.computed_value || item.field_name
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span
                      className={`font-bold px-3 py-1 rounded-full text-xs ${
                        isNegative
                          ? "bg-red-100 text-red-700"
                          : days <= 7
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {Math.abs(days)}{" "}
                      {Math.abs(days) === 1 ? "day" : "days"}{" "}
                      {isNegative ? "overdue" : "left"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && rows.length > 0 && (
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
      )}

      {/* Empty State */}
      {!isLoading && rows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-5">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All clear!</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "No compliance records found."
              : `No ${statusFilter.replace("_", " ")} items.`}
          </p>
        </div>
      )}
 
    </div>
  );
}
