import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Pencil } from "lucide-react";
import { useUpdateTimesheet } from "../hooks";
import { useCan } from "../../../../src/utils/permissions";
import FormDialog from "../../../components/ui/FormDialog";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import SingleDayTimesheetEditor from "./SingleDayTimesheetEditor";

interface ProjectsTasksSectionProps {
  employeeTimesheets: any[]; // Consider typing this properly (e.g. Timesheet[])
  selectedWeekStart: string | Date;
  selectedWeekEnd: string | Date;
  isLoading: boolean;
  employeeId: string;
}

export default function ProjectsTasksSection({
  employeeTimesheets,
  selectedWeekStart,
  selectedWeekEnd,
  isLoading,
  employeeId,
}: ProjectsTasksSectionProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingButton, setSavingButton] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});
  const [editDate, setEditDate] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{
    id: string;
    action: "approved" | "rejected" | "draft" | "submitted" | null;
    label: string;
    description: string;
  } | null>(null);

  const updateTimesheet = useUpdateTimesheet();
  const can = useCan();

  const handleConfirmedAction = (id: string, status: "approved" | "rejected" | "draft" | "submitted") => {
    setSavingId(id);
    setSavingButton(status);
    setPendingStatus((p) => ({ ...p, [id]: status }));
    setLocalStatus((p) => ({ ...p, [id]: status }));

    updateTimesheet.mutate(
      { id, status },
      {
        onSettled: () => {
          setTimeout(() => {
            setSavingId(null);
            setSavingButton(null);
            setPendingStatus((p) => {
              const { [id]: _, ...rest } = p;
              return rest;
            });
          }, 300);
        },
      }
    );
  };

  useEffect(() => {
    if (Object.keys(localStatus).length) {
      const timeout = setTimeout(() => setLocalStatus({}), 1500);
      return () => clearTimeout(timeout);
    }
  }, [employeeTimesheets]);

  const confirmAction = (
    id: string,
    action: "approved" | "rejected" | "draft" | "submitted",
    label: string,
    description: string
  ) => {
    setConfirmData({ id, action, label, description });
  };

  return (
    <div className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Projects & Tasks</h3>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !employeeTimesheets?.length ? (
        <p className="text-sm text-gray-500">No timesheets found for this period.</p>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {employeeTimesheets
            .filter(
              (ts) =>
                dayjs(ts.date).isSameOrAfter(selectedWeekStart, "day") &&
                dayjs(ts.date).isSameOrBefore(selectedWeekEnd, "day")
            )
            .map((ts) => {
              const currentStatus = localStatus[ts.id] ?? ts.status;
              const isPending = pendingStatus[ts.id];

              return (
                <div
                  key={ts.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                      <div className="text-sm text-gray-700 font-medium">
                        Date: <span className="font-semibold text-gray-900">{ts.date}</span>
                      </div>

                      {can("timesheets:update") && (
                        <button
                          onClick={() => setEditDate(ts.date)}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shadow-sm self-start sm:self-center ${
                          currentStatus === "edit_requested"
                            ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
                            : currentStatus === "approved"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : currentStatus === "submitted"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : currentStatus === "rejected"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {isPending
                          ? isPending === "approved"
                            ? "Approving..."
                            : isPending === "rejected"
                            ? "Rejecting..."
                            : isPending === "draft"
                            ? "Granting Edit..."
                            : "Processing..."
                          : currentStatus.replace("_", " ")}
                      </span>

                      <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-end">
                        {currentStatus === "submitted" && can("timesheets:update") && (
                          <>
                            <button
                              onClick={() =>
                                confirmAction(
                                  ts.id,
                                  "approved",
                                  "Approve Timesheet",
                                  `Approve timesheet for ${ts.date}?`
                                )
                              }
                              disabled={!!isPending}
                              className="text-xs font-medium px-3 py-1.5 sm:py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 shadow-sm transition min-w-[88px]"
                            >
                              {isPending === "approved" ? "Approving..." : "Approve"}
                            </button>

                            <button
                              onClick={() =>
                                confirmAction(
                                  ts.id,
                                  "rejected",
                                  "Reject Timesheet",
                                  `Reject timesheet for ${ts.date}?`
                                )
                              }
                              disabled={!!isPending}
                              className="text-xs font-medium px-3 py-1.5 sm:py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shadow-sm transition min-w-[88px]"
                            >
                              {isPending === "rejected" ? "Rejecting..." : "Reject"}
                            </button>
                          </>
                        )}

                        {currentStatus === "edit_requested" && can("timesheets:update") && (
                          <>
                            <button
                              onClick={() =>
                                confirmAction(
                                  ts.id,
                                  "draft",
                                  "Grant Edit Request",
                                  `Allow editing for ${ts.date}?`
                                )
                              }
                              disabled={!!isPending}
                              className="text-xs font-medium px-3 py-1.5 sm:py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition min-w-[88px]"
                            >
                              {isPending === "draft" ? "Granting..." : "Grant Edit"}
                            </button>

                            <button
                              onClick={() =>
                                confirmAction(
                                  ts.id,
                                  "submitted",
                                  "Deny Edit Request",
                                  `Deny edit request for ${ts.date}?`
                                )
                              }
                              disabled={!!isPending}
                              className="text-xs font-medium px-3 py-1.5 sm:py-2 rounded-md border border-gray-400 text-gray-700 hover:bg-gray-100 disabled:opacity-50 shadow-sm transition min-w-[88px]"
                            >
                              {isPending === "submitted" ? "Processing..." : "Deny"}
                            </button>
                          </>
                        )}

                        {currentStatus === "approved" && can("timesheets:update") && (
                          <button
                            onClick={() =>
                              confirmAction(
                                ts.id,
                                "submitted",
                                "Reopen for Edit",
                                `Reopen approved timesheet for ${ts.date}? (moves to Submitted)`
                              )
                            }
                            disabled={!!isPending}
                            className="text-xs font-medium px-3 py-1.5 sm:py-2 rounded-md border border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 shadow-sm transition min-w-[88px]"
                          >
                            {isPending === "submitted" ? "Reopening..." : "Reopen"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {ts.entries?.length ? (
                    <div className="overflow-x-auto mt-3">
                      <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left">Project</th>
                            <th className="px-3 py-2 text-left">Task</th>
                            <th className="px-3 py-2 text-left">Activity</th>
                            <th className="px-3 py-2 text-center">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ts.entries.map((entry: any, idx: number) => (
                            <tr key={idx} className="border-t hover:bg-white/70 transition">
                              <td className="px-3 py-2 text-gray-800">
                                {entry.project_name || "—"}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {entry.task_path || entry.task_name || "Others"}
                              </td>
                              <td className="px-3 py-2 text-gray-600 italic">
                                {entry.activity || "—"}
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-gray-800">
                                {new Intl.NumberFormat("en-US", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }).format(entry.hours ?? 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-3">
                      No task entries for this day.
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Edit Dialog – now with scrollable content area */}
      <FormDialog
        open={!!editDate}
        title={`Edit Timesheet — ${editDate || ""}`}
        onClose={() => setEditDate(null)}
        maxWidth="max-w-4xl"
      >
        {editDate && can("timesheets:update") && (
          <div
            className="
              max-h-[65vh]          /* ← adjustable: 60vh–75vh depending on your dialog padding */
              overflow-y-auto       /* enables scrolling when content is long */
              overscroll-contain    /* better mobile touch feel */
              px-1 sm:px-2 lg:px-4  /* extra breathing room */
              py-4                  /* vertical padding */
              scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
            "
          >
            <SingleDayTimesheetEditor
              date={editDate}
              employeeId={employeeId}
              onClose={() => setEditDate(null)}
            />
          </div>
        )}
      </FormDialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmData}
        title={confirmData?.label || ""}
        description={confirmData?.description || ""}
        confirmLabel="Confirm"
        isLoading={!!(confirmData && savingId === confirmData.id)}
        onConfirm={async () => {
          if (confirmData?.id && confirmData?.action) {
            handleConfirmedAction(confirmData.id, confirmData.action);
          }
          setConfirmData(null);
        }}
        onClose={() => setConfirmData(null)}
      />
    </div>
  );
}