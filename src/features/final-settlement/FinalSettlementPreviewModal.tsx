import React, { useEffect, useState } from "react";
import { X, Download, Pencil, Save } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  useUpdateFinalSettlementValues,
  useDownloadFinalSettlementPDF, // ✅ NEW
} from "./hooks";

import FinalSettlementPreview from "./FinalSettlementPreview";
import { useCan } from "../../utils/permissions";

type FinalSettlement = {
  id: string;
  employee?: { full_name: string; email?: string; hire_date?: string };
  gratuity_amount: number;
  leave_encashment: number;
  notice_pay: number;
  other_allowances: number;
  deductions: number;
  total_payable: number;
  status: string;
  created_at: string;
  last_working_date?: string;
  reason?: string;
  notes?: string; 
};

export default function FinalSettlementPreviewModal({
  open,
  onClose,
  settlement,
}: {
  open: boolean;
  onClose: () => void;
  settlement: FinalSettlement;
}) {
  const updateValues = useUpdateFinalSettlementValues();
  const downloadSettlement = useDownloadFinalSettlementPDF(); // ✅ NEW

  const can = useCan();
  const canUpdate = can("final-settlement:update");

  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(settlement);

  useEffect(() => {
    if (open) {
      setEdited(settlement);
      setIsEditing(false);
    }
  }, [open, settlement]);

  if (!open) return null;

  const handleField = (key: keyof FinalSettlement, value: any) => {
    const next = { ...edited, [key]: value };
    next.total_payable =
      (next.gratuity_amount || 0) +
      (next.leave_encashment || 0) +
      (next.notice_pay || 0) +
      (next.other_allowances || 0) -
      (next.deductions || 0);
    setEdited(next);
  };

  const handleSave = async () => {
    try {
      await updateValues.mutateAsync({
        id: edited.id,
        updates: {
          gratuity_amount: edited.gratuity_amount,
          leave_encashment: edited.leave_encashment,
          notice_pay: edited.notice_pay,
          other_allowances: edited.other_allowances,
          deductions: edited.deductions,
          notes: edited.notes
        },
      });
      toast.success("Final settlement updated");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settlement");
    }
  };

  // ✅ NEW S3 DOWNLOAD LOGIC (same as payslip)
  const handleDownloadPDF = async () => {
    try {
      const res = await downloadSettlement.mutateAsync({
        settlementId: edited.id,
      });

      if (!res?.url) {
        toast.error("PDF not available");
        return;
      }

      const response = await fetch(res.url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `final-settlement-${edited.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF");
    }
  };

  const isDraft = edited.status?.toLowerCase() === "draft";

  const flattened = {
    ...edited,
    hire_date: edited.employee?.hire_date || null,
    notes: edited.notes || null
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="
          relative bg-white
          w-full h-full
          md:h-auto md:max-h-[92vh]
          md:w-full md:max-w-5xl
          md:rounded-xl md:shadow-xl
          flex flex-col overflow-hidden
        "
      >
        {/* ---------- Header ---------- */}
        <div className="relative border-b bg-gradient-to-r from-indigo-50 to-white px-4 md:px-6 py-3">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-between items-center pr-10">
            <h2 className="text-lg font-semibold">
              Final Settlement — {edited.employee?.full_name || "Employee"}
            </h2>

            <div className="flex items-center gap-3">

              {canUpdate && isDraft && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-indigo-600"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}

              {canUpdate && isEditing && (
                <button
                  onClick={handleSave}
                  disabled={updateValues.isPending}
                  className="flex items-center gap-1 text-green-600"
                >
                  <Save className="w-4 h-4" />
                  {updateValues.isPending ? "Saving…" : "Save"}
                </button>
              )}

              {/* ✅ NEW DOWNLOAD BUTTON */}
              <button
                onClick={handleDownloadPDF}
                disabled={downloadSettlement.isPending}
                className="flex items-center gap-1 text-indigo-600"
              >
                <Download className="w-4 h-4" />
                {downloadSettlement.isPending ? "Downloading…" : "PDF"}
              </button>

            </div>
          </div>
        </div>

        {/* ---------- Body ---------- */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50">
          <div className="mx-auto w-full md:w-[794px]">
            <FinalSettlementPreview
              data={flattened}
              isEditing={isEditing}
              onChange={handleField}
            />
          </div>
        </div>
      </div>
    </div>
  );
}