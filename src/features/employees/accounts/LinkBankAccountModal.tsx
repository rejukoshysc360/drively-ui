import React, { useState, useMemo } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useEmployeeAccounts,
  useCreateEmployeeAccount,
  useUpdateEmployeeAccount,
  useDeleteEmployeeAccount,
} from "./hooks";
import { useAuth } from "../../auth/AuthProvider";
import { useCan } from "../../../utils/permissions";

interface Props {
  employeeId: string;
  onClose: () => void;
}

// Regex
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const IBAN_REGEX = /^AE\d{21}$/i; // UAE IBAN format
const SWIFT_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2,5}$/i;

const normalizeIfsc = (input: string) => input.replace(/\s+/g, "").toUpperCase();
const normalizeIban = (input: string) => input.replace(/\s+/g, "").toUpperCase();

export default function LinkBankAccountModal({ employeeId, onClose }: Props) {
  const { organization_country_code } = useAuth();
  const can = useCan();

  const canViewBankAccount = can("employees:bank:accounts:view");
  const canCreateBankAccount = can("employees:bank:accounts:create");
  const canUpdateBankAccount = can("employees:bank:accounts:update");
  const canDeleteBankAccount = can("employees:bank:accounts:delete");

  console.log("canDeleteBankAccount",canDeleteBankAccount);

  const { data: accounts, isLoading } = useEmployeeAccounts(employeeId);
  const create = useCreateEmployeeAccount(employeeId);
  const remove = useDeleteEmployeeAccount(employeeId);
  const [editAccount, setEditAccount] = useState<any | null>(null);
  const update = useUpdateEmployeeAccount(employeeId, editAccount?.id || "");

  // Form states
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [confirmAccountNo, setConfirmAccountNo] = useState("");
  const [ifscCodeRaw, setIfscCodeRaw] = useState("");
  const [ibanRaw, setIbanRaw] = useState("");
  const [confirmIbanRaw, setConfirmIbanRaw] = useState("");
  const [swiftRaw, setSwiftRaw] = useState("");
  const [purpose, setPurpose] = useState<"salary" | "reimbursement" | "bonus">("salary");
  const [paymentMethod, setPaymentMethod] = useState<
    "Bank Transfer" | "Processed via WPS"
  >("Bank Transfer");
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const ifscCode = useMemo(() => normalizeIfsc(ifscCodeRaw), [ifscCodeRaw]);
  const ifscValid = IFSC_REGEX.test(ifscCode);

  const iban = useMemo(() => normalizeIban(ibanRaw), [ibanRaw]);
  const confirmIban = useMemo(() => normalizeIban(confirmIbanRaw), [confirmIbanRaw]);
  const ibanValid = IBAN_REGEX.test(iban);
  const swiftValid = !swiftRaw || SWIFT_REGEX.test(swiftRaw);

  const readOnlyMode = !canCreateBankAccount && !canUpdateBankAccount;

  // 🧩 Permission Block
  if (!canViewBankAccount) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
          <p className="text-gray-600">
            You do not have permission to view this employee’s bank accounts.
          </p>
          <button
            onClick={onClose}
            className="mt-4 btn-primary px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Reset form
  const resetForm = () => {
    setBankName("");
    setAccountNo("");
    setConfirmAccountNo("");
    setIfscCodeRaw("");
    setIbanRaw("");
    setConfirmIbanRaw("");
    setSwiftRaw("");
    setPurpose("salary");
    setPaymentMethod("Bank Transfer");
    setIsPrimary(false);
    setEditAccount(null);
    setFormError("");
  };

  // Populate form when editing
  const handleEdit = (acc: any) => {
    if (!canUpdateBankAccount) return;
    setEditAccount(acc);
    setBankName(acc.bank_name || "");
    setAccountNo(acc.account_no || "");
    setConfirmAccountNo(acc.account_no || "");
    setIfscCodeRaw(acc.ifsc_code || "");
    setIbanRaw(acc.iban || "");
    setConfirmIbanRaw(acc.iban || "");
    setSwiftRaw(acc.swift_code || "");
    setPurpose(acc.purpose || "salary");
    setPaymentMethod(acc.payment_method || "Bank Transfer");
    setIsPrimary(acc.is_primary || false);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnlyMode) {
      toast.error("You don’t have permission to modify bank accounts");
      return;
    }

    if (organization_country_code === "IN") {
      if (accountNo !== confirmAccountNo) {
        setFormError("Account numbers do not match.");
        return;
      }
      if (!ifscValid) {
        setFormError("Invalid IFSC code.");
        return;
      }
    } else if (organization_country_code === "AE") {
      if (iban !== confirmIban) {
        setFormError("IBANs do not match.");
        return;
      }
      if (!ibanValid) {
        setFormError("Invalid IBAN. Must start with AE followed by 21 digits.");
        return;
      }
      if (!swiftValid) {
        setFormError("Invalid Swift Code.");
        return;
      }
    }

    const payload: any = {
      employee_id: employeeId,
      bank_name: bankName.trim(),
      purpose,
      payment_method: paymentMethod,
      is_primary: isPrimary,
    };

    if (organization_country_code === "IN") {
      payload.account_no = accountNo.trim();
      payload.ifsc_code = ifscCode;
    } else if (organization_country_code === "AE") {
      payload.iban = iban.trim();
      payload.swift_code = swiftRaw.trim() || null;
    }

    try {
      if (editAccount) {
        if (!canUpdateBankAccount) return toast.error("No update permission");
        await update.mutateAsync(payload);
        toast.success("Account updated successfully");
      } else {
        if (!canCreateBankAccount) return toast.error("No create permission");
        await create.mutateAsync(payload);
        toast.success("Account linked successfully");
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {editAccount ? "Edit Employee Bank Account" : "Employee Bank Accounts"}
        </h2>

        {/* Existing accounts */}
        <div className="space-y-2 mb-4">
          {isLoading && <p>Loading accounts…</p>}
          {!isLoading && accounts?.length === 0 && <p>No accounts linked yet.</p>}
          {!isLoading &&
            accounts?.map((acc) => (
              <div
                key={acc.id}
                className="flex justify-between items-start border rounded p-2"
              >
                <div>
                  <p className="font-medium">{acc.bank_name}</p>
                  {organization_country_code === "AE" ? (
                    <>
                      <p className="text-sm text-gray-600">
                        {acc.iban ? `IBAN — ${acc.iban}` : "—"}
                      </p>
                      {acc.swift_code && (
                        <p className="text-sm text-gray-600">
                          SWIFT — {acc.swift_code}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {acc.account_no} — {acc.ifsc_code}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Payment Method: {acc.payment_method || "Bank Transfer"}
                  </p>
                  {acc.is_primary && (
                    <span className="text-xs text-green-600">Primary</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {canUpdateBankAccount && (
                    <button
                      type="button"
                      title="Edit Account"
                      onClick={() => handleEdit(acc)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ✏️
                    </button>
                  )}
                  {canDeleteBankAccount && (
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => remove.mutate(acc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <input
            type="text"
            placeholder="Bank Name"
            className={`input w-full ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
            readOnly={readOnlyMode}
          />

          {organization_country_code === "IN" ? (
            <>
              <input
                type="text"
                placeholder="Account Number"
                className={`input w-full ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                required
                readOnly={readOnlyMode}
              />
              <input
                type="text"
                placeholder="Confirm Account Number"
                className={`input w-full ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={confirmAccountNo}
                onChange={(e) => setConfirmAccountNo(e.target.value)}
                required
                readOnly={readOnlyMode}
              />
              <input
                type="text"
                placeholder="IFSC Code (e.g., HDFC0ABCD12)"
                className={`input w-full ${
                  ifscCode && !ifscValid ? "border-red-500" : ""
                } ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={ifscCodeRaw}
                onChange={(e) => setIfscCodeRaw(e.target.value)}
                required
                readOnly={readOnlyMode}
              />
              {ifscCode && !ifscValid && (
                <p className="text-xs text-red-600">
                  IFSC must be 11 chars (e.g., ICIC0XXXXXX)
                </p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="IBAN (e.g., AE070260001012345678901)"
                className={`input w-full ${
                  iban && !ibanValid ? "border-red-500" : ""
                } ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={ibanRaw}
                onChange={(e) => setIbanRaw(e.target.value)}
                required
                readOnly={readOnlyMode}
              />
              <input
                type="text"
                placeholder="Confirm IBAN"
                className={`input w-full ${
                  confirmIban && iban !== confirmIban ? "border-red-500" : ""
                } ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={confirmIbanRaw}
                onChange={(e) => setConfirmIbanRaw(e.target.value)}
                required
                readOnly={readOnlyMode}
              />
              <input
                type="text"
                placeholder="Swift Code (optional)"
                className={`input w-full ${
                  swiftRaw && !swiftValid ? "border-red-500" : ""
                } ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={swiftRaw}
                onChange={(e) => setSwiftRaw(e.target.value)}
                readOnly={readOnlyMode}
              />
            </>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value as "Bank Transfer" | "Processed via WPS"
                )
              }
              className={`input w-[65%] ${readOnlyMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={readOnlyMode}
            >
              <option value="Bank Transfer">Bank Transfer</option>
              {organization_country_code === "AE" && (
                <option value="Processed via WPS">Processed via WPS</option>
              )}
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              disabled={readOnlyMode}
            />
            Set as Primary Account
          </label>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={
              readOnlyMode ||
              create.isLoading ||
              update.isLoading ||
              (organization_country_code === "IN" && !ifscValid) ||
              (organization_country_code === "AE" && !ibanValid) ||
              (organization_country_code === "IN" && accountNo !== confirmAccountNo) ||
              (organization_country_code === "AE" && iban !== confirmIban)
            }
          >
            {create.isLoading || update.isLoading
              ? editAccount
                ? "Updating…"
                : "Linking…"
              : editAccount
              ? "Update Account"
              : "Link Account"}
          </button>

          {editAccount && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-1"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
