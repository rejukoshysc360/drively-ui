import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

export default function WpsSifDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <FormDialog open={open} title="WPS File Export (SIF)" onClose={onClose}>
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        <li>Generates Salary Information File (SIF) for UAE WPS submissions.</li>
        <li>Includes MOHRE ID, bank code, and employee IBANs.</li>
        <li>All salaries must pass through WPS.</li>
      </ul>
    </FormDialog>
  );
}
