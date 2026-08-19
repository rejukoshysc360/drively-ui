import React, { useState } from "react";
import {
  Chart,
  CustomSlider,
  GlobalStateProvider,
  AddTask,
  DeleteTask,
  AddTaskDialogue,
  DeleteTaskDialogue,
} from "../../lib/my-ui-lib-tsx/src";

const SmartSheet: React.FC = () => {
  const [tasks, setTasks] = useState<string[]>(["Finish report", "Review PR"]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<null | string>(null);
  const [sliderVal, setSliderVal] = useState(30);

  const handleAddTask = (task: string) => {
    setTasks([...tasks, task]);
    setShowAddDialog(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t !== id));
    setShowDeleteDialog(null);
  };

  return (
    <GlobalStateProvider>
      <div className="p-6 space-y-6">
        {/* Chart */}
        <h2 className="text-xl font-bold">Performance Chart</h2>
        <Chart />

        {/* Slider */}
        <div>
          <h2 className="text-xl font-bold mb-2">Progress Slider</h2>
          <CustomSlider value={sliderVal} onChange={setSliderVal} />
          <p className="mt-2 text-gray-600">Value: {sliderVal}</p>
        </div>

        {/* Task Management */}
        <div>
          <h2 className="text-xl font-bold mb-2">Task List</h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task}
                className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg"
              >
                <span>{task}</span>
                <DeleteTask taskId={task} onDelete={() => setShowDeleteDialog(task)} />
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Dialogues */}
      {showAddDialog && (
        <AddTaskDialogue
          onConfirm={handleAddTask}
          onCancel={() => setShowAddDialog(false)}
        />
      )}
      {showDeleteDialog && (
        <DeleteTaskDialogue
          task={showDeleteDialog}
          onConfirm={() => handleDeleteTask(showDeleteDialog)}
          onCancel={() => setShowDeleteDialog(null)}
        />
      )}
    </GlobalStateProvider>
  );
};

export default SmartSheet;
