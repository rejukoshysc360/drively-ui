import { InputField } from "../../../../components/ui/InputField";
import React from "react";

export function UAEComplianceSection({ isEditing, registerTracked, employee }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Required for WPS & MOHRE compliance
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visa Details */}
        <InputField name="visa_no" label="Visa No." isEditing={isEditing} registerTracked={registerTracked} />
        <InputField name="visa_expiry" label="Visa Expiry" type="date" isEditing={isEditing} registerTracked={registerTracked} />

        {/* Emirates ID Details */}
        <InputField name="emirates_id_no" label="Emirates ID No." isEditing={isEditing} registerTracked={registerTracked} />
        <InputField name="emirates_id_expiry" label="Emirates ID Expiry" type="date" isEditing={isEditing} registerTracked={registerTracked} />

        {/* Labour / Work Permit Details */}
        <InputField name="work_permit_no" label="Labour Card / Work Permit No." isEditing={isEditing} registerTracked={registerTracked} />
        <InputField name="labour_expiry" label="Labour Card Expiry" type="date" isEditing={isEditing} registerTracked={registerTracked} />

        {/* Health Care Insurance */}
        <InputField name="health_insurance_policy" label="Health Care Insurance Policy" isEditing={isEditing} registerTracked={registerTracked} />
        <InputField name="health_insurance_expiry" label="Policy Expiry Date" type="date" isEditing={isEditing} registerTracked={registerTracked} />

        {/* Establishment ID & MOHRE Verified – now side by side */}
        <InputField
          name="establishment_id"
          label="Establishment ID (MOHRE)"
          isEditing={isEditing}
          registerTracked={registerTracked}
        />

        <div>
          <label className="block text-xs font-medium text-gray-600">
            MOHRE Verified
          </label>
          {isEditing ? (
            <select
              className="input w-full"
              {...registerTracked("mohre_verified")}
              defaultValue={employee?.mohre_verified?.toString() || ""}
            >
              <option value="">Select status</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
              <option value="pending">Pending Verification</option>
            </select>
          ) : (
            <input
              type="text"
              className="input w-full bg-gray-100"
              value={
                employee?.mohre_verified?.toString() === "true"
                  ? "Verified"
                  : employee?.mohre_verified?.toString() === "false"
                  ? "Not Verified"
                  : employee?.mohre_verified?.toString() === "pending"
                  ? "Pending Verification"
                  : ""
              }
              disabled
            />
          )}
        </div>
      </div>
    </div>
  );
}