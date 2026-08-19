// src/payroll/certificates/JoiningCertificateRequestsWidget.tsx
import { useState } from "react";
import { FileText, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useJoiningCertificateRequests } from "./hooks";
import { APP_CONFIG } from "../../config/appConfig";

export default function JoiningCertificateRequestsWidget() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const { data, isLoading } = useJoiningCertificateRequests(page, limit, "requested");

  const records = data?.certificates ?? [];
  const pagination = data?.paginationMetaInfo;

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
       <div className="flex items-center gap-3">
  <FileText className="w-5 h-5 text-indigo-600" />

  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
    Joining Certificate Requests
  </h2>
</div>
        <button
          onClick={() => navigate("/manage-joining-certificates")}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
        >
          View All <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          Loading requests…
        </div>
      ) : records.length > 0 ? (
        <>
          <div className="divide-y divide-gray-100">
            {records.map((r, i) => (
              <div
                key={r.id || i}
                className="flex items-start justify-between py-2.5 text-sm group"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {r.employee?.full_name || "—"}
                  </p>
                  <p className="text-gray-600 italic">
                    {r.certificate_json?.note || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>
                    {r.requested_at
                      ? format(new Date(r.requested_at), "d MMM yyyy")
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-3">
              <div className="inline-flex items-center gap-3 text-xs text-gray-600 border rounded px-3 py-1 shadow-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2 py-1 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2 py-1 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">
          No joining certificate requests found.
        </div>
      )}
    </div>
  );
}
