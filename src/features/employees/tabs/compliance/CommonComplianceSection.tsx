import { InputField } from "../../../../components/ui/InputField";

 
export function CommonComplianceSection({
  isEditing,
  registerTracked,
  designationLoading,
  deptId,
  designations,
  employee,
}: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Identity and employment details used globally
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          name="passport_no"
          label="Passport No."
          isEditing={isEditing}
          registerTracked={registerTracked}
        />
        <InputField
          name="passport_expiry"
          label="Passport Expiry"
          type="date"
          isEditing={isEditing}
          registerTracked={registerTracked}
        />
        <InputField
          name="labour_contract_no"
          label="Employment Contract No."
          isEditing={isEditing}
          registerTracked={registerTracked}
        /> 
      </div>
    </div>
  );
}
