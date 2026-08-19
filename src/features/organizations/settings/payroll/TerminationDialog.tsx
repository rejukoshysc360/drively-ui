import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

export default function TerminationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <FormDialog
      open={open}
      title="Termination & Final Settlement"
      onClose={onClose}
    >
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        <li>Accrued wages, unused leave, gratuity to be settled.</li>
        <li>Notice period 30 days after probation.</li>
        <li>Settlement must be paid within 14 days.</li>
      </ul>
    </FormDialog>
  );
}
