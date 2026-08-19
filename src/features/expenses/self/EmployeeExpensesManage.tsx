import { useEffect, useMemo, useState, useCallback } from "react";
import Select from "react-select"; // ← Regular Select (not AsyncSelect)
import { toast } from "react-hot-toast";
import {
  Check,
  X as XIcon,
  FileText,
  Download,
  DollarSign,
  Calendar,
  Filter,
  Loader2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import FormDialog from "../../../components/ui/FormDialog";
import { useAuth } from "../../auth/AuthProvider";
import {
  useHRExpenses,
  useUpdateExpense,
  useAttachmentPreview,
} from "../self/hooks";
import { useEmployees } from "../../employees/hooks";
import { useCan } from "../../../utils/permissions";
import { APP_CONFIG } from "../../../config/appConfig";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
      statusColors[status] || "bg-gray-100 text-gray-600"
    }`}
  >
    {status}
  </span>
);

const formatMoney = (n: number, currency: string = "USD") => {
  // Clean and normalize
  const safeCurrency = (currency || "USD").trim().toUpperCase();

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
    }).format(isFinite(n) ? n : 0);
  } catch (err) {
    console.warn("Invalid currency code:", safeCurrency, "- falling back to USD");
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(isFinite(n) ? n : 0);
  }
};


const formatDate = (dateStr?: string) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function EmployeeExpensesManage() {
  const { organization_id, organization_currency = "USD" } = useAuth();
  const can = useCan();
  const canView = can("expenses:view");
  const canUpdate = can("expenses:update");
  const [approvingId, setApprovingId] = useState<string | null>(null);


  const [rejectingExpense, setRejectingExpense] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  if (!canView) {
    return (
      <div className="p-10 text-center text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p>You do not have permission to view employee expenses.</p>
      </div>
    );
  }

  // === Filters ===
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Live employee search input
  const [employeeSearchInput, setEmployeeSearchInput] = useState("");

  // Search only when 3+ characters
  const employeeSearchTerm = employeeSearchInput.length >= 3 ? employeeSearchInput.trim() : "";

  const { data: employeeSearchData, isLoading: isSearchingEmployees } = useEmployees(
    1,
    50,
    employeeSearchTerm
  );

  const employeeOptions = (employeeSearchData?.employees || []).map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email})`,
  }));

  // Default employee list when dropdown opens (empty search)
  const { data: defaultEmployeeData } = useEmployees(1, 50, "");
  const defaultEmployeeOptions = (defaultEmployeeData?.employees || []).map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email})`,
  }));

  // === Pagination ===
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE || 15;

  useEffect(() => {
    setPage(1);
  }, [status, dateFrom, dateTo, selectedEmployee]);

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      from_date: dateFrom,
      to_date: dateTo,
      employee_id: selectedEmployee?.value || undefined,
      page,
      limit,
    }),
    [status, dateFrom, dateTo, selectedEmployee, page, limit]
  );

  const { data, isLoading, isFetching } = useHRExpenses(organization_id!, filters);
  const updateExpenseMutation = useUpdateExpense(organization_id!);
  const previewAttachmentMutation = useAttachmentPreview(organization_id!);

  const expenses = data?.expenses || [];
  const total = data?.paginationMetaInfo?.totalCount || 0;
  const totalPages = data?.paginationMetaInfo?.totalPages || 1;

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  const handleApprove = (id: string) => {
  if (!canUpdate) return;

  setApprovingId(id); // ✅ set loading state

  updateExpenseMutation.mutate(
    { id, status: "approved" },
    {
      onSettled: () => {
        setApprovingId(null); // ✅ reset after done
      },
    }
  );
};


  const handlePreview = (expenseId: string, att: any) => {
    const fileName = att.filename || "attachment";
    setPreviewSrc(null);
    setPreviewName(fileName);

    previewAttachmentMutation.mutate(
      { expense_id: expenseId, attachment_id: att.id },
      {
        onSuccess: (res: any) => {
          setPreviewSrc(res.url);
          setPreviewName(res.filename || fileName);
        },
        onError: () => toast.error("Failed to load preview"),
      }
    );
  };

  const runningTotal = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

  const handleExportCSV = () => {
    if (!expenses.length) {
      toast.error("No data to export");
      return;
    }

    const safeCSV = (s: any) => {
      const v = String(s ?? "").replace(/"/g, '""');
      return /[,"\n]/.test(v) ? `"${v}"` : v;
    };

    const lines: string[] = [];
    lines.push(`HR Expense Report: ${dateFrom} to ${dateTo}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    lines.push(
      [
        "Invoice No",
        "Employee",
        `Amount (${organization_currency})`,
        "Description",
        "Expense Date",
        "Created Date",
        "Status",
        "Attachments",
      ].join(",")
    );

    for (const exp of expenses) {
      const files = (exp.attachments || [])
        .map((a: any) => a.filename?.split("/").pop() || a.filename)
        .join("; ");
      lines.push(
        [
          safeCSV(exp.invoice_no || "-"),
          safeCSV(exp.employee_name || "-"),
          exp.amount || 0,
          safeCSV(exp.description || "-"),
          exp.expense_date || "-",
          exp.created_at || "-",
          exp.status,
          safeCSV(files),
        ].join(",")
      );
    }

    lines.push("");
    lines.push(`Total,,${runningTotal},,,,,`);

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `HR_Expenses_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-indigo-600" />
          HR — Expense Approvals
        </h1>
        <p className="text-slate-600 mt-2">
          Review, approve, or reject employee expense claims
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Filter className="w-5 h-5" />
            Filters
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-md transition"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee (optional)
            </label>
            <Select
              options={employeeSearchTerm ? employeeOptions : defaultEmployeeOptions}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              onInputChange={setEmployeeSearchInput}
              placeholder="Type to search (min 3 chars)..."
              isClearable
              isLoading={isSearchingEmployees}
              isSearchable
              noOptionsMessage={() =>
                employeeSearchInput.length < 3
                  ? "Type at least 3 characters"
                  : "No employees found"
              }
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "44px",
                  borderRadius: "0.75rem",
                  borderColor: "#d1d5db",
                }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-5">
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
      {!isLoading && expenses.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-5">
            <Receipt className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No expenses found</h3>
          <p className="text-gray-500">Try adjusting your filters.</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && expenses.length > 0 && (
        <>
          {/* Mobile Cards */}
          <div className="block lg:hidden space-y-4">
            {expenses.map((exp: any) => (
              <div key={exp.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Invoice</p>
                    <p className="font-bold text-gray-900">{exp.invoice_no || "—"}</p>
                  </div>
                  <StatusBadge status={exp.status} />
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Employee</p>
                    <p className="font-medium">{exp.employee_name}</p>
                  </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-bold text-indigo-700">
                    {formatMoney(Number(exp.amount || 0), organization_currency)}
                  </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Expense Date</p>
                    <p className="font-medium">{formatDate(exp.expense_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-gray-700">{exp.description || "—"}</p>
                  </div>
                </div>

                {(exp.attachments || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {exp.attachments.map((att: any) => (
                        <button
                          key={att.id}
                          onClick={() => handlePreview(exp.id, att)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <FileText className="w-4 h-4" />
                          {att.filename?.split("/").pop() || "File"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {exp.status === "submitted" && canUpdate && (
                  <div className="flex gap-3 mt-5">
                   <button
                    onClick={() => handleApprove(exp.id)}
                    disabled={approvingId === exp.id}
                    className={`flex-1 py-1 font-medium rounded-xl transition ${
                      approvingId === exp.id
                        ? "bg-green-400 cursor-not-allowed text-white"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {approvingId === exp.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </button>
                    <button
                      onClick={() => setRejectingExpense(exp)}
                      className="flex-1 py-1 bg-red-100 rounded-xl text-red-700 font-medium rounded-2xl hover:bg-red-200 transition text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attachments
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {exp.invoice_no || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {exp.employee_name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatMoney(Number(exp.amount || 0), organization_currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={exp.description}>
                        {exp.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(exp.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {(exp.attachments || []).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {exp.attachments.map((att: any) => (
                              <button
                                key={att.id}
                                onClick={() => handlePreview(exp.id, att)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                              >
                                <FileText className="w-4 h-4" />
                                {att.filename?.split("/").pop() || "File"}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={exp.status} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleApprove(exp.id)}
                          disabled={exp.status !== "submitted" || !canUpdate || approvingId === exp.id}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition ${
                            approvingId === exp.id
                              ? "bg-green-400 text-white cursor-not-allowed"
                              : exp.status === "submitted" && canUpdate
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {approvingId === exp.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>

                          <button
                            onClick={() => setRejectingExpense(exp)}
                            disabled={exp.status !== "submitted" || !canUpdate}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition ${
                              exp.status === "submitted" && canUpdate
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            <XIcon className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Row */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t px-6 py-5">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
                <div className="flex items-center gap-2 text-base font-bold text-indigo-900">
                  Total Amount
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  {formatMoney(runningTotal, organization_currency)}
                </div>
                <div className="text-sm font-medium text-indigo-700">
                  {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} expenses
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1 || isFetching}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-4 text-sm font-medium">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isFetching}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages || isFetching}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Attachment Preview Modal */}
      <FormDialog
        open={!!previewSrc}
        title={previewName || "Attachment Preview"}
        onClose={() => {
          setPreviewSrc(null);
          setPreviewName("");
        }}
        maxWidth="max-w-5xl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg gap-3">
          <p className="text-sm font-medium text-gray-700 truncate max-w-full">
            {previewName}
          </p>
          {previewSrc && (
            <a
              href={previewSrc}
              download={previewName}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
            >
              <Download className="w-5 h-5" />
              Download
            </a>
          )}
        </div>

        <div className="h-96 sm:h-[70vh] border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
          {previewSrc ? (
            <iframe className="w-full h-full" src={previewSrc} title={previewName} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Loading preview...</p>
            </div>
          )}
        </div>
      </FormDialog>
      {rejectingExpense && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Reject Expense — {rejectingExpense.invoice_no || "Untitled"}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        Please provide a reason for rejecting this expense. This will be visible to the employee.
      </p>

      <textarea
        value={rejectionReason}
        onChange={(e) => {
          setRejectionReason(e.target.value);
          if (rejectionError) setRejectionError("");
        }}
        rows={4}
        className={`w-full rounded-lg border p-3 text-sm focus:ring-2 focus:ring-indigo-500 ${
          rejectionError ? "border-red-500" : "border-gray-300"
        }`}
        placeholder="Enter rejection reason..."
      />
      {rejectionError && (
        <p className="text-xs text-red-600 mt-1">{rejectionError}</p>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => {
            setRejectingExpense(null);
            setRejectionReason("");
            setRejectionError("");
          }}
          className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          Cancel
        </button>
<button
  disabled={isRejecting}
  onClick={() => {
    if (!rejectionReason.trim()) {
      setRejectionError("Rejection reason is required.");
      return;
    }
    setIsRejecting(true);
    updateExpenseMutation.mutate(
      {
        id: rejectingExpense.id,
        status: "rejected",
        rejection_reason: rejectionReason.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Expense rejected");
          setRejectingExpense(null);
          setRejectionReason("");
        },
        onError: () => toast.error("Failed to reject expense"),
        onSettled: () => setIsRejecting(false),
      }
    );
  }}
  className={`px-4 py-2 rounded-lg text-sm text-white ${
    isRejecting
      ? "bg-red-400 cursor-not-allowed"
      : "bg-red-600 hover:bg-red-700"
  }`}
>
  {isRejecting ? "Rejecting..." : "Confirm Reject"}
</button>

      </div>
    </div>
  </div>
)}

    </div>
  );
}