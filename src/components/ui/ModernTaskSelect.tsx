import { Listbox, Transition } from "@headlessui/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo } from "react";

type Task = {
  id: string;
  name: string;
  parent_id?: string | null;
  is_assigned?: boolean;
};

type Props = {
  value: string | null;
  onChange: (v: string) => void;
  tasks: Task[];
  disabled?: boolean;
  isPrepopulated?: boolean;
};

export default function ModernTaskSelect({
  value,
  onChange,
  tasks,
  disabled,
  isPrepopulated = false,
}: Props) {
  const computeDepth = (task: Task, all: Task[]): number => {
    let depth = 0;
    let current = task;
    while (current?.parent_id) {
      const parent = all.find((t) => t.id === current.parent_id);
      if (!parent) break;
      depth++;
      current = parent;
    }
    return depth;
  };

  const formattedTasks = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      name: t.name,
      parent_id: t.parent_id,
      is_assigned: t.is_assigned,
      depth: computeDepth(t, tasks),
    }));
  }, [tasks]);

  const taskOptions = useMemo(
    () => [
      { id: "select", name: "Select a task", is_assigned: false, depth: 0 },
      ...formattedTasks,
      { id: "other", name: "Other", is_assigned: true, depth: 0 },
    ],
    [formattedTasks]
  );

  let normalizedValue: string;
  if (isPrepopulated && (value === null || value === "")) {
    normalizedValue = "other";
  } else if (!value || value === "" || value === "select") {
    normalizedValue = "select";
  } else {
    normalizedValue = value;
  }

  const selectedLabel =
    taskOptions.find((t) => t.id === normalizedValue)?.name || "Select a task";

  return (
    <div className="relative w-full text-left">
      <Listbox
        value={normalizedValue}
        onChange={(v) => onChange(v)}
        disabled={disabled}
      >
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-800 text-left shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 ${
              disabled
                ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500"
                : "hover:border-indigo-400"
            }`}
          >
            <span className="block truncate">{selectedLabel}</span>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={`
                absolute z-50 mt-1 w-full 
                rounded-lg bg-white shadow-xl ring-1 ring-black/5 
                focus:outline-none text-sm
                max-h-[min(420px,75vh)]
                overflow-y-auto overscroll-contain
                scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
                divide-y divide-gray-100
              `}
            >
              {/* Global horizontal scroll wrapper */}
              <div className="overflow-x-auto min-w-[min-content] scrollbar-thin scrollbar-thumb-gray-400">
                <div className="min-w-fit px-2 py-1"> {/* extra padding if needed */}
                  {taskOptions.map((task) => (
                    <Listbox.Option
                      key={task.id}
                      value={task.id}
                      disabled={task.id === "select" || !task.is_assigned}
                      className={({ active, selected, disabled }) =>
                        `relative cursor-default select-none py-2.5 pr-12 flex items-center gap-1.5 ${
                          disabled
                            ? "text-gray-400 cursor-not-allowed"
                            : active
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-800"
                        } ${selected ? "font-medium" : ""}`
                      }
                      style={{
                        paddingLeft: `${task.depth * 20 + 12}px`, // 20px per level + base padding
                      }}
                    >
                      {({ selected }) => (
                        <>
                          {/* Indentation chevrons – still shown fully */}
                          {task.depth > 0 &&
                            Array.from({ length: task.depth }).map((_, i) => (
                              <ChevronRight
                                key={i}
                                size={14}
                                className="text-gray-400 shrink-0 opacity-70 absolute left-[12px]"
                                style={{ left: `${i * 20 + 12}px` }}
                              />
                            ))}

                          {/* Task name – full, no truncate */}
                          <span
                            className={`
                              whitespace-nowrap
                              ${selected
                                ? "font-semibold text-indigo-700"
                                : task.is_assigned
                                ? "text-gray-900"
                                : "text-gray-500 italic"}
                            `}
                            title={task.name}
                          >
                            {task.name}
                          </span>

                          {selected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 pointer-events-none">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </div>
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}