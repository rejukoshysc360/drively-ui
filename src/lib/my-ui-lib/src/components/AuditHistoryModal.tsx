// components/AuditHistoryModal.tsx
import { X, Calendar, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

type AuditEntry = {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  note: string;
  changed_at: string;
  changed_by: {
    user_id: string;
    email: string;
    full_name: string | null;
  };
};

type Props = {
  projectName: string;
  auditHistory: AuditEntry[];
  onClose: () => void;
};

const FIELD_LABELS: Record<string, string> = {
  fixed_fee_amount: 'Fixed Fee Amount',
  expected_deadline: 'Expected Deadline',
  duration_as_per_loa: 'Duration as per LOA',
  start_date: 'Start Date',
  end_date: 'End Date',
  approval_date: 'Approval Date',
  priority: 'Priority',
  status_of_submission: 'Status of Submission',
  billing_type: 'Billing Type',
};

export default function AuditHistoryModal({ projectName, auditHistory, onClose }: Props) {
  if (auditHistory.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-md mx-4 flex flex-col">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Audit History</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-gray-600 text-center text-lg">
              No audit history available for <strong>{projectName}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
<div className="fixed inset-0 z-50 flex flex-col bg-black/70">
  <div
    className="
      flex flex-col flex-1 w-full h-full bg-white
      sm:rounded-none sm:shadow-none sm:m-0 sm:w-full sm:h-full
      md:max-w-2xl md:mx-auto md:my-8 md:rounded-2xl md:shadow-2xl
      overflow-hidden
    "
  >


        {/* Fixed Header with safe-area support */}
        <div className="bg-white border-b border-gray-200 px-5 py-4 sm:px-6 flex justify-between items-center" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 pr-4">
            Audit History — {projectName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition p-2 -mr-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2.5rem)' }}>
          <div className="space-y-8">
            {auditHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                    {entry.changed_by.full_name?.[0]?.toUpperCase() ||
                      entry.changed_by.email[0].toUpperCase()}
                  </div>
                  {index < auditHistory.length - 1 && (
                    <div className="w-0.5 bg-indigo-200 flex-1 mt-3"></div>
                  )}
                </div>

                {/* Card */}
                <div className="flex-1 pb-8 last:pb-0">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
                    <div className="mb-5">
                      <p className="font-semibold text-slate-800 text-base">
                        {entry.changed_by.full_name || entry.changed_by.email}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(entry.changed_at), 'PPP p')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 text-indigo-700 font-medium mb-5">
                      <Edit3 className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base">
                        {FIELD_LABELS[entry.field_name] || entry.field_name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {entry.old_value !== null && (
                        <div className="flex flex-col">
                          <span className="text-red-600 font-medium mb-1">Old Value</span>
                          <span className="bg-red-50 px-4 py-2 rounded-lg break-words">
                            {entry.old_value || '<empty>'}
                          </span>
                        </div>
                      )}
                      {entry.new_value !== null && (
                        <div className="flex flex-col">
                          <span className="text-green-600 font-medium mb-1">New Value</span>
                          <span className="bg-green-50 px-4 py-2 rounded-lg break-words">
                            {entry.new_value || '<empty>'}
                          </span>
                        </div>
                      )}
                    </div>

                    {entry.note && entry.note !== '(no note)' && (
                      <div className="mt-5 p-4 bg-white/80 rounded-xl border border-gray-200">
                        <p className="text-sm italic text-gray-700 leading-relaxed">
                          "{entry.note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}