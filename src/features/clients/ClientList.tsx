// src/clients/ClientList.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useCan } from "../../utils/permissions";
import DataTable from "../../components/ui/DataTable";
import {
  useClientCompanies,
  useDeleteClientCompany,
} from "./hooks";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Pencil,
  Plus,
  Loader2,
  Building2,
  Search,
  Mail,
  Phone,
  Globe,
  Calendar,
  User,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";

type Row = {
  id: string;
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  billing_currency?: string | null;
  created_at?: string | null;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export default function ClientList() {
  const can = useCan();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const canView = can("clients:view");
  const canCreate = can("clients:create");
  const canUpdate = can("clients:update");

  if (!canView) {
    return (
      <div className="p-10 text-center text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p>You do not have permission to view client records.</p>
      </div>
    );
  }

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isFetching, isLoading } = useClientCompanies(
    page,
    limit,
    debouncedSearch
  );
  const del = useDeleteClientCompany();

  useEffect(() => {
    if (data && isInitialLoad) setIsInitialLoad(false);
  }, [data, isInitialLoad]);

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ getValue }) => (
          <span className="font-semibold text-gray-900">{getValue() || "—"}</span>
        ),
      },
      {
        header: "Contact",
        cell: ({ row }) => {
          const c = row.original;
          const hasContact =
            c.contact_name || c.contact_email || c.contact_phone;
          if (!hasContact) return <span className="text-gray-400 text-sm">—</span>;

          return (
            <div className="space-y-1 text-sm">
              {c.contact_name && (
                <p className="font-medium text-gray-900">{c.contact_name}</p>
              )}
              {c.contact_email && (
                <p className="text-gray-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {c.contact_email}
                </p>
              )}
              {c.contact_phone && (
                <p className="text-gray-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {c.contact_phone}
                </p>
              )}
            </div>
          );
        },
      },
      {
        header: "Currency",
        accessorKey: "billing_currency",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
            <Globe className="w-4 h-4" />
            {getValue() || "—"}
          </span>
        ),
      },
      {
        header: "Created",
        accessorKey: "created_at",
        cell: ({ getValue }) => {
          const v = getValue();
          if (!v) return <span className="text-gray-400 text-sm">—</span>;
          return (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                {new Date(String(v)).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          if (!canUpdate) {
            return <div className="text-center text-gray-400 text-xs">—</div>;
          }

          return (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => nav(`/clients/${row.original.id}/edit`)}
                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition"
                title="Edit client"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDeleteTarget(row.original)}
                className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition"
                title="Delete client"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        },
      },
    ],
    [nav, canUpdate]
  );

  const rows = (data?.client_companies ?? []) as Row[];
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-indigo-600" />
          Client Companies
        </h1>
        <p className="text-slate-600 mt-2">
          Manage your client relationships and billing
        </p>
      </div>

      {/* Search + Add */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name, contact, email..."
              className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>

          {canCreate && (
            <button
              onClick={() => nav("/clients/create")}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-md"
            >
              <Plus className="w-5 h-5" />
              New Client
            </button>
          )}
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
              <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
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
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No clients found
          </h3>
          <p className="text-gray-500">Try adjusting your search or add a new client.</p>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && rows.length > 0 && (
        <div className="block lg:hidden space-y-5">
          {rows.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created{" "}
                    {client.created_at
                      ? new Date(client.created_at).toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                  <Globe className="w-4 h-4" />
                  {client.billing_currency || "—"}
                </span>
              </div>

              {(client.contact_name || client.contact_email || client.contact_phone) && (
                <div className="space-y-3 border-t pt-4">
                  {client.contact_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{client.contact_name}</span>
                    </div>
                  )}
                  {client.contact_email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <a href={`mailto:${client.contact_email}`} className="text-indigo-600 hover:underline">
                        {client.contact_email}
                      </a>
                    </div>
                  )}
                  {client.contact_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span>{client.contact_phone}</span>
                    </div>
                  )}
                </div>
              )}

{canUpdate && (
  <div className="mt-6 flex items-center justify-end gap-3">
    {/* Edit Button */}
    <button
      onClick={() => nav(`/clients/${client.id}/edit`)}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:bg-gray-300 transition text-xs shadow-sm min-w-[100px]"
    >
      <Pencil className="w-4 h-4" />
      Edit
    </button>

    {/* Delete Button */}
    <button
      onClick={() => setDeleteTarget(client)}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 active:bg-red-300 transition text-xs shadow-sm min-w-[100px]"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  </div>
)}
            </div>
          ))}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Client Company"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={del.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await del.mutateAsync(deleteTarget.id);
            toast.success("Client deleted");
            setDeleteTarget(null);
          } catch (err: any) {
            toast.error(err?.message || "Failed to delete");
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}