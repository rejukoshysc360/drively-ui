import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Upload,
  Info,
  X,
  Download,
  Printer,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import FormDialog from "../../../components/ui/FormDialog";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import {
  useEmployeeDocuments,
  useUploadComplianceDocument,
  useDeleteOnboardingDocument,
  useDownloadOnboardingDocument,
  useDeleteComplianceDocument,
} from "./hooks";
import { useAuth } from "../../../features/auth/AuthProvider";
import { APP_CONFIG } from "../../../config/appConfig";
import { validateFiles } from "../../../utils/validateFiles";

export default function EmployeeSelfDocuments() {
  const { user } = useAuth();
  const employeeId = user?.employee_id;

  const [customDocName, setCustomDocName] = useState("");
  const [progress, setProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: documents, isLoading } = useEmployeeDocuments();
  const { data: complianceDocs, isLoading: isLoadingCompliance } = useEmployeeDocuments("compliance");

  const uploadComplianceMutation = useUploadComplianceDocument(employeeId!);
  const deleteMutation = useDeleteOnboardingDocument(employeeId!);
  const downloadMutation = useDownloadOnboardingDocument(employeeId!);
  const previewMutation = useDownloadOnboardingDocument(employeeId!);

  const deleteComplianceMutation = useDeleteComplianceDocument(employeeId!);


  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");

  const { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB } = APP_CONFIG.UPLOAD_RULES;

  const handleComplianceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    if (!customDocName.trim()) {
      toast.error("Please enter a document name");
      e.target.value = "";
      return;
    }

    const file = validFiles[0];
    uploadComplianceMutation.mutate(
      { file, name: customDocName, onProgress: setProgress },
      {
        onSuccess: () => {
          setUploadSuccessMessage(
            `Your document "${customDocName}" has been uploaded successfully. Our HR team will review it shortly.`
          );
          setCustomDocName("");
          setProgress(0);
          e.target.value = "";
        },
        onError: (err: any) => toast.error(err?.message || "Upload failed"),
        onSettled: () => setProgress(0),
      }
    );
  };

  const handleDownload = (doc: any) => {
    downloadMutation.mutate(doc.id, {
      onSuccess: async ({ url }) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = doc.name || doc.file_name || "document";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          toast.error("Failed to download");
        }
      },
    });
  };

  const handlePreview = (doc: any) => {
    previewMutation.mutate(doc.id, {
      onSuccess: ({ url }) => setPreviewDoc({ ...doc, presignedUrl: url }),
      onError: () => toast.error("Failed to load preview"),
    });
  };

  const handlePrint = async (url: string) => {
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 500);
      };
    } catch {
      toast.error("Print failed");
    }
  };

  const onboardingDocs =
    documents?.filter(
      (d: any) => d.document_type === "onboarding" || d.document_type === "generic"
    ) || [];


  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header - Original desktop alignment, mobile centered */}
      <div className="mb-8 text-left lg:text-left">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-8 h-8 text-indigo-600" />
          My Documents
        </h1>
        <p className="text-slate-600 mt-1">
          Securely upload and manage your compliance and onboarding files
        </p>
      </div>

      {/* Compliance Upload - Original desktop layout, mobile full-width */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          Upload Compliance Document
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          Upload essential compliance documents such as{" "}
          <span className="font-medium text-gray-700">
            Passport, Visa, Emirates ID
          </span>{" "}
          etc.
        </p>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Name
            </label>
            <input
              type="text"
              placeholder="e.g., Passport, Visa, Emirates ID"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
              disabled={uploadComplianceMutation.isPending}
            />
          </div>

          <div>
            <input
              id="upload-compliance-doc"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleComplianceUpload}
              disabled={
                uploadComplianceMutation.isPending || !customDocName.trim()
              }
            />
            <label
              htmlFor="upload-compliance-doc"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition cursor-pointer ${
                uploadComplianceMutation.isPending || !customDocName.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              }`}
            >
              {uploadComplianceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choose File & Upload
                </>
              )}
            </label>
          </div>

          <div>
            <span className="text-[10px] text-gray-500">
              {SUPPORTED_FILE_TYPES.map((t) =>
                t.replace(".", "").toUpperCase()
              ).join(", ")}{" "}
              • Max {MAX_FILE_SIZE_MB} MB
            </span>
          </div>

          {progress > 0 && progress < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="font-medium text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {uploadSuccessMessage && (
            <div className="mt-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700">{uploadSuccessMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Document List - Original desktop layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Your Onboarding Documents
          </h3>
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading documents…</p>
          ) : onboardingDocs.length > 0 ? (
            <div className="space-y-4">
              {onboardingDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all group"
                >
                  <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                    <p className="font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <FileText className="w-3.5 h-3.5" />
                      {doc.file_name}
                    </p>
                  </div>
{/* Action buttons - responsive layout */}
<div
  className="
    flex flex-wrap sm:flex-nowrap
    gap-2 sm:gap-3
    w-full sm:w-auto
    justify-start sm:justify-end
  "
>
  <button
    onClick={() => handlePreview(doc)}
    className="
      flex items-center gap-1.5
      px-3 py-1.5
      rounded-lg text-sm font-medium
      bg-indigo-50 text-indigo-700
      hover:bg-indigo-100
      transition
      flex-1 sm:flex-none
      justify-center
    "
  >
    <Info className="w-4 h-4" />
    Preview
  </button>

  <button
    onClick={() => handleDownload(doc)}
    className="
      flex items-center gap-1.5
      px-3 py-1.5
      rounded-lg text-sm font-medium
      bg-blue-50 text-blue-700
      hover:bg-blue-100
      transition
      flex-1 sm:flex-none
      justify-center
    "
  >
    <Download className="w-4 h-4" />
    Download
  </button> 

</div>

                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No onboarding documents uploaded yet.
            </p>
          )}
        </div>
      </div>

      {/* 🟩 Compliance Documents Section */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-10">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800">
      My Compliance Documents
    </h3>
    <p className="text-sm text-gray-500">
      Documents such as Passport, Visa, Emirates ID, etc.
    </p>
  </div>

  <div className="p-6">
    {isLoadingCompliance ? (
      <p className="text-sm text-gray-500">Loading compliance documents…</p>
    ) : complianceDocs?.length > 0 ? (
      <div className="space-y-4">
        {complianceDocs.map((doc: any) => (
          <div
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="flex-1 min-w-0 mb-3 sm:mb-0">
              <p className="font-medium text-gray-900 truncate">{doc.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <FileText className="w-3.5 h-3.5" />
                {doc.file_name}
              </p>
            </div>
 
            {/* Action Buttons */}
<div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 justify-start sm:justify-end w-full sm:w-auto">
  <button
    onClick={() => handlePreview(doc)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex-1 sm:flex-none justify-center"
  >
    <Info className="w-4 h-4" />
    Preview
  </button>

  <button
    onClick={() => handleDownload(doc)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex-1 sm:flex-none justify-center"
  >
    <Download className="w-4 h-4" />
    Download
  </button>

  <button
    onClick={() => setDeleteTarget({ ...doc, type: "compliance" })}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition flex-1 sm:flex-none justify-center"
  >
    <X className="w-4 h-4" />
    Delete
  </button>
</div>

          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500 py-10">
        No compliance documents uploaded yet.
      </p>
    )}
  </div>
</div>


      {/* Preview Modal - Original desktop layout */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          title={`Preview — ${previewDoc.name}`}
          onClose={() => setPreviewDoc(null)}
          maxWidth="max-w-4xl"
        >
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            {previewDoc.mime_type === "application/pdf" ||
            previewDoc.presignedUrl.toLowerCase().includes(".pdf") ? (
              <iframe
                src={previewDoc.presignedUrl}
                className="w-full h-[80vh] border-0"
                title="Document Preview"
              />
            ) : (
              <img
                src={previewDoc.presignedUrl}
                alt={previewDoc.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
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
  isLoading={
    deleteTarget?.type === "compliance"
      ? deleteComplianceMutation.isPending
      : deleteMutation.isPending
  }
  onConfirm={async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "compliance") {
        await deleteComplianceMutation.mutateAsync(deleteTarget.id);
        toast.success("Compliance document deleted");
      } else {
        await deleteMutation.mutateAsync(deleteTarget.id);
        toast.success("Onboarding document deleted");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete document");
    } finally {
      setDeleteTarget(null);
    }
  }}
  onClose={() => setDeleteTarget(null)}
/>

    </div>
  );
}