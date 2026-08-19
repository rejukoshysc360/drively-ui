import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useDownloadInvoicePDF } from "./hooks";
import { toast } from "react-hot-toast";

export default function InvoicePreviewModal({
  open,
  onClose,
  invoice,
}: {
  open: boolean;
  onClose: () => void;
  invoice: any;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const download = useDownloadInvoicePDF();

  useEffect(() => {
    if (!open || !invoice?.id) return;

    let mounted = true;
    setLoading(true);

    download
      .mutateAsync({ invoiceId: invoice.id })
      .then((res) => {
        if (!mounted) return;
        setUrl(res.url);
      })
      .catch(() => {
        toast.error("Failed to load invoice");
        setUrl(null);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      setUrl(null);
    };
  }, [invoice?.id, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[90%] h-[90%] rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
          <h2>Invoice Preview</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : url ? (
            <iframe
              src={url}
              className="w-full h-full"
              title="Invoice PDF"
            />
          ) : (
            <p>Failed to load invoice</p>
          )}
        </div>
      </div>
    </div>
  );
}