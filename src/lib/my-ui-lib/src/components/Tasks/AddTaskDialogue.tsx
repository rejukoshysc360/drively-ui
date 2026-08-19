import React from "react";

type AddTaskDialogueProps = {
  onConfirm?: (task: string) => void;
  onCancel?: () => void;
};

const AddTaskDialogue: React.FC<AddTaskDialogueProps> = ({ onConfirm, onCancel }) => {
  const [task, setTask] = React.useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 w-80">
        <h2 className="text-lg font-semibold">Add Task</h2>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task"
          className="border rounded-lg px-3 py-2 w-full"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-1 rounded-lg border border-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (task.trim()) {
                onConfirm?.(task);
                setTask("");
              }
            }}
            className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskDialogue;
