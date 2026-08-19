import React from "react";
import FormDialog from "../../../../components/ui/FormDialog";

export const EosDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <FormDialog open={open} title="End of Service Gratuity (EOS) Details" onClose={onClose}>
    <p className="text-sm text-gray-700 mb-2">
      As per UAE Labour Law No. 33 of 2021, gratuity is calculated only on the employee’s
      <strong> Basic Salary</strong>.
    </p>
    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
      <li>Service &lt; 5 years → 21 days of basic salary per year.</li>
      <li>Service &gt; 5 years → 30 days of basic salary per year.</li>
      <li>Maximum gratuity = 2 years of wages (cap configurable).</li>
      <li>Eligibility starts after 1 year of service.</li>
      <li>Resignation &lt; 1 year → no gratuity entitlement.</li>
    </ul>
  </FormDialog>
);
