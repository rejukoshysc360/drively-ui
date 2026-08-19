import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Calendar, Upload, History } from "lucide-react";
import { useLeavePolicies } from "../../organizations/settings/leave-policy/hooks";
import { useHolidays } from "../../organizations/settings/hooks";
import {
  useEmployeeAvailableLeave,
  useEmployeeLeaveAccruals,
  useEmployeeLeaves,
  useCreateEmployeeLeave,
} from "./hooks";
import { employeeLeaveApi } from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { emitSuccess } from "../../../lib/success-bus";
import FormDialog from "../../../components/ui/FormDialog";
import AuditSummary from "./AuditSummary";
import DatePopover from "./DatePopover";
import type { EmployeeLeave } from "../../employees/leave/api";
import { useCan } from "../../../utils/permissions";
import { APP_CONFIG } from "../../../../src/config/appConfig";
import { validateFiles } from "../../../../src/utils/validateFiles"; 
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";

type Props = {
  employeeId?: string;
  autoApprove?: boolean;
  onSuccess?: () => void;
  crossOrg?: boolean;
};
export default function LeaveApplicationForm({
  employeeId,
  autoApprove = false,
  onSuccess,
  crossOrg = false,
}: Props) {

  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const currentYear = dayjs().year();
  const minAllowedDate = dayjs(`${currentYear}-01-01`).format("YYYY-MM-DD");
  const maxAllowedDate = dayjs(`${currentYear}-12-31`).format("YYYY-MM-DD");

  const { MAX_FILE_SIZE_MB, SUPPORTED_FILE_TYPES } = APP_CONFIG.UPLOAD_RULES;


  const can = useCan();

  // ✅ Permission check
  const canCreate = can("leaves:create") || can("leaves:create_own_record_only");

  const targetEmployeeId = employeeId || user?.id!;

    if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white border border-gray-200 rounded-lg shadow-sm text-center p-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-14 h-14 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3m0 4h.01M4.293 6.707a1 1 0 011.414 0L12 13l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Access Restricted
        </h2>
        <p className="text-gray-500 text-sm">
          You don’t have permission to apply for leave.
        </p>
      </div>
    );
  }

  const { data: policiesData, isLoading: isPoliciesLoading } = useLeavePolicies(1, 100, targetEmployeeId)
  const { data: holidaysData } = useHolidays(1, 200, currentYear);

  // 🧩 Normalize holiday data
  const extractHolidayDates = (src: any): string[] => {
    if (!src) return [];
    let arr: any[] | null = Array.isArray(src) ? src : null;
    if (!arr && Array.isArray(src?.holidays)) arr = src.holidays;
    if (!arr && Array.isArray(src?.items)) arr = src.items;
    if (!arr && Array.isArray(src?.data)) arr = src.data;
    if (!arr) arr = [src];
    return Array.from(
      new Set(
        arr
          .map((h: any) => {
            const raw =
              typeof h === "string" || h instanceof Date
                ? h
                : h?.date ?? h?.day ?? null;
            if (!raw) return null;
            const d = dayjs(raw);
            return d.isValid() ? d.format("YYYY-MM-DD") : null;
          })
          .filter(Boolean)
      )
    );
  };

  const holidayList = extractHolidayDates(holidaysData);

  const policies = policiesData?.policies ?? [];
  const [leaveType, setLeaveType] = useState("");
  const [dates, setDates] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<"morning" | "afternoon" | "">("");

  const selectedPolicy = policies.find((p) => p.leave_type === leaveType);

  const { data: available, isLoading: isBalanceLoading } =
    useEmployeeAvailableLeave(
      targetEmployeeId,
      selectedPolicy?.id,
      crossOrg
    );

  const { data: accruals } = useEmployeeLeaveAccruals(
    targetEmployeeId,
    selectedPolicy?.id,
    crossOrg
  );

  const { data: leavesRes } = useEmployeeLeaves(targetEmployeeId, 1, 200);
  const allLeaves = leavesRes?.leaves ?? [];

  const filteredLeaves = selectedPolicy
    ? allLeaves.filter((l: any) => l.leave_type_id === selectedPolicy.id)
    : [];

  const balance = available?.remaining_days ?? 0;
  const createLeave = useCreateEmployeeLeave(targetEmployeeId);

  // ✅ calculate applied days
