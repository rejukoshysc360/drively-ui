import { useMemo, useState, useRef, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Loader2,
  FileText,
  Plus,
  History,
  Users,
  Search,
  Calendar,
} from 'lucide-react';
import { APP_CONFIG } from '../../../config/appConfig';
import DataTable from '../../../components/ui/DataTable';
import FormDialog from '../../../components/ui/FormDialog';
import PayslipPreviewModal from '../payslip/PayslipPreviewModal';
import { useEmployees } from '../hooks';
import { useGeneratePayslip } from '../payslip/hooks';
import { useAuth } from '../../auth/AuthProvider';
import PayslipAuditModal from './PayslipAuditModal';
import { useCan } from '../../../utils/permissions'; // ✅ RBAC Hook

type Row = {
  id: string;
  full_name: string;
  email: string;
  hire_date?: string | null;
  employment?: {
    end_date: string | null;
    probation_status: string | null;
    notice_given_date: string | null;
  } | null;
};

// ─────────────────────────────────────────────
// Main Payroll Table
// ─────────────────────────────────────────────
export default function EmployeePayroll() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [openPayslip, setOpenPayslip] = useState(false);
  const [openAudit, setOpenAudit] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Row | null>(null);
  const [showGeneratePayslip, setShowGeneratePayslip] = useState(false);
  const [generateMonth, setGenerateMonth] = useState<string>('');

  const [skipProRate, setSkipProRate] = useState(false);
  const [skipLeaveFlag, setSkipLeaveFlag] = useState(false);
  const [comment, setComment] = useState('');

  // ✅ RBAC Permissions
  const can = useCan();
  const canView = can('payslips:view');
  const canGenerate = can('payslips:generate');
  const canAudit = can('payslips:audit');
  const canViewAll = can("payslips:view");

  // 🔒 Restrict employee access based on permissions
  const canViewOwn = can('payslips:view_own_record_only');

  // 🧩 Debug logging
  console.groupCollapsed("🔐 [EmployeePayroll Permissions Check]");
  console.log("canView:", canView);
  console.log("canGenerate:", canGenerate);
  console.log("canAudit:", canAudit);
  console.log("canViewOwn:", canViewOwn);
   console.log("canViewAll:", canViewAll);
  console.groupEnd();

  const { profile } = useAuth();
  const loggedInEmployeeId = profile?.id;


  // Prevent employees from accessing others' payrolls
  if (!canView) {
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
            You do not have permission to view or manage payslips.
            Please contact your HR or Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }


  const currentMonth = new Date().toISOString().slice(0, 7);
  const endDateMonth =
  selectedEmployee?.employment?.end_date?.slice(0, 7) ?? null;

  const maxMonth =
  endDateMonth && endDateMonth <= currentMonth
    ? endDateMonth
    : currentMonth;


  const {
    organization_id,
    organization_name,
    organization_country_code,
    organization_currency,
  } = useAuth();

  const { data, isFetching, isLoading } = useEmployees(
    page,
    limit,
    searchInput.trim()
  );

