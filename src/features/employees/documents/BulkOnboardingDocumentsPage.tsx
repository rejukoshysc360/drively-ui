import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Upload,
  X,
  Download,
  Info,
  Mail,
  Loader2,
  Check,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useCan } from "../../../utils/permissions";
import { APP_CONFIG } from "../../../config/appConfig";
import { validateFiles } from "../../../utils/validateFiles";
import FormDialog from "../../../components/ui/FormDialog";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import {
  useGenericDocuments,
  useUploadGenericDocument,
  useDeleteGenericDocument,
  useDownloadGenericDocument,
  useSendBulkOnboardingDocuments,
} from "./hooks";
import { useEmployees } from "../hooks";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const printPresignedUrl = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.src = blobUrl;
    document.body.appendChild(frame);
    frame.onload = () => {
      frame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(frame);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    };
  } catch (err) {
    console.error("Print error:", err);
    toast.error("Failed to print document");
  }
};

export default function BulkOnboardingDocumentsPage() {
  const can = useCan();
  const canView = can("employees:documents:onboarding:view");
  const canUpload = can("employees:documents:onboarding:create");
  const canDelete = can("employees:documents:onboarding:delete");
  const canPreview = can("employees:documents:onboarding:view");
  const canDownload = can("employees:documents:onboarding:download");
  const canSendEmail = can("employees:documents:onboarding:send-email");

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-10 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You do not have permission to view onboarding documents.
          </p>
        </div>
      </div>
    );
  } 
  
  const limit = APP_CONFIG.PAGE_SIZE || 20;
  const [page, setPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 350);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedOrgDocIds, setSelectedOrgDocIds] = useState<string[]>([]);
  const [customDocName, setCustomDocName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB } = APP_CONFIG.UPLOAD_RULES;

  const { data: employeesData, isLoading, isFetching, error } = useEmployees(
    page,
    limit,
    debouncedSearch || undefined
  );

const {
  data: orgDocsData,
  isLoading: orgLoading,
  isError: orgError,
} = useGenericDocuments(
  "onboarding",
  docPage,
  limit
);

const orgDocs = orgDocsData?.documents || [];

const orgDocTotal =
  orgDocsData?.paginationMetaInfo?.totalCount || 0;

