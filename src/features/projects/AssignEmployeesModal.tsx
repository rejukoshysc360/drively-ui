// src/projects/AssignEmployeesModal.tsx
import { useEffect, useState } from 'react';
import { useEmployees } from '../employees/hooks';
import { useBulkAssignEmployees, useAssignments } from './hooks';

type Props = {
  projectId: string;
  onClose: () => void;
};

export default function AssignEmployeesModal({ projectId, onClose }: Props) {
  const { data, isLoading } = useEmployees(1, 1000); // fetch all employees
  const employees = data?.employees ?? [];

  const { data: assignedData, isLoading: isAssignmentsLoading } = useAssignments(projectId);
  const alreadyAssigned = assignedData ?? [];

  const [selected, setSelected] = useState<string[]>([]);
  const bulkAssign = useBulkAssignEmployees(projectId);

  // ✅ Initialize selected with already assigned employees
  useEffect(() => {
    if (alreadyAssigned?.length) {
      setSelected(alreadyAssigned.map((a: any) => a.employee_id));
    }
  }, [alreadyAssigned]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
    const assignments = selected.map((id) => ({
      employee_id: id,
      hourly_rate: 0,
      currency: 'USD',
      role: 'Member',
      start_date: new Date().toISOString().slice(0, 10),
      is_active: true,
    }));
    bulkAssign.mutate(assignments, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Assign Employees</h2>

        {/* ✅ Employees render immediately */}
        {isLoading ? (
          <p>Loading employees…</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {employees.map((emp) => (
              <li key={emp.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(emp.id)}
                  onChange={() => toggle(emp.id)}
                />
                <span>
                  {emp.full_name} ({emp.email})
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* ✅ Assignments load separately */}
        {isAssignmentsLoading && (
          <p className="text-xs text-gray-500 mt-2">Loading assignments…</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleAssign}
            disabled={bulkAssign.isLoading || selected.length === 0}
          >
            {bulkAssign.isLoading ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
