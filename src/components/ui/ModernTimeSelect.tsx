import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { Fragment } from "react";

const times = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  const date = new Date(0, 0, 0, hour, minutes === "30" ? 30 : 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
});

export default function ModernTimeSelect({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative min-w-[8rem] text-left">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          {/* Button */}
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 text-left 
              shadow-sm transition-all duration-150
              ${
                disabled
                  ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500"
                  : "hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
          >
            <span className="block truncate">{value || label}</span>
            <ChevronDown
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
          </Listbox.Button>

          {/* Dropdown */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg bg-white 
                         py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              {times.map((time, idx) => (
                <Listbox.Option
                  key={idx}
                  value={time}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-9 pr-4 ${
                      active ? "bg-indigo-50 text-indigo-700" : "text-gray-800"
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block ${
                          selected ? "font-medium text-indigo-700" : "font-normal"
                        }`}
                      >
                        {time}
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