const orgDocTotalPages =
  orgDocsData?.paginationMetaInfo?.totalPages || 1;

  const uploadMutation = useUploadGenericDocument("onboarding");
  const deleteMutation = useDeleteGenericDocument("onboarding");
  const downloadMutation = useDownloadGenericDocument("onboarding");
  const sendBulkMutation = useSendBulkOnboardingDocuments();

  useEffect(() => setPage(1), [debouncedSearch]);

  // ✅ Scroll to employee section when changing page
  const employeeListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (employeeListRef.current) {
      employeeListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-600">
        Failed to load employees
      </div>
    );
  }

  const employees = employeesData?.employees || [];
  const total = employeesData?.paginationMetaInfo?.totalCount || 0;
  const totalPages = employeesData?.paginationMetaInfo?.totalPages || 1;

  const handleUploadOrgDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length === 0 || !customDocName.trim()) {
      e.target.value = "";
      return;
    }

    const file = validFiles[0];
    uploadMutation.mutate(
      {
        file,
        name: customDocName.trim(),
        onProgress: (p) => setUploadProgress(p),
      },
      {
        onSuccess: () => {
          toast.success(`"${customDocName}" uploaded successfully`);
          setCustomDocName("");
          e.target.value = "";
          setUploadProgress(0);
        },
        onError: () => toast.error("Failed to upload document"),
      }
    );
  };

  const handlePreview = (doc: any) => {
    if (!canPreview) return toast.error("No permission");
    downloadMutation.mutate(doc.id, {
      onSuccess: ({ url }) => setPreviewDoc({ ...doc, presignedUrl: url }),
      onError: () => toast.error("Failed to preview document"),
    });
  };

  const handleDownload = (doc: any) => {
    if (!canDownload) return toast.error("No permission");
    downloadMutation.mutate(doc.id, {
      onSuccess: async ({ url }) => {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = doc.name || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      },
      onError: () => toast.error("Download failed"),
    });
  };

  const handleSendDocs = async () => {
    if (selectedEmployeeIds.length === 0 || selectedOrgDocIds.length === 0) {
      toast.error("Select at least one employee and one document");
      return;
    }

    if (!canSendEmail) {
      toast.error("No permission to send emails");
      return;
    }

    setSending(true);
    setSendSuccess(false);

    try {
      await sendBulkMutation.mutateAsync({
        employee_ids: selectedEmployeeIds,
        document_ids: selectedOrgDocIds,
      });
      setSendSuccess(true);
      toast.success("Documents sent successfully!");
      setTimeout(() => setSendSuccess(false), 8000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send documents");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
        On-Boarding Documents
      </h2>
        <p className="text-sm text-gray-500 mt-1">
    <strong>Note:</strong>All documents uploaded here are visible to all active employees. To send a document to a specific employee, go to Employee List → Manage.

  </p>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
          )}
        </div>
      </div>

      {/* Employee Selection */}
      <div ref={employeeListRef} className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="font-medium text-lg">
            Select Employees
            <span className="ml-2 text-sm text-gray-500">
              ({selectedEmployeeIds.length} selected / {total} total)
            </span>
          </h3>
        </div>

        {/* Mobile Cards */}
        <div className="block lg:hidden divide-y divide-gray-200">
          {isLoading || isFetching ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No employees found.</div>
          ) : (
            employees.map((emp: any) => (
              <div key={emp.id} className="p-4 hover:bg-gray-50">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onChange={(e) =>
                      setSelectedEmployeeIds((prev) =>
                        e.target.checked ? [...prev, emp.id] : prev.filter((id) => id !== emp.id)
                      )
                    }
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{emp.full_name || emp.name || "Unnamed"}</p>
                    <p className="text-sm text-gray-600">{emp.email || "—"}</p>
                  </div>
                </label>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-16 px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                  Select
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p>Loading employees...</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onChange={(e) =>
                          setSelectedEmployeeIds((prev) =>
                            e.target.checked ? [...prev, emp.id] : prev.filter((id) => id !== emp.id)
                          )
                        }
                        className="w-5 h-5 rounded border-gray-300 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {emp.full_name || emp.name || "Unnamed"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.email || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Section */}
      {canUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-medium text-lg">Upload Document</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter document name (e.g., Offer Letter)"
              className="input flex-1"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
            />
            <div>
              <input
                id="upload-doc"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleUploadOrgDoc}
                disabled={!customDocName.trim()}
              />
              <label
                htmlFor="upload-doc"
                className={`btn-primary inline-flex items-center gap-2 px-6 py-3 ${
                  !customDocName.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Upload className="w-5 h-5" /> Upload
              </label>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Supported: {SUPPORTED_FILE_TYPES.map((t: string) =>
              t.replace(".", "").toUpperCase()
            ).join(", ")} • Max {MAX_FILE_SIZE_MB} MB
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Organization Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="font-medium text-lg">
            Uploaded Documents
            <span className="ml-2 text-sm text-gray-500">
             ({selectedOrgDocIds.length} selected / {orgDocTotal} total)
            </span>
          </h3>
        </div>

        {/* Mobile */}
        <div className="block lg:hidden divide-y divide-gray-200">
          {orgLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Loading documents...</p>
            </div>
          ) : orgError ? (
            <div className="p-12 text-center text-red-600">Failed to load documents</div>
          ) : orgDocs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No documents uploaded yet.</div>
          ) : (
            orgDocs.map((doc: any) => (
              <div
                key={doc.id}
                className={`p-4 ${
                  selectedOrgDocIds.includes(doc.id) ? "bg-indigo-50" : "hover:bg-gray-50"
                }`}
              >
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrgDocIds.includes(doc.id)}
                    onChange={(e) =>
                      setSelectedOrgDocIds((prev) =>
                        e.target.checked
                          ? [...prev, doc.id]
                          : prev.filter((id) => id !== doc.id)
                      )
                    }
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {doc.file_size ? (doc.file_size / 1024).toFixed(1) : "—"} KB
                    </p>
                  </div>
                </label>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {canPreview && (
                    <button
                      onClick={() => handlePreview(doc)}
                      className="py-2 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex items-center justify-center gap-1"
                    >
                      <Info className="w-4 h-4" /> Preview
                    </button>
                  )}
                  {canDownload && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop */}
        <div className="hidden lg:block divide-y divide-gray-200">
          {orgLoading ? (
            <div className="p-12 text-center text-gray-500">Loading documents...</div>
          ) : orgError ? (
            <div className="p-12 text-center text-red-600">Failed to load documents</div>
          ) : orgDocs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No documents uploaded yet.</div>
          ) : (
            orgDocs.map((doc: any) => (
              <div
                key={doc.id}
                className={`px-6 py-4 flex items-center justify-between ${
                  selectedOrgDocIds.includes(doc.id)
                    ? "bg-indigo-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <label className="flex items-center gap-4 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={selectedOrgDocIds.includes(doc.id)}
                    onChange={(e) =>
                      setSelectedOrgDocIds((prev) =>
                        e.target.checked
                          ? [...prev, doc.id]
                          : prev.filter((id) => id !== doc.id)
                      )
                    }
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {doc.file_size ? (doc.file_size / 1024).toFixed(1) : "—"} KB
                    </p>
                  </div>
                </label>
                <div className="flex gap-3">
                  {canPreview && (
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-2 rounded hover:bg-indigo-100 text-indigo-600"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  )}
                  {canDownload && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded hover:bg-blue-100 text-blue-600"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="p-2 rounded hover:bg-red-100 text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {orgDocTotalPages > 1 && (
  <div className="p-4 border-t">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <span className="text-sm text-gray-600">
        Showing {(docPage - 1) * limit + 1}–
        {Math.min(docPage * limit, orgDocTotal)} of {orgDocTotal}
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => setDocPage((p) => Math.max(1, p - 1))}
          disabled={docPage === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={() =>
            setDocPage((p) => Math.min(orgDocTotalPages, p + 1))
          }
          disabled={docPage === orgDocTotalPages}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
)}

      {/* Send Button */}
      <div className="mt-8 flex justify-center lg:justify-end">
        <button
          onClick={handleSendDocs}
          disabled={
            sending ||
            selectedEmployeeIds.length === 0 ||
            selectedOrgDocIds.length === 0
          }
          className={`
            w-full sm:w-auto
            px-4 py-2 sm:px-6 sm:py-3
            rounded-md shadow-md transition-all
            inline-flex items-center justify-center gap-2
            text-sm sm:text-base font-medium
            ${
              sendSuccess
                ? "bg-green-600 text-white"
                : sending
                ? "bg-indigo-500 text-white"
                : selectedEmployeeIds.length === 0 ||
                  selectedOrgDocIds.length === 0
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }
          `}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              Sending...
            </>
          ) : sendSuccess ? (
            <>
              <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              Sent Successfully!
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              Send Email
            </>
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          title={`Preview — ${previewDoc.name}`}
          maxWidth="max-w-5xl"
          onClose={() => setPreviewDoc(null)}
        >
          <div className="h-[80vh] w-full">
            <iframe
              src={previewDoc.presignedUrl}
              className="w-full h-full rounded-lg border"
            />
          </div>
        </FormDialog>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            toast.success("Document deleted");
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
