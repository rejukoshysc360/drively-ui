import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Eye,
  UserCheck,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Select from "react-select";
import DataTable from "../../components/ui/DataTable";
import FormDialog from "../../components/ui/FormDialog";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuth } from "../auth/AuthProvider";
import { useCan } from "../../utils/permissions";
import { useEmployees } from "../employees/hooks";
import {
  useSalaryCertificates,
  useGenerateSalaryCertificate,
  useDeleteSalaryCertificate,
  useReleaseSalaryCertificate,
  useGetSalaryCertificatePresignedURL,
} from "./hooks";
import SalaryCertificatePreviewModal from "./SalaryCertificatePreviewModal"; // ✅ Reused
import { PdfDownloadButton } from "../../components/pdf/usePdfDownload";

type Certificate = {
  id: string;
  employee_id: string;
  status?: "requested" | "released";
  certificate_json: {
    employee_name: string;
    purpose: string;
  };
  pdf_url?: string;
  created_at: string;
  employee?: { full_name: string; email: string };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SalaryCertificatesList() {
  const can = useCan();
  const canGenerate = can("employees:view");
  const { organization_id } = useAuth();

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const [statusFilter, setStatusFilter] = useState<"all" | "requested" | "released">("all");

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [generateDialog, setGenerateDialog] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const generate = useGenerateSalaryCertificate();
  const releaseCert = useReleaseSalaryCertificate();
  const deleteCert = useDeleteSalaryCertificate();
  const getPresigned = useGetSalaryCertificatePresignedURL();

  // Employee search
  const { data: empSearchData, isLoading: empLoading } = useEmployees(1, 20, employeeSearchText);
  const employeeOptions =
    empSearchData?.employees?.map((e: any) => ({
      value: e.id,
      label: `${e.full_name} (${e.email})`,
    })) || [];

  // Fetch salary certificates
  const { data, isFetching, isLoading } = useSalaryCertificates({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter === "all" ? "" : statusFilter,
  });

  const [tableData, setTableData] = useState<any>(null);
  useEffect(() => {
    if (data) setTableData(data);
  }, [data]);

  const certificates = (tableData?.certificates ?? []) as Certificate[];
  const total = tableData?.paginationMetaInfo?.total ?? 0;
  const totalPages = tableData?.paginationMetaInfo?.totalPages ?? 1;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "released":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Released
          </span>
        );
      case "requested":
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Requested
          </span>
        );
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Employee",
        accessorKey: "employee",
        cell: ({ row }: any) => {
          const cert = row.original;
          const name =
            cert.certificate_json?.employee_name || cert.employee?.full_name || "—";
          return <p className="font-medium text-gray-900">{name}</p>;
        },
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }: any) => {
          const email = row.original.employee?.email;
          return email ? <span>{email}</span> : <span className="text-gray-400">—</span>;
        },
      },
      {
        header: "Purpose",
        accessorKey: "purpose",
        cell: ({ row }: any) => eOrDash(row.original.certificate_json?.purpose),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }: any) => getStatusBadge(row.original.status),
      },
      {
        header: "Date",
        accessorKey: "created_at",
        cell: ({ getValue }: any) =>
          new Date(getValue()).toLocaleDateString("en-GB"),
      },
      {
        header: "Actions",
        accessorKey: "actions",
        cell: ({ row }: any) => {
          const cert = row.original;
          const isRequested = cert.status === "requested";
          const isReleased = cert.status === "released";

          return (
            <div className="flex justify-center items-center gap-2">
              {isRequested && (
                <button
                  title="Approve and Generate Certificate"
                  onClick={() => handleApprove(cert.id)}
                  disabled={approvingId === cert.id}
                  className={`p-2 rounded-lg text-green-600 transition ${
                    approvingId === cert.id
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-50"
                  }`}
                >
                  {approvingId === cert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {isReleased && (
                <>
                  <button
                    title="Preview Certificate"
                    onClick={() => {
                      setPreviewCertificate(cert);
                      setPreviewOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    title="Download from S3"
                    onClick={() => handleDownloadFromS3(cert.id)}
                    disabled={downloadingId === cert.id}
                    className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition ${
                      downloadingId === cert.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {downloadingId === cert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}

              <button
                title="Delete Certificate"
                onClick={() => setDeleteTarget(cert)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [releaseCert.isPending, approvingId, downloadingId]
  );

  function eOrDash(value?: string) {
    return value ? <span>{value}</span> : <span className="text-gray-400">—</span>;
  }

  const handleApprove = async (certificateId: string) => {
    try {
      setApprovingId(certificateId);
      await releaseCert.mutateAsync(certificateId);

      setTableData((prev: any) => {
        if (!prev?.certificates) return prev;
        const updated = prev.certificates.map((cert: any) =>
          cert.id === certificateId ? { ...cert, status: "released" } : cert
        );
        return { ...prev, certificates: updated };
      });

      toast.success("Salary certificate released successfully");
    } catch {
      toast.error("Failed to release certificate");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDownloadFromS3 = async (certificateId: string) => {
    try {
      setDownloadingId(certificateId);
      const res = await getPresigned.mutateAsync({ certificateId });
      if (!res?.url) throw new Error("No URL returned from API");

      const response = await fetch(res.url);
      if (!response.ok) throw new Error("Failed to fetch from S3");

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
      console.error("❌ Download failed:", err);
      toast.error("Failed to download salary certificate");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee?.value) return toast.error("Please select an employee");
    if (!purpose.trim()) return toast.error("Please enter purpose");
    await generate.mutateAsync({
      employee_id: selectedEmployee.value,
      purpose: purpose.trim(),
    });
    toast.success("Salary certificate request created successfully");
    setGenerateDialog(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <UserCheck className="w-6 h-6 text-indigo-600" />
          <span>Salary Certificates</span>
        </h1>
        <p className="text-gray-500 text-sm">
          Generate, approve, and manage employee salary certificates.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="released">Released</option>
          </select>
        </div>

        {canGenerate && (
          <button
            onClick={() => setGenerateDialog(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Certificate</span>
          </button>
        )}
      </div>

      {/* 💻 Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable
          data={certificates}
          columns={columns}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          isFetching={isFetching && !approvingId}
        />
      </div>

      {/* 📱 Mobile Cards */}
      <div className="block lg:hidden space-y-4">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {cert.certificate_json?.employee_name ||
                    cert.employee?.full_name ||
                    "—"}
                </h3>
                <p className="text-sm text-gray-600">
                  {cert.employee?.email || "—"}
                </p>
              </div>
              <div>{getStatusBadge(cert.status)}</div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Purpose: {cert.certificate_json.purpose ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {new Date(cert.created_at).toLocaleDateString("en-GB")}
            </p>

            <div className="flex justify-end items-center gap-3">
              {cert.status === "requested" && (
                <button
                  title="Approve and Generate"
                  onClick={() => handleApprove(cert.id)}
                  disabled={approvingId === cert.id}
                  className={`p-2 rounded-lg text-green-600 transition ${
                    approvingId === cert.id
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-50"
                  }`}
                >
                  {approvingId === cert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {cert.status === "released" && (
                <>
                  <button
                    onClick={() => {
                      setPreviewCertificate(cert);
                      setPreviewOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadFromS3(cert.id)}
                    disabled={downloadingId === cert.id}
                    className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 ${
                      downloadingId === cert.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {downloadingId === cert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() => setDeleteTarget(cert)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 px-2 text-sm text-gray-600">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 ${
                page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-gray-700 ${
                page >= totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ✅ Shared Preview Modal */}
      {previewOpen && previewCertificate && (
        <SalaryCertificatePreviewModal
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewCertificate(null);
          }}
          certificate={previewCertificate}
        />
      )}

      {/* Generate Dialog */}
      <FormDialog
        open={generateDialog}
        title="Generate Salary Certificate"
        onClose={() => setGenerateDialog(false)}
        primaryAction={{
          label: generate.isPending ? "Generating..." : "Generate",
          loading: generate.isPending,
          onClick: handleGenerate,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setGenerateDialog(false),
        }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee <span className="text-red-600">*</span>
            </label>
          <Select
          options={employeeOptions}
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          onInputChange={setEmployeeSearchText}
          placeholder="Search by name or email..."
          isClearable
          isSearchable
          isLoading={empLoading}
          className="text-sm"
          menuPortalTarget={document.body}  // ✅ renders dropdown outside modal
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }), // ✅ ensure above modal
          }}
        />

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Purpose <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Bank Account Opening"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Salary Certificate"
        description={`Are you sure you want to delete this salary certificate for "${deleteTarget?.certificate_json.employee_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteCert.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCert.mutateAsync({ certificate_id: deleteTarget.id });
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
