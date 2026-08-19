// src/pages/employee/expenses/dialogs/AttachmentPreviewDialog.tsx
import { useState } from "react";
import { Download, Loader2 } from "lucide-react"; 
import FormDialog from "../../../components/ui/FormDialog";

interface Props {
  previewSrc: string | null;
  previewName: string;
  onClose: () => void;
}

export default function AttachmentPreviewDialog({ previewSrc, previewName, onClose }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!previewSrc) return;
    setIsDownloading(true);
    try {
      const response = await fetch(previewSrc);
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = previewName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!previewSrc) return null;

  return (
    <FormDialog open title={previewName || "Attachment Preview"} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-700 truncate max-w-md">{previewName}</p>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-70"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isDownloading ? "Downloading..." : "Download"}
        </button>
      </div>
      <div className="h-[70vh] border rounded-lg overflow-hidden bg-gray-50">
<iframe
  className="w-full h-full"
  src={previewSrc}
  title="Preview"
  allow="autoplay; fullscreen"
  referrerPolicy="no-referrer"
/>

      </div>
    </FormDialog>
  );
}