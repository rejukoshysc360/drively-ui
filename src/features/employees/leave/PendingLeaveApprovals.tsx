import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { usePendingLeavesToday } from '../../../features/employees/leave/hooks';
import { APP_CONFIG } from '../../../config/appConfig';
import { useRoles } from '../../../utils/useRoles';

type PendingLeave = {
  id: string;
  employees?: { employee_id: string; full_name: string };
  employee_id?: string;
  leave_policies?: { leave_type: string };
  start_date: string;
  end_date: string;
  manager_approval_status?: string;
  status: string;
  is_half_day?: boolean | string;
  half_day_session?: string | null;
  session?: string | null;
  day_type?: string;
  leave_duration?: string;
};

export default function PendingLeaveApprovals() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const { isManager } = useRoles();


  // ✅ API pagination now
  const { data, isLoading, isFetching } = usePendingLeavesToday(
    isManager,
    page,
    limit,
    true
  );

  const paginatedLeaves: PendingLeave[] = data?.leaves ?? [];

  // ✅ total from API
  const total = data?.count ?? 0;

  // ✅ hasMore from API
  const hasMore = data?.hasMore ?? false;

  const getStatusColor = (status: string | null | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  // Smart Day Type Logic
  const getDayTypeDisplay = (leave: PendingLeave): string => {
    if (leave.day_type) return leave.day_type;

    const isHalfDay =
      leave.is_half_day === true ||
      leave.is_half_day === 'true' ||
      leave.is_half_day === 1;

    if (isHalfDay) {
      const sessionRaw = (
        leave.half_day_session ||
        leave.session ||
        leave.leave_duration ||
        ''
      )
        .toLowerCase()
        .trim();

      if (
        sessionRaw.includes('morning') ||
        sessionRaw.includes('first') ||
        sessionRaw === 'am'
      ) {
        return 'Half Day (Morning)';
      }

      if (
        sessionRaw.includes('evening') ||
        sessionRaw.includes('afternoon') ||
        sessionRaw.includes('second') ||
        sessionRaw === 'pm'
      ) {
        return 'Half Day (Evening)';
      }

      return 'Half Day';
    }

    if (leave.start_date === leave.end_date) {
      return 'Full Day';
    }

    return 'Multiple Days';
  };

  const columns: ColumnDef<PendingLeave>[] = useMemo(
    () => [
      {
        header: 'Employee',
        accessorFn: (row) => row.employees?.full_name ?? 'Unknown',
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        header: 'Leave Type',
        accessorFn: (row) => row.leave_policies?.leave_type ?? '-',
        cell: ({ getValue }) => (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {getValue() as string}
          </span>
        ),
      },
      {
        header: 'Duration',
        cell: ({ row }) => {
          const start = row.original.start_date;
          const end = row.original.end_date;

          return (
            <span className="text-sm text-slate-600">
              {start} {start !== end && `→ ${end}`}
            </span>
          );
        },
      },
      {
        header: 'Day Type',
        cell: ({ row }) => {
          const display = getDayTypeDisplay(row.original);
          const isHalf = display.includes('Half');

          return (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                isHalf
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              {display}
            </span>
          );
        },
      },
      {
        header: 'Manager Approval',
        accessorKey: 'manager_approval_status',
        cell: ({ getValue }) => {
          const status = (getValue() as string) || 'PENDING';

          return (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                status
              )}`}
            >
              {status.toUpperCase()}
            </span>
          );
        },
      },
      {
        header: 'HR Status',
        accessorKey: 'status',
        cell: ({ getValue }) => {
          const status = (getValue() as string) || 'PENDING';

          return (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                status
              )}`}
            >
              {status.toUpperCase()}
            </span>
          );
        },
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => {
          const employeeId =
            row.original.employees?.employee_id ??
            row.original.employee_id;

          return (
            <button
              onClick={() =>
                navigate(
                  `/employees/${employeeId}/view-leave-submission`
                )
              }
              className="px-5 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            >
              View Details
            </button>
          );
        },
      },
    ],
    [navigate]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-xl transition"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>

        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Pending Leave Approvals
          </h1>

          <p className="text-slate-600 mt-1">
            Review and take action on all pending leave requests
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>

          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {total}
            </p>

            <p className="text-sm text-slate-500">
              Total Pending Requests
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 animate-pulse"
            />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h3 className="text-xl font-semibold text-slate-700">
            No pending leave requests
          </h3>

          <p className="text-slate-500 mt-2">
            All leave applications have been processed.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE: Card Layout */}
          <div className="block lg:hidden space-y-4">
            {paginatedLeaves.map((leave) => {
              const employeeName =
                leave.employees?.full_name ?? 'Unknown';

              const employeeId =
                leave.employees?.employee_id ??
                leave.employee_id;

              const dayType = getDayTypeDisplay(leave);

              return (
                <div
                  key={leave.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">
                        {employeeName}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {leave.leave_policies?.leave_type}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        dayType.includes('Half')
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {dayType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-sm mb-6">
                    <div>
                      <p className="text-slate-500">Duration</p>

                      <p className="font-medium">
                        {leave.start_date}{' '}
                        {leave.start_date !== leave.end_date &&
                          `→ ${leave.end_date}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Manager</p>

                      <span
                        className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          leave.manager_approval_status
                        )}`}
                      >
                        {(
                          leave.manager_approval_status ||
                          'PENDING'
                        ).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/employees/${employeeId}/view-leave-submission`
                      )
                    }
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>

          {/* DESKTOP: Table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <DataTable
                data={paginatedLeaves}
                columns={columns}
                total={total}
                page={page}
                limit={limit}
                onPageChange={setPage}
                isFetching={isFetching}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}