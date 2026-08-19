// src/projects/ProjectList.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/ui/DataTable';
import { useProjects, useDeleteProject } from './hooks';
import { useClientCompanies } from '../clients/hooks';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Loader2,
  Users,
  CirclePlus,
  Trash2,
  Pencil,
  Calendar,
  Building2,
  Search,
  Hash,
  DollarSign,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getFriendlyTableName, getRelatedTableFromMessage } from '../../../src/utils/fkUtils';
import { toast } from 'react-hot-toast';
import { useCan } from "../../utils/permissions";

type ApiRow = {
  id: string;
  organization_id: string;
  client_company_id?: string | null;
  name: string;
  code?: string | null;
  project_reference?:string;
  billing_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  notes?: string | null;
};

type Row = {
  id: string;
  client_name: string;
  name: string;
  code?: string;
  project_reference?:string;
  billing_type?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

function ymdToDMY(ymd?: string | null): string {
  if (!ymd || ymd.length < 10) return '-';
  const [y, m, d] = ymd.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function getStatusBadge(status?: string) {
  const s = (status || 'planned').toLowerCase();
  const map: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800' },
    completed: { label: 'Completed', bg: 'bg-blue-100', text: 'text-blue-800' },
    on_hold: { label: 'On Hold', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800' },
    planned: { label: 'Planned', bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const { label, bg, text } = map[s] || map.planned;
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>;
}

export default function ProjectList() {
  const can = useCan();
  const canViewAll = can("projects:view");
  const canViewOwn = can("projects:view_own_record_only");

  
  // 🔒 Restrict access for users without project viewing rights
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
            You do not have permission to view projects. Please contact your HR or
            Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }


  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<Row | null>(null);
  const [fkTableName, setFkTableName] = useState('');
  const [rawFkTable, setRawFkTable] = useState('');

  useEffect(() => setPage(1), [debouncedSearch, from, to]);

  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); 

  const { data, isFetching, isLoading, refetch } = useProjects(
    page,
    limit,
    debouncedSearch || undefined,
    from || undefined,
    to || undefined,
    sortBy,
    sortOrder
  );

  const { data: clientsData } = useClientCompanies(1, 1000, undefined);
  const clientList = clientsData?.client_companies ?? [];


  const handleSort = (column: string) => {
  if (sortBy === column) {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  } else {
    setSortBy(column);
    setSortOrder('asc');
  }
};

const renderSortIcon = (column: string) => {
  if (sortBy !== column) return '↕';
  return sortOrder === 'asc' ? '↑' : '↓';
};

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clientList) if (c.id) map.set(c.id, c.name || '');
    return map;
  }, [clientList]);

  useEffect(() => {
    if (data && isInitialLoad) setIsInitialLoad(false);
  }, [data, isInitialLoad]);

  const del = useDeleteProject();

  const toRow = (p: ApiRow): Row => ({
    id: p.id,
    client_name: p.client_company_id ? clientNameById.get(p.client_company_id) || '-' : '-',
    name: p.name,
    code: p.code ?? undefined,
    project_reference : p.project_reference ?? undefined, 
    billing_type: p.billing_type ?? undefined,
    start_date: p.start_date ?? undefined,
    end_date: p.end_date ?? undefined,
    status: p.status ?? undefined,
    notes: p.notes ?? undefined,
  });

  const rows = (data?.projects ?? []).map(toRow);
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;

