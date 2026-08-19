import React from "react";

type DeleteTaskProps = {
  taskId: string;
  onDelete?: (id: string) => void;
};

const DeleteTask: React.FC<DeleteTaskProps> = ({ taskId, onDelete }) => {
  return (
    <button
      onClick={() => onDelete?.(taskId)}
      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      Delete
    </button>
  );
};

export default DeleteTask;
