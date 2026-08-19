// src/pages/employees/EmployeesList.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Loader2,
  Landmark as LinkIcon,
  Timer,
  CalendarClock,
  Pencil,
  Trash2,
  Users,
  Filter,
  UserCog,
  Mail,
  IdCard,
  Badge,
  Building2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { APP_CONFIG } from '../../config/appConfig';
import DataTable from '../../components/ui/DataTable';
import FormDialog from '../../components/ui/FormDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LinkBankAccountModal from '../employees/accounts/LinkBankAccountModal';
import PayslipPreviewModal from './payslip/PayslipPreviewModal';
import { useDeleteEmployee, useManagedEmployees } from './hooks';
import { useGeneratePayslip } from '../../features/employees/payslip/hooks';
import { getFriendlyTableName, getRelatedTableFromMessage } from '../../../src/utils/fkUtils';
import { useCan } from "../../utils/permissions"; 
import { useRoles } from '../../utils/useRoles';

type Row = {
  id: string;
  full_name: string;
  employee_number?: string | null;
  email: string;
  role_name?: string | null;
  position?: string | null;
  hire_date?: string | null;
  employment_status?: string | null;
  designation?: { title: string } | null;
  organization_name?: string | null;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function EmployeesList() {
  const nav = useNavigate();
  const can = useCan();
  const { isManager } = useRoles();

  // Allow access if user has EITHER manager view OR full employees view
  const canViewEmployees = can("employees:manager:view") || can("employees:view");

  if (!canViewEmployees) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view employees
        </h2>
      </div>
    );
  }

  // True if viewing as manager (has manager perm but NOT full view perm)
  const isManagerOnlyView = can("employees:manager:view") && !can("employees:view");

  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [openPayslip, setOpenPayslip] = useState(false);
  const [selectedPayslipEmployeeId, setSelectedPayslipEmployeeId] = useState<string | null>(null);
  const [showGeneratePayslip, setShowGeneratePayslip] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [proRate, setProRate] = useState(false);
  const [stdDays, setStdDays] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<Row | null>(null);
  const [fkTableName, setFkTableName] = useState<string>('');
  const [rawFkTable, setRawFkTable] = useState<string>('');

  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

const { data, isFetching, isLoading } = useManagedEmployees(
  page,
  limit,
  debouncedSearch,
  {
    crossOrg: true,
    sort_by: sortBy,
    sort_order: sortOrder,
  }
);

