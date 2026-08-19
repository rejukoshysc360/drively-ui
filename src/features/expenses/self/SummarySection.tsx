import { Loader2 } from "lucide-react";

interface Props {
  runningTotal: string;
  draftCount: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  canCreate: boolean;
  hasExpenses: boolean;
  isUpdating?: boolean; // ✅ Existing prop
  isReadyToSubmit?: boolean; // ✅ New prop
}

export default function SummarySection({
  runningTotal,
  draftCount,
  onSubmit,
  isSubmitting,
  canCreate,
  hasExpenses,
  isUpdating = false,
  isReadyToSubmit = false,
}: Props) {
  if (!canCreate || !hasExpenses) return null;

  const numericTotal = parseFloat(runningTotal.replace(/[^\d.-]/g, ""));

  // ✅ Require: drafts > 0, total > 0, readyToSubmit, and not updating
  const canSubmit =
    draftCount > 0 &&
    numericTotal > 0 &&
    isReadyToSubmit &&
    !isUpdating;

  return (
    <div className="mt-8 pt-6 border-t bg-gray-50 -mx-4 md:-mx-8 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <p
            className={`text-xl font-semibold text-gray-800 ${
              isUpdating ? "opacity-60" : ""
            }`}
          >
            Total: {runningTotal}
          </p>
          {isUpdating && (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`w-full md:w-auto px-8 py-4 rounded-xl font-medium text-lg transition ${
            !canSubmit
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Submitting...
            </>
          ) : isUpdating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Updating...
            </>
          ) : (
            `Submit All (${draftCount} draft${draftCount !== 1 ? "s" : ""})`
          )}
        </button>
      </div>

      {!canSubmit && (
        <p className="text-sm text-gray-500 mt-2 text-center md:text-right">
          {isUpdating
            ? "Please wait — expenses are updating..."
            : draftCount === 0
            ? "You have no draft expenses to submit."
            : !isReadyToSubmit
            ? "All draft expenses must include an invoice number, description, and valid amount."
            : "Total amount must be greater than 0 to submit."}
        </p>
      )}
    </div>
  );
}