const generatePayslip = useGeneratePayslip();

  useEffect(() => {
    if (!selectedEmployee) return;

    const end = selectedEmployee.employment?.end_date;
    if (end) {
      setGenerateMonth(end.slice(0, 7));
    } else {
      const d = new Date();
      setGenerateMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  }, [selectedEmployee]);

  const rowsAll = (data?.employees ?? []) as Row[];
  const rows = canView
    ? rowsAll
    : rowsAll.filter((emp) => emp.id === loggedInEmployeeId);

  const total = data?.paginationMetaInfo?.totalCount ?? rows.length;

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      {
        header: 'Employee',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.original.full_name}
            </p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        ),
      },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const r = row.original;
          const id = r.id;

          return (
            <div className="flex items-center justify-center gap-2">

              {/* ✅ View Payslip */}
              {canView && (
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-emerald-50 transition"
                  title="View Latest Payslip"
                  onClick={() => {
                    setSelectedEmployeeId(id);
                    setSelectedEmployee(r);
                    setOpenPayslip(true);
                  }}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                </button>
              )}

              {/* ✅ Generate Payslip */}
              {canGenerate && (
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-blue-50 transition"
                  title="Generate New Payslip"
                  onClick={() => {
                    setSelectedEmployeeId(id);
                    setSelectedEmployee(r);
                    setShowGeneratePayslip(true);
                  }}
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                </button>
              )}

              {/* ✅ View Audit Trail */}
              {canAudit && (
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                  title="View Audit Trail"
                  onClick={() => {
                    setSelectedEmployeeId(id);
                    setSelectedEmployee(r);
                    setOpenAudit(true);
                  }}
                >
                  <History className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [canView, canGenerate, canAudit]
  );

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2.5 lg:gap-3">
          <Users className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-600" />
          Employee Payroll
        </h1>
        <p className="text-sm lg:text-base text-slate-600 mt-1.5">
          Generate, view, and audit employee payslips
        </p>
      </div>

      {/* Search Card */}
      {/* Search Card — Fixed overflow on mobile */}
<div className="mx-4 lg:mx-0">
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-5">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by name or email..."
        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {isFetching && !isLoading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
      )}
    </div>
  </div>
</div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {/* MOBILE CARD VIEW - ONLY VISIBLE ON MOBILE */}
      <div className="block lg:hidden mx-4 mt-6 space-y-4">
        {rows.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {emp.full_name}
                </h3>
                <p className="text-sm text-gray-600">{emp.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {canView && (
                <button
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setSelectedEmployee(emp);
                    setOpenPayslip(true);
                  }}
                  className="flex flex-col items-center gap-1.5 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">View Payslip</span>
                </button>
              )}

              {canGenerate && (
                <button
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setSelectedEmployee(emp);
                    setShowGeneratePayslip(true);
                  }}
                  className="flex flex-col items-center gap-1.5 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Generate</span>
                </button>
              )}

              {canAudit && (
                <button
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setSelectedEmployee(emp);
                    setOpenAudit(true);
                  }}
                  className="flex flex-col items-center gap-1.5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  <History className="w-5 h-5" />
                  <span className="text-xs">Audit</span>
                </button>
              )}
            </div>
          </div>  
        ))}
      </div> 

      {/* MOBILE PAGINATION - EXACTLY LIKE EmployeesList.tsx */}
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
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / limit) || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
      

      {/* DESKTOP TABLE - YOUR ORIGINAL (UNCHANGED) */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No employees found
            </h3>
            <p className="text-gray-500">Try adjusting your search.</p>
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

      {/* Payslip Preview */}
      {openPayslip && selectedEmployeeId && canView && (
        <PayslipPreviewModal
          open={openPayslip}
          onClose={() => {
            setOpenPayslip(false);
            setSelectedEmployeeId(null);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployeeId}
          employment={selectedEmployee?.employment ?? null}
        />
      )}

      {/* Audit Modal */}
      {openAudit && selectedEmployeeId && canAudit && (
        <PayslipAuditModal
          open={openAudit}
          onClose={() => {
            setOpenAudit(false);
            setSelectedEmployeeId(null);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployeeId}
        />
      )}

      {/* Generate Payslip Modal */}
      {canGenerate && (
        <FormDialog
          open={showGeneratePayslip}
          title="Generate Payslip"
          onClose={() => setShowGeneratePayslip(false)}
          primaryAction={{
            label: generatePayslip.isPending ? 'Generating...' : 'Generate Payslip',
            loading: generatePayslip.isPending,
            onClick: () => {
  if (!selectedEmployeeId) return;
  generatePayslip.mutate(
    {
      employeeId: selectedEmployeeId,
      month: generateMonth,
      skipProRate,
      skipLeaveFlag,
      comment: comment.trim() || null,
      organization: {
        id: organization_id,
        name: organization_name,
        country_code: organization_country_code,
        currency: organization_currency,
      },
    },
    {
      onSuccess: () => {
        // ✅ Only close when success
        setShowGeneratePayslip(false);
        setSelectedEmployeeId(null);
        setSelectedEmployee(null);
      },
    }
  );
},
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => setShowGeneratePayslip(false),
          }}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="inline w-4 h-4 mr-1" />
                Month
              </label>
              <input
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                min={
                    selectedEmployee?.hire_date
                    ? selectedEmployee.hire_date.slice(0, 7)
                    : undefined
                }
                max={maxMonth}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={skipProRate}
                  onChange={(e) => setSkipProRate(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Skip Pro-Rate
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={skipLeaveFlag}
                  onChange={(e) => setSkipLeaveFlag(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Skip Leave Deduction
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add any notes or special instructions..."
              />
            </div>
          </div>
        </FormDialog>
      )}
    </div>
  );
}
