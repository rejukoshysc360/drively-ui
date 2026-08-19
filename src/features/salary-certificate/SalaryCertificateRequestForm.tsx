import { useState, useEffect } from "react";
import { useRequestSalaryCertificate } from "./hooks";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "react-hot-toast";

export default function SalaryCertificateRequestForm() {
  const { user } = useAuth();
  const [purpose, setPurpose] = useState("");
  const mutation = useRequestSalaryCertificate();

  // ✅ Show success toast and reset form
  useEffect(() => {
    if (mutation.isSuccess) {
      toast.success("Salary certificate request submitted successfully");
    }
  }, [mutation.isSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ employee_id: user.id, purpose });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-lg mx-auto space-y-5"
    >
      <h2 className="text-lg font-semibold text-slate-800">
        Request Salary Certificate
      </h2>
      <p className="text-sm text-gray-500">
        This will create a request record. HR will generate the document once approved.
      </p>

      {/* Purpose dropdown */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Purpose <span className="text-red-600">*</span>
        </label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">Select purpose</option>
          <option value="General">General</option>
          <option value="Opening Bank Account">Opening Bank Account</option>
          <option value="Visa Application">Visa Application</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {mutation.isPending ? "Submitting..." : "Submit Request"}
      </button>

      {/* ✅ Optional inline confirmation message */}
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
