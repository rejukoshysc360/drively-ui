import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

export default function ModernProjectSelect({
  value,
  onChange,
  projects,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  projects: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filteredProjects = useMemo(() => {
    if (!query) return projects;
    return projects.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [projects, query]);

  return (
   <div className="relative w-full text-left">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 text-left shadow-sm transition-all duration-150
              ${
                disabled
                  ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500"
                  : "hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
          >
            <span className="block truncate">
              {projects.find((p) => p.id === value)?.name || "Select Project"}
            </span>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </Listbox.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            afterLeave={() => setQuery("")} // reset search
          >
<Listbox.Options className="absolute left-0 top-full z-[99999] mt-1 w-full rounded-lg bg-white shadow-xl border border-gray-200 focus:outline-none text-sm max-h-64 overflow-auto">
              
              {/* 🔍 Search Input */}
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Search project..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Options */}
              {filteredProjects.length === 0 && (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  No projects found
                </div>
              )}

              {filteredProjects.map((proj) => (
                <Listbox.Option
                  key={proj.id}
                  value={proj.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-9 pr-4 ${
                      active ? "bg-indigo-50 text-indigo-700" : "text-gray-800"
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium text-indigo-700" : "font-normal"
                        }`}
                      >
                        {proj.name}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-2 flex items-center text-indigo-600">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}