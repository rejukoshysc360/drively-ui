import { useState } from "react";
import { Save, Play, RefreshCcw, HardDrive, ShieldAlert } from "lucide-react";
import { useBackupSchedules, useUpdateBackupSchedule, useRunBackup, useReloadBackups } from "./hooks";
import { api } from "../../../lib/axios";
import { emitSuccess } from "../../../lib/success-bus";
import { emitApiError } from "../../../lib/error-bus";
import { emitInfo } from "../../../lib/info-bus"; 
import JobRunDialog from "../jobs/JobRunDialog";
import { useAuth } from "../../auth/AuthProvider";

export default function BackupSchedulesTab() {
  const { data: backups, isLoading, refetch } = useBackupSchedules();
  const updateBackup = useUpdateBackupSchedule();
  const runBackup = useRunBackup();
  const [adhocDates, setAdhocDates] = useState<Record<string, string>>({});
  const [savingJob, setSavingJob] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [status, setStatus] = useState<"running" | "success" | "error">("running");
  const reloadBackups = useReloadBackups();
   const { profile } = useAuth();

   const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : [profile?.roles];
  const slugs = roles.map((r) => r?.slug);
  const isAdmin = slugs.includes("admin");

  if (isLoading) return <p className="text-gray-500 text-sm">Loading backup schedules…</p>;

  // 🔒 Restrict access to admin only
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">Restricted Access</h2>
        <p className="text-gray-500 text-sm max-w-md">
          You don’t have permission to view or manage backup schedules.
          Only system administrators can access this section.
        </p>
      </div>
    );
  }

    const handleSave = async (key: string, cron: string) => {
      try {
        setSavingJob(key);
        await updateBackup.mutateAsync({ key, schedule: cron });
        await reloadBackups.mutateAsync(); // ✅ this now includes orgId internally
         emitSuccess({ message: `${key.replace(/_/g, " ")} schedule updated.`, type: "success" });
        
      } catch (err: any) {
        emitApiError({ message: "Failed to save schedule", raw: err });
      } finally {
        setSavingJob(null);
        refetch();
      }
    };

const handleRunNow = async () => {
  const key = "database_backup";

  const runDate =
    adhocDates[key] || new Date().toISOString().split("T")[0];

  setRunningJob(key);
  setSelectedBackup(key);
  setStatus("running");
  setShowDialog(true);

  try {
    emitInfo(`▶️ Backup ${key} started for ${runDate}`);

    await runBackup.mutateAsync({
      key,
      runDate,
    });

    setStatus("success");
    refetch();
  } catch (err: any) {
    setStatus("error");
    emitApiError({
      message: "Failed to execute backup",
      raw: err,
    });
  } finally {
    setRunningJob(null);
  }
};

  return (
    <div className="card p-4 bg-white shadow rounded space-y-4">
     <div className="flex justify-between items-center">
  <h3 className="text-lg font-medium text-gray-800 flex items-center gap-1">
    <HardDrive className="w-5 h-5 text-gray-600" />
    Backup Schedules
    (Recommended Wed & Sun 3.00 AM)
  </h3>

  <div className="flex items-center gap-2">
<button
  onClick={handleRunNow}
  disabled={runBackup.isPending}
  className="btn flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50"
>
  <Play className="w-4 h-4" />
  {runBackup.isPending ? "Running..." : "Run Backup Now"}
</button>

    <button
      onClick={() => refetch()}
      className="btn flex items-center gap-1"
    >
      <RefreshCcw className="w-4 h-4" />
      Refresh
    </button>
  </div>
</div>

      {!backups?.length && <p className="text-gray-500 text-sm">No backup schedules found.</p>}

      {backups?.map((b: any) => (
        <div key={b.job_name} className="border p-4 rounded-lg bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800 capitalize">
                {b.job_name.replace(/_/g, " ")}
              </h4>
              <p className="text-sm text-gray-600">
              Performs database backup and uploads to AWS S3.
            </p>
            </div>
            <div className="flex gap-2">

              <button
                onClick={() => handleSave(b.job_name, b.cron_expression || "")}
                className="btn-primary flex items-center gap-1"
                disabled={savingJob === b.job_name}
              >
                <Save className="w-4 h-4" />
                {savingJob === b.job_name ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Cron Schedule</label>
              <input
                type="text"
                defaultValue={b.cron_expression || ""}
                onChange={(e) => (b.cron_expression = e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Adhoc Run Date (Optional)
              </label>
              <input
                type="date"
                value={adhocDates[b.job_name] || ""}
                onChange={(e) =>
                  setAdhocDates((prev) => ({ ...prev, [b.job_name]: e.target.value }))
                }
                className="input w-full"
              />
            </div>
          </div>
        </div>
      ))}

      {selectedBackup && (
        <JobRunDialog
          jobName={selectedBackup}
          status={status}
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedBackup(null);
          }}
        />
      )}
    </div>
  );
}
