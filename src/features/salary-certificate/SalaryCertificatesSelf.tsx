import React, { useState } from "react";
import {
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuth } from "../auth/AuthProvider";
import { useCan } from "../../utils/permissions";
import {
  useSalaryCertificates,
  useGenerateSalaryCertificate,
  useDeleteSalaryCertificate,
  useDownloadSalaryCertificatePDF,
} from "./hooks";
import FormDialog from "../../components/ui/FormDialog";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SalaryCertificatePreviewModal from "./SalaryCertificatePreviewModal";

/* ---------------------- Main Component ---------------------- */
export default function SalaryCertificatesSelf() {
  const can = useCan();
  const canViewOwn = can("employees:view_own_record_only");
  const { profile } = useAuth();

  if (!canViewOwn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 text-sm">
        You don’t have permission to view your salary certificates.
      </div>
    );
  }

  const employeeId = profile?.id;
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<any>(null);
  const [requestDialog, setRequestDialog] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const generate = useGenerateSalaryCertificate();
  const deleteCert = useDeleteSalaryCertificate();
  const downloadCertificate = useDownloadSalaryCertificatePDF();

  const { data, isLoading, isFetching, refetch } = useSalaryCertificates({
    page,
    limit,
    employee_id: employeeId,
  });

  const certificates = data?.certificates ?? [];
  const totalPages = data?.paginationMetaInfo?.totalPages ?? 1;
  const total = data?.paginationMetaInfo?.total ?? 0;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "released":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Released
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Requested
          </span>
        );
    }
  };

  const handleRequest = async () => {
    if (!purpose.trim()) {
      toast.error("Please select a purpose");
      return;
    }
    await generate.mutateAsync({ employee_id: employeeId!, purpose });
    setRequestDialog(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCert.mutateAsync({ certificate_id: id });
      toast.success("Salary certificate deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete request");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleDownloadPDF = async (certificateId: string) => {
    try {
      setDownloadingId(certificateId);
      const res = await downloadCertificate.mutateAsync({ certificateId });
      if (!res?.url) throw new Error("No URL");

      const response = await fetch(res.url);
      if (!response.ok) throw new Error("Failed to fetch certificate PDF");
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `salary-certificate-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download salary certificate");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          My Salary Certificates
        </h2> 
      </div>

      {/* Loading & Empty States */}
      {isLoading || isFetching ? (
        <div className="text-center text-gray-500 py-10">
          <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin text-indigo-600" />
          Loading...
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white border border-gray-200 rounded-xl">
          No salary certificates found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide">
                    Date
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide">
                    Purpose
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="border-t border-gray-200">
                {certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="p-3">
                      {new Date(c.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3">{c.certificate_json.purpose ?? "—"}</td>
                    <td className="p-3">{getStatusBadge(c.status)}</td>
                    <td className="p-3 text-center">
                      {c.status === "released" ? (
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => {
                              setPreviewCertificate(c);
                              setPreviewOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(c.id)}
                            disabled={downloadingId === c.id}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition disabled:opacity-50"
                            title="Download"
                          >
                            {downloadingId === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-3">
                          <span className="text-xs text-gray-400 italic self-center">
                            Awaiting HR approval
                          </span>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            disabled={deletingId === c.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition disabled:opacity-50"
                            title="Delete Request"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 text-sm text-gray-600 border-t bg-gray-50">
                <span>
                  Page {page} of {totalPages} ({total} items)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1 || isFetching}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 bg-white ${
                      page === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages || isFetching}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 bg-white ${
                      page >= totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {certificates.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(c.created_at).toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Purpose: {c.certificate_json.purpose ?? "—"}
                    </p>
                    <div className="mt-2">{getStatusBadge(c.status)}</div>
                  </div>

                  {c.status === "released" ? (
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => {
                          setPreviewCertificate(c);
                          setPreviewOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(c.id)}
                        disabled={downloadingId === c.id}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition disabled:opacity-50"
                        title="Download"
                      >
                        {downloadingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-400 italic">
                        Awaiting HR approval
                      </span>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        disabled={deletingId === c.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition disabled:opacity-50"
                        title="Delete Request"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination for Mobile */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-2 py-3 text-sm text-gray-600">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1 || isFetching}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages || isFetching}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 bg-white disabled:opacity-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Request Dialog */}
      <FormDialog
        open={requestDialog}
        title="Request Salary Certificate"
        onClose={() => setRequestDialog(false)}
        primaryAction={{
          label: generate.isPending ? "Submitting..." : "Submit",
          loading: generate.isPending,
          onClick: handleRequest,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setRequestDialog(false),
        }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Purpose <span className="text-red-600">*</span>
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select purpose</option>
            <option value="General">General</option>
            <option value="Opening Bank Account">Opening Bank Account</option>
            <option value="Visa Application">Visa Application</option>
          </select>
        </div>
      </FormDialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Salary Certificate Request"
        description={`Are you sure you want to delete your salary certificate request for "${deleteTarget?.certificate_json?.purpose}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={deletingId === deleteTarget?.id}
        onConfirm={() => handleDelete(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* PDF Viewer */}
      <SalaryCertificatePreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewCertificate(null);
        }}
        certificate={previewCertificate}
      />
    </div>
  );
}