// ✅ days applied excluding weekends & holidays
const dayMap: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const workingDays = useMemo(() => {
  return (
    organization?.working_time_settings?.working_days
      ?.map((day: string) => dayMap[day])
      ?.filter((d: number) => d !== undefined) ?? [1, 2, 3, 4, 5]
  );
}, [organization]);
  
const appliedDays = useMemo(() => {
  if (!dates.from || !dates.to) return 0;
  const start = dayjs(dates.from);
  const end = dayjs(dates.to);
  if (!start.isValid() || !end.isValid()) return 0;

  let count = 0;
  let d = start.clone();
  const holidaySet = new Set(holidayList);

  while (d.isSameOrBefore(end, "day")) {
    const isWorkingDay = workingDays.includes(d.day());

    const isHoliday = holidaySet.has(
      d.format("YYYY-MM-DD")
    );

    if (isWorkingDay && !isHoliday) {
      count++;
    }

    d = d.add(1, "day");
  }

  return isHalfDay ? 0.5 : count;
}, [
  dates.from,
  dates.to,
  isHalfDay,
  holidayList,
  workingDays,
]);


  const handleFileChange = (files: FileList | null) => {
   const validFiles = validateFiles(files);
  if (validFiles.length > 0) {
    setAttachments((prev) => [...prev, ...validFiles]);
  }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType || !dates.from || !dates.to) return;

    const start = dayjs(dates.from);
    const end = dayjs(dates.to);

    // ✅ Invalid range validation
    if (start.isAfter(end, "day")) {
      emitSuccess({
        message: "Start date cannot be after end date.",
        type: "error",
      });
      return;
    }

    if (isHalfDay && dates.from !== dates.to) {
      alert("Half-day leave can only be applied for a single date.");
      return;
    }

    const leavePolicy = selectedPolicy;
    if (!leavePolicy) return;

    const payload = {
      leave_type_id: leavePolicy.id,
      start_date: dates.from,
      end_date: dates.to,
      days_applied: appliedDays,
      notes: reason || null,
      is_half_day: Boolean(isHalfDay),
      half_day_type: isHalfDay ? halfDayType : null,
      auto_approve: autoApprove,
    };

    createLeave.mutate(payload, {
      onSuccess: async (createdLeave: EmployeeLeave) => {
        emitSuccess({ message: "Leave request submitted successfully!", type: "success" });
        if (attachments.length > 0) {
          for (const file of attachments) {
            await employeeLeaveApi.uploadAttachment(
              createdLeave.organization_id,
              createdLeave.employee_id,
              createdLeave.id,
              file
            );
          }
          emitSuccess({ message: "All attachments uploaded successfully!", type: "success" });
        }
        setLeaveType("");
        setDates({ from: "", to: "" });
        setReason("");
        setAttachments([]);
        setIsHalfDay(false);
        setHalfDayType("");
       // ✅ Close dialog / notify parent
        onSuccess?.();
      },
    });
  };

let usedFull = 0;
let usedHalf = 0;
let usedUnpaid = 0;

for (const l of filteredLeaves) {
  const isValidUsage =
    l.status === "approved" ||
    l.status === "pending_cancel_approval" ||
    l.status === "cancel_rejected";

  if (!isValidUsage) continue;

  usedFull += Number(l.full_pay_days ?? 0);
  usedHalf += Number(l.half_pay_days ?? 0);
  usedUnpaid += Number(l.unpaid_days ?? 0);
}

const paidUsed = usedFull + usedHalf;
const totalUsed = paidUsed + usedUnpaid;

const entitlement = Number(
  selectedPolicy?.entitlement_days ?? 0
);

const isAccruable =
  selectedPolicy?.is_accruable ?? false;

const accruedBalance = Number(
  isAccruable
    ? available?.accrued_balance ?? 0
    : entitlement
);

