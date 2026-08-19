import React from "react";

type Props = {
  task: any;
  tasks: any[];
  onClose: () => void;
  onSave: (deps: string[]) => void;
};

const DependencyModal: React.FC<Props> = ({ task, tasks, onClose, onSave }) => {
  const [selected, setSelected] = React.useState<string[]>(task.dependencies || []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-3">Select Dependencies</h2>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {tasks
            .filter((t) => t.id !== task.id)
            .map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                />
                {t.name}
              </label>
            ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => onSave(selected)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DependencyModal;
