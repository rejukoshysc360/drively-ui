// components/audit/AuditDetailsDialog.tsx
import FormDialog from "../../components/ui/FormDialog";
import { useAuditLog } from "./hooks";
import { Loader2, Table, Activity, User, Clock, Code2, X } from "lucide-react";

export default function AuditDetailsDialog({
  auditId,
  onClose,
}: {
  auditId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useAuditLog(auditId ?? undefined);

  return (
    <FormDialog
      open={!!auditId}
      title=""
      onClose={onClose}
      maxWidth="max-w-4xl"
      // Remove default title bar – we’ll make our own with close button
    >
      {/* Custom Header with Close Button */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white rounded-t-xl">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-6 h-6 text-indigo-600" />
          Audit Log Details
        </h2>

      </div>

      {/* Scrollable Content */}
     <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
            <p className="text-lg">Loading audit details...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-lg font-medium">No details found.</p>
            <p className="text-sm mt-2">This audit record may have been deleted.</p>
          </div>
        ) : (
          <div className="space-y-7 py-6">
            {/* Header Info – Clean Card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-5 flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Audit Event
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="flex items-start gap-3">
                  <Table className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Table</p>
                    <p className="font-mono text-indigo-800 font-bold break-words">
                      {data.table_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Operation</p>
                    <p className="font-bold capitalize text-purple-700">{data.operation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Code2 className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Record ID</p>
                    <code className="font-mono bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded text-xs break-all">
                      {data.record_id || "—"}
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Changed By</p>
                    <p className="font-bold">
                      {data.actor ? data.actor.full_name || "Unknown User" : "System"}
                    </p>
                    {data.actor?.email && (
                      <p className="text-xs text-gray-600 mt-1 break-words">{data.actor.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Changed At</p>
                    <p className="font-bold">
                      {new Date(data.changed_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "long",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* JSON Sections */}
            <div className="space-y-6">
              {data.changed_fields && Object.keys(data.changed_fields).length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-green-600" />
                    Changed Fields
                  </h4>
                  <pre className="bg-gray-900 text-green-400 p-5 rounded-xl text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-80 border border-gray-700">
                    {JSON.stringify(data.changed_fields, null, 2)}
                  </pre>
                </div>
              )}

              {data.old_data && Object.keys(data.old_data).length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-red-600" />
                    Previous Values (Old)
                  </h4>
                  <pre className="bg-gray-900 text-red-400 p-5 rounded-xl text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-80 border border-gray-700">
                    {JSON.stringify(data.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {data.new_data && Object.keys(data.new_data).length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-cyan-500" />
                    Current Values (New)
                  </h4>
                  <pre className="bg-gray-900 text-cyan-400 p-5 rounded-xl text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-80 border border-gray-700">
                    {JSON.stringify(data.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {!data.changed_fields &&
                !data.old_data &&
                !data.new_data && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-600 italic">
                      No data changes were recorded for this event.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}