import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

export default function ContributionsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <FormDialog open={open} title="Contributions & Benefits" onClose={onClose}>
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        <li>Pension applies to UAE nationals only.</li>
        <li>Health insurance is mandatory for expatriates.</li>
      </ul>
    </FormDialog>
  );
}