useEffect(() => {
  setPage(1);
}, [debouncedSearch, sortBy, sortOrder]);

  const del = useDeleteEmployee();
  const generatePayslip = useGeneratePayslip(() => setShowGeneratePayslip(false));

  useEffect(() => setPage(1), [debouncedSearch]);
  useEffect(() => {
    if (data && isInitialLoad) setIsInitialLoad(false);
  }, [data, isInitialLoad]);

  const rows = (data?.employees ?? []) as Row[];
  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;
  const totalPages = Math.ceil(total / limit);

  const getStatusColor = (status?: string) => {
    const s = (status || "").toLowerCase();
    const map: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      probation: "bg-blue-100 text-blue-800 border-blue-200",
      resigned: "bg-yellow-100 text-yellow-800 border-yellow-200",
      terminated: "bg-red-100 text-red-800 border-red-200",
      inactive: "bg-gray-200 text-gray-600 border-gray-300",
    };
    return map[s] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      {
       header: () => (
  <button
    onClick={() => handleSort('full_name')}
    className="flex items-center gap-1 font-semibold"
  >
    Name {renderSortIcon('full_name')}
  </button>
),
        accessorKey: "full_name",
        cell: ({ getValue }) => <span className="font-medium">{getValue() || "-"}</span>,
      },
      {
       header: () => (
  <button
    onClick={() => handleSort('employee_number')}
    className="flex items-center gap-1 font-semibold"
  >
    Employee No {renderSortIcon('employee_number')}
  </button>
),
        accessorKey: "employee_number",
        cell: ({ getValue }) => <span className="text-sm text-gray-700">{getValue() || "-"}</span>,
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
      },
      {
          header: "Organization",
          accessorKey: "organization_name",
          cell: ({ getValue }) => {
            const org = getValue() as string;

            if (!org) {
              return (
                <span className="text-xs text-gray-400">—</span>
              );
            }

            return (
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {org}
              </span>
            );
          },
        },
      {
        header: "Role",
        accessorKey: "role_name",
        cell: ({ row }) => {
          const role = row.original.role_name;
          if (!role) return <span className="text-gray-400 text-xs">—</span>;
          const colors = [
            "bg-indigo-100 text-indigo-800", "bg-blue-100 text-blue-800", "bg-green-100 text-green-800",
            "bg-yellow-100 text-yellow-800", "bg-purple-100 text-purple-800", "bg-pink-100 text-pink-800",
            "bg-orange-100 text-orange-800", "bg-sky-100 text-sky-800",
          ];
          const index = Array.from(role).reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[index]}`}>{role}</span>;
        },
      },
      {
        header: "Designation",
        accessorFn: (row) => row.designation?.title || "-",
        cell: ({ getValue }) => <span className="text-sm">{getValue()}</span>,
      },
      {
        header: "Status",
        accessorKey: "employment_status",
        cell: ({ getValue }) => {
          const status = (getValue() || "").toLowerCase();
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
            </span>
          );
        },
      },
      ...(can("leaves:view") ? [{
        header: "Leave",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button onClick={() => nav(`/employees/${row.original.id}/view-leave-submission`)} className="p-2 rounded-lg hover:bg-gray-50">
              <CalendarClock className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        )
      }] : []),
      ...(can("employees:bank:accounts:view") ? [{
        header: "Bank",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button onClick={() => setSelectedEmployeeId(row.original.id)} className="p-2 rounded-lg hover:bg-gray-50">
              <LinkIcon className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        )
      }] : []),
      // Allow Manage button if user can view profile (either full or manager view)
      ...((can("employees:view")) ? [{
        header: "Manage",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button onClick={() => nav(`/employees/${row.original.id}`)} className="p-2 rounded-lg hover:bg-gray-50">
              <UserCog className="w-4 h-4 text-pink-600" />
            </button>
          </div>
        )
      }] : []),
      ...(can("employees:update") || can("employees:delete") ? [{
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            {can("employees:update") && (
              <button onClick={() => nav(`/employees/${row.original.id}/edit`)} className="p-2 rounded-lg hover:bg-gray-50">
                <Pencil className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {can("employees:delete") && (
              <button onClick={() => setDeleteTarget(row.original)} className="p-2 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        ),
      }] : []),
    ],
    [nav, can]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Dynamic Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          My Team Members
        </h1>
        <p className="text-slate-600 mt-1">
          {isManagerOnlyView
            ? "View and manage your direct reports"
            : "Manage your team and their records"}
        </p>
      </div>

      {/* Search + Add Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full max-w-lg">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name, email, position, role..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isFetching && !isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />}
          </div>

          {can("employees:create") && (
            <button
              onClick={() => nav('/employees/create')}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Employee</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && rows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-5">
            <Filter className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No employees found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new employee.</p>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && rows.length > 0 && (
        <div className="block lg:hidden space-y-4">
          {rows.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{emp.full_name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Mail className="w-4 h-4" /> {emp.email}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(emp.employment_status)}`}>
                  {emp.employment_status ? emp.employment_status.charAt(0).toUpperCase() + emp.employment_status.slice(1) : "Active"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                {emp.employee_number && (
                  <div><p className="text-gray-500 flex items-center gap-1"><IdCard className="w-4 h-4" />Emp No</p><p className="font-medium">{emp.employee_number}</p></div>
                )}
                {emp.organization_name && (
                  <div>
                    <p className="text-gray-500 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      Organization
                    </p>
                    <p className="font-medium">
                      {emp.organization_name}
                    </p>
                  </div>
                )}
                {emp.role_name && (
                  <div><p className="text-gray-500 flex items-center gap-1"><Badge className="w-4 h-4" />Role</p><p className="font-medium">{emp.role_name}</p></div>
                )}
                {emp.designation?.title && (
                  <div className="col-span-2"><p className="text-gray-500 flex items-center gap-1"><Building2 className="w-4 h-4" />Designation</p><p className="font-medium">{emp.designation.title}</p></div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!isManagerOnlyView && (can("employees:view") || can("employees:manager:view")) && (
                  <button onClick={() => nav(`/employees/${emp.id}`)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                    <UserCog className="w-4 h-4" /> View
                  </button>
                )}
                {can("employees:update") && (
                  <button onClick={() => nav(`/employees/${emp.id}/edit`)} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                )}
                {can("employees:delete") && (
                  <button onClick={() => setDeleteTarget(emp)} className="flex-1 py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {can("attendance:view") && (
                  <button onClick={() => nav(`/employees/${emp.id}/timesheet-attendance`)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Timer className="w-4 h-4 text-emerald-600" /> Attendance
                  </button>
                )}
                {can("leaves:view") && (
                  <button onClick={() => nav(`/employees/${emp.id}/view-leave-submission`)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <CalendarClock className="w-4 h-4 text-orange-600" /> Leave
                  </button>
                )}
                {can("employees:bank:accounts:view") && (
                  <button onClick={() => setSelectedEmployeeId(emp.id)} className="flex-1 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Bank
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Pagination */}
      <div className="lg:hidden mt-6">
        {total > limit && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      {!isLoading && rows.length > 0 && (
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
        </div>
      )}

      {/* Modals */}
      {selectedEmployeeId && (
        <LinkBankAccountModal employeeId={selectedEmployeeId} onClose={() => setSelectedEmployeeId(null)} />
      )}

      {openPayslip && selectedPayslipEmployeeId && (
        <PayslipPreviewModal
          open={openPayslip}
          onClose={() => {
            setOpenPayslip(false);
            setSelectedPayslipEmployeeId(null);
          }}
          employeeId={selectedPayslipEmployeeId}
        />
      )}

      <FormDialog
        open={showGeneratePayslip}
        title="Generate Payslip"
        onClose={() => setShowGeneratePayslip(false)}
        primaryAction={{
          label: generatePayslip.isPending ? 'Generating…' : 'Generate',
          loading: generatePayslip.isPending,
          onClick: () => {
            if (!selectedPayslipEmployeeId) return;
            generatePayslip.mutate({
              employeeId: selectedPayslipEmployeeId,
              month: generateMonth,
              proRate,
              stdDays,
            });
          },
        }}
      >
        <div className="space-y-4 w-full max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input type="month" value={generateMonth} onChange={(e) => setGenerateMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <input id="proRate" type="checkbox" checked={proRate} onChange={(e) => setProRate(e.target.checked)} className="rounded" />
            <label htmlFor="proRate" className="text-sm text-gray-700">Apply Pro-Rate</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="stdDays" type="checkbox" checked={stdDays} onChange={(e) => setStdDays(e.target.checked)} className="rounded" />
            <label htmlFor="stdDays" className="text-sm text-gray-700">Use Standard Days</label>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteTarget?.full_name}"?`}
        confirmLabel="Delete"
        danger
        isLoading={del.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await del.mutateAsync({ employeeId: deleteTarget.id });
            setDeleteTarget(null);
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
        title="Force Delete Employee"
        description={`"${forceDeleteTarget?.full_name}" has related ${fkTableName}. Deleting will also remove related ${fkTableName}. Continue?`}
        confirmLabel="Delete with Related Data"
        danger
        isLoading={del.isPending}
        onConfirm={async () => {
          if (forceDeleteTarget) {
            await del.mutateAsync({
              employeeId: forceDeleteTarget.id,
              force: true,
              table: rawFkTable,
            });
            setForceDeleteTarget(null);
          }
        }}
        onClose={() => setForceDeleteTarget(null)}
      />
    </div>
  );
}