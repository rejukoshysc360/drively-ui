import { useEffect, useMemo, useState, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/ui/DataTable';
import { useTimesheets } from './hooks';
import { useProjects } from '../projects/hooks';
import { useClientCompanies } from '../clients/hooks';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

type ApiRow = {
  id: string;
  employee_id: string;
  date: string;                // YYYY-MM-DD
  hours_worked: number;
  notes?: string | null;
  organization_id: string;
  created_at?: string | null;
  project_id?: string | null;
  employees?: { id: string; full_name?: string | null; email?: string | null } | null;
  employee_name?: string | null;
  employee_email?: string | null;
};

type Row = {
  id: string;
  date: string;         // YYYY-MM-DD
  employee_name: string;
  project_name: string;
  client_name: string;
  hours: number;
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

function ymdToDMY(ymd: string) {
  if (!ymd || ymd.length < 10) return '-';
  const [y, m, d] = ymd.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export default function TimesheetList() {
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  // Search
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  // Date filters (raw strings from <input type="date">)
  const [from, setFrom] = useState<string>(''); // YYYY-MM-DD
  const [to, setTo] = useState<string>('');     // YYYY-MM-DD

  // Track initial load to avoid showing "Loading…" during background refetch
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, from, to]);

  // Query: timesheets
  const { data, isFetching, isLoading } = useTimesheets(
    page,
    limit,
    debouncedSearch || undefined,
    from || undefined,
    to || undefined
  );

  // Query: projects (for mapping project_id → project (name, client_company_id))
  const {
    data: projData,
    isLoading: isProjLoading,
    isFetching: isProjFetching,
  } = useProjects(1, 1000, undefined, undefined, undefined); // big page to get name map

  // Query: client companies (for mapping client_company_id → client name)
  const {
    data: ccData,
    isLoading: isCcLoading,
    isFetching: isCcFetching,
  } = useClientCompanies(1, 1000, undefined);

  const projectById = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of projData?.projects ?? []) {
      if (p?.id) m.set(p.id, p);
    }
    return m;
  }, [projData]);

  const clientNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of ccData?.client_companies ?? []) {
      if (c?.id) m.set(c.id, c.name || '');
    }
    return m;
  }, [ccData]);

  // Initial load marker
  useEffect(() => {
    if (data && isInitialLoad) setIsInitialLoad(false);
  }, [data, isInitialLoad]);

  const toRow = (r: ApiRow): Row => {
    const proj = r.project_id ? projectById.get(r.project_id) : undefined;
    const project_name =
      (proj?.name as string | undefined) ??
      ((isProjLoading || isProjFetching) ? '…' : '-');

    const client_name =
      (proj?.client_company_id && clientNameById.get(proj.client_company_id)) ??
      ((isCcLoading || isCcFetching) ? '…' : '-');

    return {
      id: r.id,
      date: r.date, // already YYYY-MM-DD; no Date() to avoid TZ drift
      employee_name: r.employee_name || r.employees?.full_name || '-',
      project_name,
      client_name,
      hours: Number.isFinite(r.hours_worked) ? Number(r.hours_worked) : 0,
      notes: r.notes ?? undefined,
    };
  };

 const columns: ColumnDef<Row>[] = useMemo(
  () => [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ getValue }) => ymdToDMY(String(getValue() ?? '-')),
    },
    { header: 'Client', accessorKey: 'client_name' },
    { header: 'Project', accessorKey: 'project_name' },
    { header: 'Employee', accessorKey: 'employee_name' },
    {
      header: 'Hours',
      accessorKey: 'hours',
      cell: ({ getValue }) => {
        const n = Number(getValue());
        return Number.isFinite(n) ? n.toFixed(2) : '-';
      },
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: ({ getValue }) => {
        const v = String(getValue() ?? '');
        return v ? <span title={v}>{v.length > 60 ? v.slice(0, 60) + '…' : v}</span> : '-';
      },
    },
  ],
  []
);


  if (isInitialLoad && isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  const apiRows = (data?.timesheets ?? []) as ApiRow[];
  const rows = apiRows.map(toRow);
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold">Timesheets</h1>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative" role="search" aria-label="Search timesheets">
            <input
              ref={inputRef}
              className="input h-9 pr-8"
              placeholder="Search name, email, notes…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="search"
              autoComplete="off"
              spellCheck={false}
              inputMode="search"
            />
            {isFetching && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </span>
            )}
          </div>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">From</label>
            <input
              type="date"
              className="input h-9"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">To</label>
            <input
              type="date"
              className="input h-9"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => nav('/timesheets/create')}
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
}
