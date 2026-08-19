import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAddSalary, useUpdateSalary, useSalaryHistory } from "./hooks";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { emitApiError } from "../../../lib/error-bus";
import { emitSuccess } from "../../../lib/success-bus";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useEmployee } from "../hooks";

type Props = {
  employeeId: string;
  initial?: any;
  onSuccess?: (newRec?: any) => void;
};

export default function SalaryForm({ employeeId, initial, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: initial ?? {
      type_id: "",
      amount: "",
      effective_from: "",
      effective_to: "",
      remarks: "",
    },
  });

  const add = useAddSalary(employeeId);
  const update = useUpdateSalary(employeeId);
  const isEdit = !!initial?.id;

  const { data: allSalaryRecords = [] } = useSalaryHistory(employeeId, undefined, undefined);
  const { data: org, isLoading: orgLoading } = useOrganization();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  const { data: employee } = useEmployee(employeeId);
  const hireDate = employee?.hire_date ? new Date(employee.hire_date) : null;
  hireDate?.setHours(0, 0, 0, 0); // normalize

  const compensationTypes = useMemo(() => {
    if (!org?.compensation_settings?.types) return [];
    return org.compensation_settings.types
      .filter((t: any) => !t.deleted)
      .map((t: any) => ({
        id: String(t.id),
        name: t.name,
        label: t.name?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unnamed",
        allow_overlap: !!t.allow_overlap, // ✅ new field
      }));
  }, [org]);

  const onSubmit = async (values: any) => {

    if (hireDate) {
      const effectiveFrom = new Date(values.effective_from);
      effectiveFrom.setHours(0, 0, 0, 0);  
      if (effectiveFrom < hireDate) {
        emitApiError({
          message: `Effective From cannot be earlier than employee's joining date (${employee?.hire_date}).`,
        });
        return;
      }
    }

    const selected = compensationTypes.find((t) => t.id === values.type_id);
    if (!selected) {
      emitApiError({ message: "Please select a compensation type" });
      return;
    }

    const fromDate = new Date(values.effective_from);
    const toDate = values.effective_to ? new Date(values.effective_to) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (toDate && toDate <= fromDate) {
      emitApiError({ message: "Effective To must be after Effective From" });
      return;
    }

    const isBackdated = fromDate < today;
    const daysBack = isBackdated ? Math.floor((today.getTime() - fromDate.getTime()) / 86400000) : 0;

    /*if (isBackdated && daysBack > 180) {
      emitApiError({ message: "Cannot back-date more than 6 months" });
      return;
    }*/

    const payloadData = { values, selected, isRetroactive: isBackdated };

    if (isBackdated) {
      setConfirmConfig({
        title: "Back-dated Compensation",
        description: `You are back-dating this change by ${daysBack} day(s). This will trigger retroactive payroll processing.\n\nDo you want to proceed?`,
        confirmLabel: "Yes, Proceed",
        danger: false,
        onConfirm: () => runOverlapCheck(payloadData),
      });
      setConfirmOpen(true);
      return;
    }

    runOverlapCheck(payloadData);
  };

  // ✅ Overlap check with allow_overlap support
  const runOverlapCheck = (data: any) => {
    const { values, selected, isRetroactive } = data;
    const allowOverlap = !!selected.allow_overlap; // ✅ use setting

    const normalize = (dateStr: string | null) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const newFrom = normalize(values.effective_from)!;
    const newTo = normalize(values.effective_to);

    const overlappingRecords = allSalaryRecords.filter((rec: any) => {
      if (isEdit && rec.id === initial?.id) return false;
      if (String(rec.type_id) !== selected.id) return false;
      const recFrom = normalize(rec.effective_from)!;
      const recTo = normalize(rec.effective_to);
      if (!recTo) return newFrom <= recFrom;
      const overlap = newFrom <= recTo && (newTo ?? newFrom) >= recFrom;
      const nextDayAllowed = newFrom === recTo + 86400000;
      return overlap && !nextDayAllowed;
    });

    if (overlappingRecords.length > 0) {
      if (allowOverlap) {
        // ⚠️ Warn but allow save
        setConfirmConfig({
          title: "Date Overlap Warning",
          description: `This update overlaps with ${overlappingRecords.length} existing record(s) for "${selected.label}".\n\nDo you still want to proceed?`,
          confirmLabel: "Proceed Anyway",
          danger: false,
          onConfirm: () => {
            setConfirmOpen(false);
            runGapCheck(values, selected, isRetroactive);
          },
        });
        setConfirmOpen(true);
        return;
      } else {
        // 🚫 Block save
        setConfirmConfig({
          title: "Date Overlap Detected",
          description: "Cannot save: This date range overlaps with an existing record. Please adjust Effective From / To dates.",
          confirmLabel: "OK",
          danger: true,
          onConfirm: () => setConfirmOpen(false),
        });
        setConfirmOpen(true);
        return;
      }
    }

    runGapCheck(values, selected, isRetroactive);
  };

  // ✅ Gap check
  const runGapCheck = (values: any, selected: any, isRetroactive: boolean) => {
    const recordsOfSameType = allSalaryRecords
      .filter((r: any) => String(r.type_id) === selected.id)
      .sort((a: any, b: any) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime());

    if (recordsOfSameType.length) {
      const latest = recordsOfSameType[recordsOfSameType.length - 1];
      const latestTo = latest.effective_to ? new Date(latest.effective_to).setHours(0, 0, 0, 0) : null;
      const newFrom = new Date(values.effective_from).setHours(0, 0, 0, 0);

      if (latestTo && newFrom > latestTo + 86400000) {
        setConfirmConfig({
          title: "Gap Detected",
          description: `A gap exists between the last record (ending ${latest.effective_to}) and this new start date (${values.effective_from}).\n\nThis may cause missing pay for the gap period. Do you want to proceed?`,
          confirmLabel: "Proceed Anyway",
          danger: false,
          onConfirm: () => performSave(values, selected, isRetroactive),
        });
        setConfirmOpen(true);
        return;
      }
    }

    performSave(values, selected, isRetroactive);
  };

  const performSave = async (values: any, selected: any, isRetroactive: boolean) => {
    const payload: any = {
      type_id: selected.id,
      type: selected.name,
      amount: Number(values.amount),
      effective_from: values.effective_from,
      effective_to: values.effective_to || null,
      remarks: values.remarks || null,
    };

    if (isRetroactive) {
      payload.is_retroactive = true;
      payload.retroactive_reason = values.remarks || "Back-dated salary change";
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ salaryId: initial.id, input: payload });
      } else {
        await add.mutateAsync(payload);
        reset();
      }
      emitSuccess({ message: "Compensation saved successfully!", type: "success" });
      onSuccess?.();
    } catch (err: any) {
      emitApiError({
        message: err?.response?.data?.message || "Failed to save compensation",
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  if (orgLoading) return <div>Loading types...</div>;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium">Type *</label>
          <select className="input w-full" {...register("type_id", { required: true })}>
            <option value="">Select Type</option>
            {compensationTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Amount *</label>
          <input type="number" step="0.01" className="input w-full" {...register("amount", { required: true })} />
        </div>

        <div>
          <label className="block font-medium">Effective From *</label>
          <input type="date" className="input w-full" {...register("effective_from", { required: true })} />
        </div>

        <div>
          <label className="block font-medium">Effective To (optional)</label>
          <input type="date" className="input w-full" {...register("effective_to")} />
        </div>

        <div>
          <label className="block font-medium">Remarks</label>
          <textarea className="input w-full" rows={2} {...register("remarks")} />
        </div>

        <button
          type="submit"
          disabled={add.isPending || update.isPending}
          className="btn-primary w-full"
        >
          {add.isPending || update.isPending
            ? "Saving..."
            : isEdit
            ? "Update"
            : "Add Compensation"}
        </button>
      </form>

      {confirmConfig && (
        <ConfirmDialog
          open={confirmOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          danger={confirmConfig.danger}
          isLoading={false}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
