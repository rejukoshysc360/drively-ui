// src/admin/PasswordForceResetEmail.tsx
import { useState } from "react";
import Select from "react-select"; // ← Regular Select, not AsyncSelect
import { toast } from "react-hot-toast";
import { Loader2, Mail, Key, Search, AlertCircle } from "lucide-react";
import { useEmployees, useSendPasswordReset } from "./hooks";

export default function PasswordForceResetEmail() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchInput, setSearchInput] = useState("");

  // Live search: only trigger when 3+ characters
  const searchTerm = searchInput.length >= 3 ? searchInput.trim() : "";

  const { data: searchData, isLoading: isSearching } = useEmployees(1, 100, searchTerm);

  const options = (searchData?.employees || []).map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email})`,
    email: e.email,
  }));

  // Optional: initial list when field is empty/focused
  const { data: defaultData } = useEmployees(1, 100, "");
  const defaultOptions = (defaultData?.employees || []).map((e: any) => ({
    value: e.id,
    label: `${e.full_name} (${e.email})`,
    email: e.email,
  }));

  const sendReset = useSendPasswordReset();

  const handleSend = () => {
    if (!selectedEmployee) return;

    sendReset.mutate(selectedEmployee.value, {
      onSuccess: () => {
        toast.success(
          <div>
            <strong>Password reset email sent!</strong>
            <p className="text-xs mt-1">To: {selectedEmployee.email}</p>
          </div>
        );
        setSelectedEmployee(null);
        setSearchInput("");
      },
      onError: () => {
        toast.error("Failed to send reset email");
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
          <Key className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
          Force Password Reset
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-md mx-auto">
          Send a password reset link to any employee
        </p>
      </div>

      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
          <div className="space-y-8">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Search className="w-5 h-5" />
                Select Employee
              </label>

              <Select
                options={searchTerm ? options : defaultOptions} // Show search results or default list
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                onInputChange={setSearchInput} // This captures typing perfectly
                placeholder="Type to search employee (min 3 chars)..."
                isClearable
                isLoading={isSearching}
                isSearchable
                noOptionsMessage={() =>
                  searchInput.length < 3
                    ? "Type at least 3 characters to search"
                    : "No employees found"
                }
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "48px",
                    borderRadius: "0.75rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#9ca3af" },
                  }),
                  menu: (base) => ({ ...base, zIndex: 50 }),
                }}
                components={{
                  LoadingIndicator: () => (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
                  ),
                }}
              />

              {selectedEmployee && (
                <p className="mt-3 text-sm text-gray-600">
                  Selected: <strong className="text-indigo-700">{selectedEmployee.email}</strong>
                </p>
              )}
            </div>

            {/* Rest of your UI unchanged */}
            <div className="flex flex-col sm:flex-row items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
              <AlertCircle className="w-6 h-6 flex-shrink-0 text-amber-600" />
              <div className="text-sm flex-1">
                <p className="font-semibold mb-1">This action will:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Create a secure reset link</li>
                  <li>Send it via email to the employee</li>
                  <li>Expire in 1 hour</li>
                </ul>
              </div>
            </div>

            <div>
              <button
                type="button"
                disabled={!selectedEmployee || sendReset.isPending}
                onClick={handleSend}
                className={`w-full sm:w-auto inline-flex justify-center items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white transition-all shadow-lg transform active:scale-95 ${
                  selectedEmployee && !sendReset.isPending
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {sendReset.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="w-6 h-6" />
                    Send Reset Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {!selectedEmployee && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Start typing at least 3 characters to search for an employee
            </p>
          </div>
        )}
      </div>
    </div>
  );
}