import { InputField } from "../../../../components/ui/InputField";
import React from "react";
 

export function IndiaComplianceSection({ isEditing, registerTracked }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Required for identity and taxation (Aadhaar & PAN)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField name="aadhaar" label="Aadhaar No." isEditing={isEditing} registerTracked={registerTracked} />
        <InputField name="pan" label="PAN No." className="uppercase" isEditing={isEditing} registerTracked={registerTracked} />
      </div>
    </div>
  );
}
