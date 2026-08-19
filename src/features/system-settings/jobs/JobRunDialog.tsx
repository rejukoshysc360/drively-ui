import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import FormDialog from "../../../components/ui/FormDialog";

export default function JobRunDialog({
  jobName,
  status,
  open,
  onClose,
}: {
  jobName: string;
  status: "running" | "success" | "error";
  open: boolean;
  onClose: () => void;
}) {
  return (
    <FormDialog
      open={open}
      title={`Running ${jobName.replace(/_/g, " ")}`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center justify-center py-8 space-y-5">
        {status === "running" && (
          <>
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-700 font-medium">
              Running {jobName.replace(/_/g, " ")} — please wait…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-600" />
            <p className="text-sm text-green-700 font-medium">
              {jobName.replace(/_/g, " ")} completed successfully!
            </p>
            <button onClick={onClose} className="btn-primary mt-3">
              Close
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-600" />
            <p className="text-sm text-red-700 font-medium">
              {jobName.replace(/_/g, " ")} failed — check logs for details.
            </p>
            <button onClick={onClose} className="btn mt-3">
              Close
            </button>
          </>
        )}
      </div>
    </FormDialog>
  );
}
