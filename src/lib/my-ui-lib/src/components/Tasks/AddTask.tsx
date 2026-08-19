import React from "react";

type AddTaskProps = {
  onAdd?: (task: string) => void;
};

const AddTask: React.FC<AddTaskProps> = ({ onAdd }) => {
  const [task, setTask] = React.useState("");

  const handleSubmit = () => {
    if (task.trim()) {
      onAdd?.(task);
      setTask("");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="Enter task"
        className="border rounded-lg px-3 py-1 flex-1"
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Add
      </button>
    </div>
  );
};

export default AddTask;
