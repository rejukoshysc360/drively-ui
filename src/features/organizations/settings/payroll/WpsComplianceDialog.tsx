import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

export default function WpsComplianceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <FormDialog open={open} title="WPS Compliance Details" onClose={onClose}>
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        <li>Every employee must have IBAN or prepaid WPS card.</li>
        <li>Salaries must be processed within 10 days of due date.</li>
        <li>Employer must maintain valid MOHRE ID and bank code.</li>
      </ul>
    </FormDialog>
  );
}
