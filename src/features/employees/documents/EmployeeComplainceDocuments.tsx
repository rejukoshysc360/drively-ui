import { useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, Info, X, Download, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import FormDialog from "../../../components/ui/FormDialog";
import {
  useDocumentsDb,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
  useDownloadComplianceDocument,
} from "./hooks";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useCan } from "../../../utils/permissions";
import { APP_CONFIG } from "../../../config/appConfig";
import { validateFiles } from "../../../../src/utils/validateFiles";

export default function EmployeeDocumentsComplianceTab() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [customDocName, setCustomDocName] = useState("");
  const [progress, setProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const limit = APP_CONFIG.PAGE_SIZE;
  const [page, setPage] = useState(1);

  // ✅ Query only compliance documents
  const { data: documentsData, isLoading } = useDocumentsDb(
    employeeId!,
    "compliance",
    page,
    limit
  );

  const uploadMutation = useUploadComplianceDocument(employeeId!);
  const deleteMutation = useDeleteComplianceDocument(employeeId!);
  const downloadMutation = useDownloadComplianceDocument(employeeId!);
  const previewMutation = useDownloadComplianceDocument(employeeId!);

  const { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB } = APP_CONFIG.UPLOAD_RULES;



  // 🟩 Permission checks (compliance-specific)
  const can = useCan();
  const canView = can("employees:documents:compliance:view");
  const canUpload = can("employees:documents:compliance:create");
  const canDelete = can("employees:documents:compliance:delete");
  const canDownload = can("employees:documents:compliance:download");
  const canPreview = can("employees:documents:compliance:view");

  const documents = documentsData?.documents ?? [];
 const totalCount = documentsData?.paginationMetaInfo?.totalCount ?? 0;
 const totalPages = documentsData?.paginationMetaInfo?.totalPages ?? 1;

  // 🟥 Block entire tab if no view permission
  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s compliance documents.
        </h2>
      </div>
    );
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

  const handleDownload = (doc: any) => {
    if (!canDownload) {
      toast.error("You do not have permission to download documents");
      return;
    }

    downloadMutation.mutate(doc.id, {
      onSuccess: async ({ url }) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = doc.name || "document";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          toast.error("Failed to download file");
        }
      },
      onError: () => toast.error("Failed to generate download URL"),
    });
  };

  const handlePreview = (doc: any) => {
    if (!canPreview) {
      toast.error("You do not have permission to preview documents");
      return;
    }

    previewMutation.mutate(doc.id, {
      onSuccess: ({ url }) => setPreviewDoc({ ...doc, presignedUrl: url }),
      onError: () => toast.error("Failed to preview document"),
    });
  };

  // ✅ FIXED: removed "document_type" field — compliance type already set in hook
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const validFiles = validateFiles(e.target.files);
  if (validFiles.length === 0) {
    e.target.value = "";
    return;
  }

  if (!customDocName.trim()) {
    toast.error("Enter a document name first");
    e.target.value = "";
    return;
  }

  if (!canUpload) {
    toast.error("You do not have permission to upload compliance documents");
    e.target.value = "";
    return;
  }

  const file = validFiles[0];
  uploadMutation.mutate(
    { file, name: customDocName.trim(), onProgress: setProgress },
    {
      onSuccess: () => toast.success(`Uploaded ${customDocName}`),
      onError: () => toast.error(`Failed to upload ${customDocName}`),
      onSettled: () => {
        setProgress(0);
        setCustomDocName("");
        e.target.value = "";
      },
    }
  );
};


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">Compliance Documents</h2>
      </div>

      {/* Upload Compliance Document */}
      {canUpload && (
        <div className="card p-4 bg-white shadow rounded space-y-3">
          <h3 className="font-medium text-base">Upload Compliance Document</h3>

<div className="flex flex-col sm:flex-row gap-2">
  <input
    type="text"
    placeholder="Enter document name (e.g., Passport, Emirates ID)"
    className="input w-full"
    value={customDocName}
    onChange={(e) => setCustomDocName(e.target.value)}
  />

  <div>
    <input
      id="upload-doc"
      type="file"
      accept={SUPPORTED_FILE_TYPES.join(",")}
      className="hidden"
      onChange={handleFileUpload}
      disabled={!customDocName.trim() || uploadMutation.isLoading}
    />
    <label
      htmlFor="upload-doc"
      className={`btn-primary inline-flex items-center justify-center gap-2 ${
        !customDocName.trim() ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <Upload className="w-4 h-4" /> Upload
    </label>
  </div>
</div>

<div className="mt-1">
  <span className="text-[11px] text-gray-500">
    Supported: {SUPPORTED_FILE_TYPES.map((t) => t.replace(".", "").toUpperCase()).join(", ")} • Max {MAX_FILE_SIZE_MB} MB
  </span>
</div>


          {progress > 0 && (
            <div className="w-full bg-gray-200 h-2 mt-3 rounded overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )} 
        </div>
      )}

      {/* Uploaded Documents */}
      <div className="card p-4 bg-white shadow rounded space-y-4">
        <h3 className="font-medium text-base">Uploaded Compliance Documents</h3>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Loading documents…</p>
        ) : documents?.length ? (
          <div className="space-y-3">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500 break-all">{doc.s3_key}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>
                      Size:{" "}
                      {doc.file_size ? (doc.file_size / 1024).toFixed(1) : "—"} KB
                    </span>
                    <span>
                      Last Modified:{" "}
                      {doc.last_modified
                        ? new Date(doc.last_modified).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {canPreview && (
                    <button
                      onClick={() => handlePreview(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    >
                      <Info className="w-4 h-4" />
                      Preview
                    </button>
                  )}

                  {canDownload && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No compliance documents uploaded yet.
          </p>
        )}
      
             {totalPages > 1 && (
  <div className="mt-4 border-t pt-4">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <span className="text-sm text-gray-600">
        Showing {(page - 1) * limit + 1}–
        {Math.min(page * limit, totalCount)} of {totalCount}
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-gray-50"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
)}</div>

      {/* Preview Modal */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          title={`Preview — ${previewDoc.name}`}
          maxWidth="max-w-2xl"
          onClose={() => setPreviewDoc(null)}
        >
          <div className="h-[80vh] w-full">
            <iframe
              src={previewDoc.presignedUrl}
              className="w-full h-full rounded"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => printPresignedUrl(previewDoc.presignedUrl)}
              className="btn-primary flex items-center gap-1"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </FormDialog>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isLoading}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
