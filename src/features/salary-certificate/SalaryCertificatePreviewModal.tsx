import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useGetSalaryCertificatePresignedURL } from "./hooks";
import { toast } from "react-hot-toast";

export default function SalaryCertificatePreviewModal({
  open,
  onClose,
  certificate,
}: {
  open: boolean;
  onClose: () => void;
  certificate: any;
}) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const getPresigned = useGetSalaryCertificatePresignedURL();

  useEffect(() => {
    if (!open || !certificate?.id) return;

    let mounted = true;
    setLoading(true);

    getPresigned
      .mutateAsync({ certificateId: certificate.id })
      .then((res) => {
        if (!mounted) return;
        if (!res?.url) throw new Error("No presigned URL");
        setPresignedUrl(res.url);
      })
      .catch((err) => {
        if (mounted) {
          console.error("❌ Failed to fetch presigned URL", err);
          toast.error("Failed to load PDF preview");
          setPresignedUrl(null);
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      setPresignedUrl(null);
    };
  }, [certificate?.id]);

  if (!open || !certificate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full h-full sm:w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 sm:h-[90vh] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <h2 className="text-base sm:text-lg font-semibold">
            Salary Certificate
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center overflow-auto">
          {loading ? (
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          ) : presignedUrl ? (
            <iframe
              key={certificate?.id}
              src={presignedUrl}
              title="Salary Certificate PDF"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <p className="text-gray-300 text-sm">Failed to load PDF.</p>
          )}
        </div>
      </div>
    </div>
  );
}
