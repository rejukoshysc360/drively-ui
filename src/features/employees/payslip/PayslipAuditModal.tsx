import { useState, useEffect } from "react";
import { Loader2, FileText, History, Clock, Calendar, X } from "lucide-react";
import { usePayslipAudit } from "./hooks";
import PayslipPreviewModal from "./PayslipPreviewModal";
import { getCurrentMonth } from "../../../utils/DateUtils";

type AuditRecord = {
  id: string;
  version: number;
  month: string;
  generated_at: string;
  comments?: string;
  created_by_name?: string;
  final_payslip?: {
    pdf_url?: string;
    signed_url?: string;
  } | null;
};

export default function PayslipAuditModal({
  open,
  onClose,
  employeeId,
  month: propMonth,
}: {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  month?: string;
}) {
  const [page, setPage] = useState(1);
  const limit = 5;
  const [selectedVersion, setSelectedVersion] = useState<AuditRecord | null>(
    null
  );

  // ✅ Default to current month instead of previous month
  const [month, setMonth] = useState(propMonth || getCurrentMonth());

  const { data, isLoading, isFetching, refetch } = usePayslipAudit(
    employeeId,
    month,
    page,
    limit,
    open
  );

  const records: AuditRecord[] = data?.versions ?? [];
  const total = data?.paginationMetaInfo?.totalCount ?? records.length;

  useEffect(() => {
    if (open && month) {
      setPage(1);
      refetch();
    }
  }, [month, open, refetch]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/40">
        <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 gap-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-900" />
              <h2 className="text-lg font-semibold text-indigo-900">
                Payslip Audit Trail
              </h2>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="w-full sm:w-auto">
                <div className="relative max-w-xs mx-auto sm:mx-0">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    max={getCurrentMonth()}
                    className="w-full sm:w-auto pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/70 transition sm:static sm:ml-2"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="flex flex-col items-center py-16 text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Loading audit history…</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <Clock className="w-10 h-10 text-gray-400" />
                </div>
                <p className="font-medium text-gray-600">
                  No audit history found
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  No payslips for this month.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">
                            Version
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">
                            Generated At
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">
                            Created By
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900">
                            Comments
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-900">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((v) => (
                          <tr key={v.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-indigo-600">
                              v{v.version}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {new Date(v.generated_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {v.created_by_name || "—"}
                            </td>
                            <td
                              className="px-4 py-3 text-gray-600 max-w-xs truncate"
                              title={v.comments}
                            >
                              {v.comments || "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedVersion(v)}
                                disabled={!v.final_payslip}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full hover:bg-indigo-200 disabled:opacity-50 transition"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-5 space-y-4">
                  {records.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-indigo-600">
                            v{v.version}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(v.generated_at).toLocaleDateString()} ·{" "}
                            {new Date(v.generated_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedVersion(v)}
                          disabled={!v.final_payslip}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </button>
                      </div>

                      {v.created_by_name && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">By:</span>{" "}
                          {v.created_by_name}
                        </p>
                      )}

                      {v.comments && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{v.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedVersion && (
        <PayslipPreviewModal
          open={!!selectedVersion}
          onClose={() => setSelectedVersion(null)}
          employeeId={employeeId}
          previewData={selectedVersion.final_payslip as any}
          auditId={selectedVersion.id}
        />
      )}
    </>
  );
}