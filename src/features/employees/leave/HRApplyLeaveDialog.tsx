// components/leave/HRApplyLeaveDialog.tsx

import { useRoles } from "../../../utils/useRoles";
import FormDialog from "../../../components/ui/FormDialog";
import LeaveApplicationForm from "../../employees/leave/LeaveApplicationForm";

type Props = {
  open: boolean;
  employeeId: string;
  onClose: () => void;
};

export default function HRApplyLeaveDialog({
  open,
  employeeId,
  onClose,
}: Props) {
  const { isManager, isHR } = useRoles();

  return (
<FormDialog
  open={open}
  title="Apply Leave on Behalf of Employee"
  onClose={onClose}
  maxWidth="max-w-4xl"
  fullScreenOnMobile
>
      <LeaveApplicationForm
        employeeId={employeeId}
        autoApprove={false}
        crossOrg={isManager || isHR}
        onSuccess={onClose}
      />
    </FormDialog>
  );
}