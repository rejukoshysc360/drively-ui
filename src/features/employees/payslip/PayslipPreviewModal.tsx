import React, { useEffect, useState } from "react";
import { X, Download, PlusCircle, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { PayslipData } from "./api";
import PayslipPreview from "./PayslipPreview";
import {
  usePayslip,
  useGeneratePayslip,
  useDownloadPayslipPDF,
} from "./hooks";
import { getPreviousMonth, getCurrentMonth } from "../../../utils/DateUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employment?: {
    end_date: string | null;
    probation_status: string | null;
    notice_given_date: string | null;
  } | null;
  month?: string;
  previewData?: PayslipData | null;
  auditId?: string;
};

export default function PayslipPreviewModal({
  open,
  onClose,
  employeeId,
  employment,
  previewData,
  auditId,
}: Props) {
  
  const [month, setMonth] = useState(getCurrentMonth());
  const enabled = open && !!employeeId && !!month;

useEffect(() => {
  if (!employment) return;
  const end = employment.end_date;
  setMonth(end ? end.slice(0, 7) : getCurrentMonth());
}, [employment]);

  const {
    data: fetchedPreview,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePayslip(employeeId, month, enabled && !previewData);

  const preview = previewData ?? fetchedPreview;
  const generatePayslip = useGeneratePayslip(async () => refetch());
  const downloadPayslip = useDownloadPayslipPDF();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<PayslipData | null>(null);

  useEffect(() => {
    if (enabled && !previewData) refetch();
  }, [enabled, month, previewData, refetch]);

  useEffect(() => {
    if (preview && typeof preview === "object") {
      setEditedData(preview as PayslipData);
    }
  }, [preview]);

  const isPayslipData = (p: any): p is PayslipData =>
    p && typeof p === "object" && "employee" in p && "employer" in p;

  const handleGeneratePayslip = async () => {
    if (!employeeId || !month) return;
    try {
      setIsGenerating(true);
      generatePayslip.mutate({
        employeeId,
        month,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate payslip");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!employeeId || !month) return;
    try {
      const res = await downloadPayslip.mutateAsync({
        employeeId,
        month,
        auditId,
      });

      if (!res?.url) {
        toast.error("Payslip not available for download");
        return;
      }

      const response = await fetch(res.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = auditId
        ? `payslip-audit-${auditId}.pdf`
        : `payslip-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error("Failed to download payslip");
    }
  };

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/40 overflow-y-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="relative bg-white w-full md:max-w-4xl md:rounded-xl shadow-xl flex flex-col my-6 mx-2 md:my-10 max-h-none min-h-[90vh]">
        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-10 border-b bg-gradient-to-r from-indigo-50 to-white px-4 md:px-6 py-3 flex flex-col md:flex-row md:justify-between gap-3">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Payslip
          </h2>

          <div className="flex items-center gap-3">
            {!previewData && (
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                max={
                  employment?.end_date
                    ? employment.end_date.slice(0, 7)
                    : getCurrentMonth()
                }
                className="input h-9 border-gray-300 rounded-md text-sm px-2"
              />
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={
                isLoading ||
                isFetching ||
                !isPayslipData(preview) ||
                downloadPayslip.isLoading
              }
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {isLoading && <div className="text-sm">Loading payslip…</div>}

          {!error && isPayslipData(preview) && (
            <div className="mx-auto w-full sm:w-[95%] md:w-[794px] px-1 sm:px-2 overflow-x-hidden">
              <PayslipPreview
                preview={editedData ?? preview}
                isEditing={isEditing}
                onEdit={setEditedData}
              />
            </div>
          )}

          {!isLoading && !isPayslipData(preview) && !previewData && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No payslip found for {month}
              </p> 
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
