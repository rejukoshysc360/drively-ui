// src/features/system-jobs/components/EmailAuditOverlay.tsx

import { Mail, X } from "lucide-react";

type Props = {
  open: boolean;

  onClose: () => void;

  executionId: string | null;

  logs: any[];

  isLoading?: boolean;
};

export default function EmailAuditOverlay({
  open,
  onClose,
  executionId,
  logs,
  isLoading,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />

            <div>
              <h2 className="text-lg font-semibold">
                Email Audit Logs
              </h2>

              <p className="text-sm text-gray-500">
                Job Execution: {executionId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto p-5 flex-1">
          {isLoading ? (
            <div className="text-center text-gray-500 py-10">
              Loading email audit...
            </div>
          ) : logs.length ? (
            <div className="space-y-5">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">
                        Email Type
                      </div>

                      <div className="font-medium">
                        {log.email_type}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Provider
                      </div>

                      <div className="font-medium uppercase">
                        {log.provider}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Total Sent
                      </div>

                      <div className="font-medium text-green-600">
                        {log.total_sent}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Total Failed
                      </div>

                      <div className="font-medium text-red-600">
                        {log.total_failed}
                      </div>
                    </div>
                  </div>

                  {/* Success Recipients */}
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Successful Recipients
                    </div>

                    <div className="max-h-40 overflow-auto border rounded p-2 bg-gray-50 text-sm">
                      {log.recipients?.length ? (
                        <ul className="space-y-1">
                          {log.recipients.map(
                            (email: string) => (
                              <li key={email}>
                                {email}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <div className="text-gray-400">
                          No recipients
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Failed Recipients */}
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Failed Recipients
                    </div>

                    <div className="max-h-32 overflow-auto border rounded p-2 bg-red-50 text-sm">
                      {log.failed_recipients?.length ? (
                        <ul className="space-y-1 text-red-600">
                          {log.failed_recipients.map(
                            (email: string) => (
                              <li key={email}>
                                {email}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <div className="text-gray-400">
                          No failures
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Errors */}
                  {!!log.error_messages?.length && (
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Errors
                      </div>

                      <div className="max-h-32 overflow-auto border rounded p-2 bg-red-50 text-sm text-red-600">
                        <ul className="space-y-1">
                          {log.error_messages.map(
                            (
                              err: string,
                              idx: number
                            ) => (
                              <li key={idx}>
                                {err}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              No email audit logs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}