const columns: ColumnDef<Row>[] = useMemo(
  () => [
    {
      header: () => (
        <button
          onClick={() => handleSort('client_company_id')}
          className="flex items-center gap-1 font-semibold"
        >
          Client {renderSortIcon('client_company_id')}
        </button>
      ),
      accessorKey: "client_name",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue()}</span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-1 font-semibold"
        >
          Project {renderSortIcon('name')}
        </button>
      ),
      accessorKey: "name",
      cell: ({ getValue }) => (
        <span className="font-medium text-indigo-900">{getValue()}</span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('project_reference')}
          className="flex items-center gap-1 font-semibold"
        >
          Project Ref {renderSortIcon('project_reference')}
        </button>
      ),
      accessorKey: "project_reference",
      cell: ({ getValue }) => (
        <span className="font-medium text-indigo-900">
          {getValue() || "-"}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('code')}
          className="flex items-center gap-1 font-semibold"
        >
          Code {renderSortIcon('code')}
        </button>
      ),
      accessorKey: "code",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {getValue() || "-"}
        </span>
      ),
    },
    {
      header: "Billing",
      accessorKey: "billing_type",
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue() || "-"}</span>
      ),
    },
    {
      header: "Start",
      accessorKey: "start_date",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {ymdToDMY(getValue() as string)}
        </span>
      ),
    },
    {
      header: "End",
      accessorKey: "end_date",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {ymdToDMY(getValue() as string)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) =>
        getStatusBadge(getValue() as string),
    },
    {
      header: "Notes",
      accessorKey: "notes",
      cell: ({ getValue }) => {
        const v = String(getValue() ?? "");
        return v ? (
          <span
            title={v}
            className="text-sm text-gray-600 truncate max-w-[150px] block"
          >
            {v.length > 60 ? v.slice(0, 60) + "..." : v}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },

    ...(can("tasks:create")
      ? [{
          header: "Tasks",
          cell: ({ row }) => (
            <div className="flex justify-center">
              <button
                className="p-2 rounded-lg hover:bg-gray-50 transition"
                onClick={() =>
                  nav(`/projects/${row.original.id}/tasks/create`)
                }
              >
                <CirclePlus className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          ),
        }]
      : []),

      {
  header: "Team",
  cell: ({ row }) => (
    <div className="flex justify-center">
      <button
        className="p-2 rounded-lg hover:bg-gray-50 transition"
        onClick={() =>
          nav(`/projects/${row.original.id}/employees`)
        }
      >
        <Users className="w-4 h-4 text-indigo-600" />
      </button>
    </div>
  ),
},
    ...(can("projects:update")
      ? [{
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center justify-center gap-1">
              {can("projects:update") && (
                <button
                  className="p-2 rounded-lg hover:bg-gray-50 transition"
                  onClick={() =>
                    nav(`/projects/${row.original.id}/edit`)
                  }
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </button>
              )}
              {can("projects:delete") && (
                <button
                  className="p-2 rounded-lg hover:bg-red-50 transition"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          ),
        }]
      : []),
  ],
  [nav, can, sortBy, sortOrder]
);

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <CirclePlus className="w-8 h-8 text-indigo-600" />
          Projects
        </h1>
        <p className="text-slate-600 mt-1">Manage client projects, tasks, and team assignments</p>
      </div>

      {/* Search + Filters + Add */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name, code, notes..."
              className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm appearance-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm appearance-none"
              />
            </div>
          </div>

          {can("projects:create") && (
            <button
              onClick={() => nav('/projects/create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No projects found</h3>
            <p className="text-gray-500">Try adjusting filters or create a new project.</p>
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            isFetching={isFetching}
          />
        )}
      </div>

      {/* Mobile Cards */}
      <div className="block lg:hidden space-y-4">
        {rows.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No projects found</h3>
            <p className="text-gray-500">Try adjusting filters or create a new project.</p>
          </div>
        ) : (rows.map((project) => (
          <div key={project.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Building2 className="w-4 h-4" />
                  {project.client_name}
                </div>
              </div>
              {getStatusBadge(project.status)}
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              {project.code && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span>{project.code}</span>
                </div>
              )}
              {project.project_reference && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span>{project.project_reference}</span>
                </div>
              )}
              {project.billing_type && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>{project.billing_type}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{ymdToDMY(project.start_date)} to {ymdToDMY(project.end_date)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-6">
              {can("tasks:create") && (
                <button
                  onClick={() => nav(`/projects/${project.id}/tasks/create`)}
                  className="flex flex-col items-center gap-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition"
                >
                  <CirclePlus className="w-5 h-5" />
                  <span className="text-xs">Task</span>
                </button>
              )}
              {can("employees:view") && (
                <button
                  onClick={() => nav(`/projects/${project.id}/employees`)}
                  className="flex flex-col items-center gap-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Team</span>
                </button>
              )}
              {can("projects:update") && (
                <button
                  onClick={() => nav(`/projects/${project.id}/edit`)}
                  className="flex flex-col items-center gap-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  <Pencil className="w-5 h-5" />
                  <span className="text-xs">Edit</span>
                </button>
              )}
              {can("projects:delete") && (
                <button
                  onClick={() => setDeleteTarget(project)}
                  className="flex flex-col items-center gap-1 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-xs">Delete</span>
                </button>
              )}
            </div>
          </div>
           ))
           )}
      </div>

      {/* Loading & Empty States */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )} 

      {/* Delete Dialogs */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        danger
        isLoading={del.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await del.mutateAsync({ projectId: deleteTarget.id });
            toast.success("Project deleted");
            setDeleteTarget(null);
            refetch();
          } catch (err: any) {
            const msg = String(err?.message || '');
            if (msg.includes('violates foreign key constraint')) {
              const rawTable = getRelatedTableFromMessage(msg);
              setRawFkTable(rawTable);
              setFkTableName(getFriendlyTableName(rawTable));
              setDeleteTarget(null);
              setTimeout(() => setForceDeleteTarget(deleteTarget), 0);
              return;
            }
            toast.error(msg);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!forceDeleteTarget}
        title="Force Delete Project"
        description={`"${forceDeleteTarget?.name}" has related ${fkTableName}. Deleting will also remove related ${fkTableName}. Continue?`}
        confirmLabel="Delete with Related Data"
        danger
        isLoading={del.isPending}
        onConfirm={async () => {
          if (forceDeleteTarget) {
            await del.mutateAsync({
              projectId: forceDeleteTarget.id,
              force: true,
              table: rawFkTable,
            });
            toast.success("Project and related data deleted");
            setForceDeleteTarget(null);
            refetch();
          }
        }}
        onClose={() => setForceDeleteTarget(null)}
      />
    </div>
  );
}