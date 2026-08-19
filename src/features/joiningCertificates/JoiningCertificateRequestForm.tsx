import { useState, useEffect } from "react";
import { useRequestJoiningCertificate } from "./hooks";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "react-hot-toast";

export default function JoiningCertificateRequestForm() {
  const { user } = useAuth();
  const [note, setNote] = useState("For official use");
  const mutation = useRequestJoiningCertificate();

  // ✅ Show success toast and reset form
  useEffect(() => {
    if (mutation.isSuccess) {
      toast.success("Joining certificate request submitted successfully");
      setNote("For official use");
    }
  }, [mutation.isSuccess]);

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  mutation.mutate({ employee_id: user.id, note });
};

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-lg mx-auto space-y-5"
    >
      <h2 className="text-lg font-semibold text-slate-800">
        Request Joining Certificate
      </h2>
      <p className="text-sm text-gray-500">
        This will create a joining certificate request. HR will generate and release the document once approved.
      </p>

      {/* Optional note field */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Note (Optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="E.g., for personal records"
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {mutation.isPending ? "Submitting..." : "Submit Request"}
      </button>

      {/* ✅ Inline messages */}
      {mutation.isSuccess && (
        <p className="text-green-600 text-sm font-medium text-center">
          Request submitted successfully! HR will review it soon.
        </p>
      )}

      {mutation.isError && (
        <p className="text-red-600 text-sm font-medium text-center">
          ❌ Failed to submit request. Please try again.
        </p>
      )}
    </form>
  );
}
