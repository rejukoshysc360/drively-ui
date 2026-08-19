// src/audit/AuditList.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../components/ui/DataTable";
import { Loader2, Search, Eye, Calendar, Filter } from "lucide-react";
import { useAuditLogs, useAuditTables } from "./hooks";
import { APP_CONFIG } from "../../config/appConfig";
import AuditDetailsDialog from "./AuditDetailsDialog";

/* -------------------------------------------------
   Debounce Hook
------------------------------------------------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AuditList() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [tableFilter, setTableFilter] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const debouncedUserEmail = useDebounce(userInput.trim(), 350);
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const { data: tableNames = [] } = useAuditTables();

  const { data, isFetching, isLoading } = useAuditLogs({
    page,
    limit,
    table: tableFilter || null,
    user: debouncedUserEmail || null,
    search: debouncedSearch || null,
    from_date: fromDate || null,
    to_date: toDate || null,
  });

  const rows = data?.audits ?? [];
  const total = data?.paginationMetaInfo?.totalCount ?? 0;

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      { header: "Table", accessorKey: "table_name" },
      { header: "Operation", accessorKey: "operation" },
      {
        header: "Record ID",
        accessorKey: "record_id",
        cell: ({ getValue }) => (
          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            {getValue() || "—"}
          </code>
        ),
      },
      {
        header: "Changed By",
        accessorKey: "changed_by_email",
        cell: ({ row }) => {
          const name = row.original.changed_by_name;
          const email = row.original.changed_by_email;
          if (!email) return <em className="text-gray-400">System</em>;
          return (
            <div>
              <div className="font-medium">{name || "—"}</div>
              <div className="text-xs text-gray-500">{email}</div>
            </div>
          );
        },
      },
      {
        header: "Changed At",
        accessorKey: "changed_at",
        cell: ({ getValue }) =>
          new Date(getValue()).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedAuditId(row.original.id)}
            className="p-2.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
            title="View details"
          >
            <Eye className="w-5 h-5" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Filter className="w-8 h-8 text-indigo-600" />
          Audit Logs
        </h1>
        <p className="text-slate-600 mt-2">
          Complete history of all changes in the system
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating…
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <select
            value={tableFilter}
            onChange={(e) => {
              setTableFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Tables</option>
            {tableNames.map((tbl: string) => (
              <option key={tbl} value={tbl}>
                {tbl}
              </option>
            ))}
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search logs…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && rows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-5">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No audit logs found
          </h3>
          <p className="text-gray-500">Try adjusting your filters.</p>
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

      {/* Mobile Cards – EYE ICON 100% FIXED */}
      {!isLoading && rows.length > 0 && (
        <div className="block lg:hidden space-y-4">
          {rows.map((log: any) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4 gap-4">
                {/* Left Content – Takes available space */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Table • {log.operation}</p>
                  <p className="font-bold text-lg text-gray-900 break-words">
                    {log.table_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Record ID:{" "}
                    <code className="font-mono bg-gray-100 px-2 py-1 rounded text-xs break-all">
                      {log.record_id || "—"}
                    </code>
                  </p>
                </div>

                {/* Right Button – Fixed size, never spills */}
                <button
                  onClick={() => setSelectedAuditId(log.id)}
                  className="flex-shrink-0 p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
                  title="View details"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Changed By</span>
                  <div className="text-right">
                    <p className="font-medium">
                      {log.changed_by_name || "System"}
                    </p>
                    {log.changed_by_email && (
                      <p className="text-xs text-gray-500">{log.changed_by_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">When</span>
                  <p className="font-medium">
                    {new Date(log.changed_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <AuditDetailsDialog
        auditId={selectedAuditId}
        onClose={() => setSelectedAuditId(null)}
      />
    </div>
  );
}