const remaining = isAccruable
  ? Math.max(accruedBalance - paidUsed, 0)
  : Math.max(entitlement - totalUsed, 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto p-6 bg-white shadow rounded space-y-6">
        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Leave Type</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Leave Type</option>
            {isPoliciesLoading ? (
              <option>Loading…</option>
            ) : (
              policies.map((p) => (
                <option key={p.id} value={p.leave_type}>
                  {p.leave_type}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Half-Day */}
        <div>
          <label className="block text-sm font-medium mb-1">Half-Day Leave</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsHalfDay(checked);
                  if (checked && dates.from)
                    setDates((d) => ({ from: d.from, to: d.from }));
                  if (!checked) setHalfDayType("");
                }}
              />
              Apply Half-Day
            </label>
            {isHalfDay && (
              <div className="flex gap-3 ml-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="halfDayType"
                    value="morning"
                    checked={halfDayType === "morning"}
                    onChange={(e) => setHalfDayType(e.target.value as "morning")}
                    required
                  />
                  Morning
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="halfDayType"
                    value="afternoon"
                    checked={halfDayType === "afternoon"}
                    onChange={(e) => setHalfDayType(e.target.value as "afternoon")}
                    required
                  />
                  Afternoon
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Dates with Holiday Disabled */}
        <div>
         <div className="flex flex-col sm:flex-row gap-2">
  <DatePopover
    label="From"
    value={dates.from}
    onChange={(val) =>
      setDates((d) => ({ from: val, to: isHalfDay ? val : d.to }))
    }
    holidays={holidayList}
    workingDays={workingDays}
    minDate={minAllowedDate}
    maxDate={maxAllowedDate}
  />

  <DatePopover
    label="To"
    value={dates.to}
    onChange={(val) => setDates((d) => ({ ...d, to: val }))}
    disabled={isHalfDay}
    minDate={dates.from || minAllowedDate}
    maxDate={maxAllowedDate}
    holidays={holidayList}
    workingDays={workingDays}
  />
</div>

{leaveType && selectedPolicy && selectedPolicy.show_to_employees !== false && (
  <div className="flex justify-between items-center mt-1">
    <p
      className={`text-xs ${
        appliedDays > balance ? "text-orange-600" : "text-gray-500"
      }`}
    >
      {isBalanceLoading
        ? "Checking available balance..."
        : appliedDays > balance
        ? `⚠ You are applying ${appliedDays} days but have only ${balance} available.`
        : `You have ${balance} days balance. Applying ${appliedDays} → Balance left ${
            balance - appliedDays
          }.`}
    </p>
    {available && (
      <button
        type="button"
        onClick={() => setShowHistory(true)}
        className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
      >
        <History className="w-3.5 h-3.5 mr-1" />
        View History
      </button>
    )}
  </div>
)}

        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Reason / Notes</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Briefly describe reason for leave (optional unless required)."
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium mb-1">Attachments</label>
<div className="border-2 border-dashed rounded p-4 text-center text-sm text-gray-500">
  <label className="cursor-pointer flex flex-col items-center gap-1">
    {/* ✅ hidden input must be inside the label */}
    <input
      type="file"
      multiple
      className="hidden"
      onChange={(e) => handleFileChange(e.target.files)}
      accept={SUPPORTED_FILE_TYPES.join(",")}
    />

    <Upload className="mx-auto w-6 h-6 text-gray-400" />
    <span>
      <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
    </span>
    <span className="text-xs text-gray-400 mt-1">
      Supported: {SUPPORTED_FILE_TYPES.map(t => t.replace(".", "").toUpperCase()).join(", ")} • Max {MAX_FILE_SIZE_MB} MB
    </span>
  </label>
</div>
          {attachments.length > 0 && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {attachments.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Review */}
        <div className="border rounded p-4 bg-gray-50 text-sm">
          <p className="font-semibold mb-2">Review Before Submit</p>
          <p>Leave Type: {leaveType || "--"}</p>
          <p>
            Dates: {dates.from || "--"} → {dates.to || "--"}
          </p>
          {isHalfDay && <p>Half-Day: {halfDayType}</p>}
          <p>Total Days: {appliedDays}</p>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
          disabled={
          createLeave.isPending ||
          !leaveType ||
          !dates.from ||
          !dates.to ||
          dayjs(dates.from).isAfter(dayjs(dates.to), "day")
        }
        >
          {createLeave.isPending ? "Submitting…" : "Submit Application"}
        </button>
      </form>

      

      {/* Ledger / History Dialog */}
      <FormDialog
        open={showHistory}
        title={`${leaveType || "Leave"} Ledger History`}
        onClose={() => setShowHistory(false)}
        maxWidth="max-w-3xl"
      >
        {available && accruals && filteredLeaves ? (
         <AuditSummary
          available={available}
          accruals={accruals}
          leave={{
            allLeaves: filteredLeaves,
            totalUsed,
            remaining,
          }}
        />
        ) : (
          <p className="text-sm text-gray-500">Loading ledger details…</p>
        )}
      </FormDialog>
    </>
  );
}
