import { useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Upload,
  Info,
  X,
  Download,
  Printer,
  Mail,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import FormDialog from "../../../components/ui/FormDialog";
import {
  useDocumentsDb,
  useUploadOnboardingDocument,
  useDeleteEmployeeDocument,
  useDownloadEmployeeDocument,
  useSendOnboardingEmail,
} from "./hooks";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useCan } from "../../../utils/permissions";
import { APP_CONFIG } from "../../../config/appConfig";
import { validateFiles } from "../../../../src/utils/validateFiles";

export default function OnboardingDocumentsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [customDocName, setCustomDocName] = useState("");
  const [progress, setProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB } = APP_CONFIG.UPLOAD_RULES;
  const limit = APP_CONFIG.PAGE_SIZE;
  const [page, setPage] = useState(1);

  // 🟩 Permission checks (onboarding-specific)
  const can = useCan();
  const canView = can("employees:documents:onboarding:view");
  const canUpload = can("employees:documents:onboarding:create");
  const canDelete = can("employees:documents:onboarding:delete");
  const canPreview = can("employees:documents:onboarding:view");
  const canDownload = can("employees:documents:onboarding:download");

  // 🟩 Always pass "onboarding" explicitly
  const { data: documentsData, isLoading } = useDocumentsDb(
    employeeId!,
    "onboarding",
    page,
    limit,
  );

  const uploadMutation = useUploadOnboardingDocument(employeeId!);
  const deleteMutation = useDeleteEmployeeDocument(employeeId!, "onboarding");
  const downloadMutation = useDownloadEmployeeDocument(
    employeeId!,
    "onboarding",
  );
  const previewMutation = useDownloadEmployeeDocument(
    employeeId!,
    "onboarding",
  );
  const sendOnboardingEmailMutation = useSendOnboardingEmail();

  // 🟥 If no permission to view, block entire tab
  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          You do not have permission to view this employee’s onboarding
          documents
        </h2>
      </div>
    );
  }

const documents = documentsData?.documents ?? [];
const totalCount = documentsData?.paginationMetaInfo?.totalCount ?? 0;
const totalPages = documentsData?.paginationMetaInfo?.totalPages ?? 1;

const onboardingDocs = documents;

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
      onError: () => toast.error("Failed to preview"),
    });
  };

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
      toast.error("You do not have permission to upload onboarding documents");
      e.target.value = "";
      return;
    }

    const file = validFiles[0];
    uploadMutation.mutate(
      { file, name: customDocName.trim(), onProgress: setProgress } as any,
      {
        onSuccess: () => toast.success(`Uploaded ${customDocName}`),
        onError: () => toast.error(`Failed to upload ${customDocName}`),
        onSettled: () => {
          setProgress(0);
          setCustomDocName("");
          e.target.value = "";
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">
          Onboarding Documents
        </h2>
      </div>

      {/* Upload Onboarding Document */}
      {canUpload && (
        <div className="card p-4 bg-white shadow rounded space-y-3">
          <h3 className="font-medium text-base">Upload Onboarding Document</h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter document name (e.g., Offer Letter, Joining Form)"
              className="input w-full"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
            />

            <div>
              <input
                id="upload-onboarding-doc"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={!customDocName.trim() || uploadMutation.isLoading}
              />
              <label
                htmlFor="upload-onboarding-doc"
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
              Supported:{" "}
              {SUPPORTED_FILE_TYPES.map((t) =>
                t.replace(".", "").toUpperCase(),
              ).join(", ")}{" "}
              • Max {MAX_FILE_SIZE_MB} MB
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
        <h3 className="font-medium text-base">Uploaded Onboarding Documents</h3>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Loading documents…</p>
        ) : onboardingDocs.length > 0 ? (
          <div className="space-y-3">
            {onboardingDocs.map((doc: any) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500 break-all">
                    {doc.s3_key}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>
                      Size:{" "}
                      {doc.file_size ? (doc.file_size / 1024).toFixed(1) : "—"}{" "}
                      KB
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
            No onboarding documents uploaded yet.
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
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-gray-50 transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
)}  </div>
      

      {/* Send Email */}
      {/* Send Email Button - FIXED VERSION */}
      <div className="flex flex-col items-end gap-3">
        <button
          type="button"
          className={`
      px-6 py-3 rounded-lg shadow-lg transition-all duration-300 inline-flex items-center justify-center gap-3 min-w-[300px]
      font-medium text-base
      ${
        sendOnboardingEmailMutation.isSuccess
          ? "bg-green-600 text-white cursor-default shadow-green-200"
          : sendOnboardingEmailMutation.isError
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
      }
    `}
          disabled={
            !documents?.length ||
            sendOnboardingEmailMutation.isPending || // ← Use .isPending (new name for isLoading)
            sendOnboardingEmailMutation.isSuccess
          }
          onClick={() => {
            if (sendOnboardingEmailMutation.isSuccess) return;

            sendOnboardingEmailMutation.mutate(employeeId!, {
              onSuccess: () => {
                toast.success("Onboarding email sent successfully!");
              },
              onError: (error: any) => {
                toast.error(
                  error?.message || "Failed to send onboarding email",
                );
              },
            });
          }}
        >
          {/* LOADING STATE */}
          {sendOnboardingEmailMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending Email...</span>
            </>
          ) : /* SUCCESS STATE */
          sendOnboardingEmailMutation.isSuccess ? (
            <>
              <Check className="w-6 h-6" />
              <span>Email Sent Successfully</span>
            </>
          ) : /* ERROR STATE (optional - let user retry) */
          sendOnboardingEmailMutation.isError ? (
            <>
              <Mail className="w-5 h-5" />
              <span>Retry Sending Email</span>
            </>
          ) : (
            /* DEFAULT STATE */
            <>
              <Mail className="w-5 h-5" />
              <span>Send Onboarding Email with Documents</span>
            </>
          )}
        </button>

        {/* Optional subtle hint below */}
        {sendOnboardingEmailMutation.isError && (
          <p className="text-sm text-red-600 text-right animate-pulse">
            Failed to send. Click button to retry.
          </p>
        )}
      </div>

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
