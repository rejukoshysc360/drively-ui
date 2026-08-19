import React from "react";

type DeleteTaskDialogueProps = {
  task: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const DeleteTaskDialogue: React.FC<DeleteTaskDialogueProps> = ({ task, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 w-80">
        <h2 className="text-lg font-semibold">Delete Task</h2>
        <p>Are you sure you want to delete <b>{task}</b>?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-1 rounded-lg border border-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaskDialogue;
