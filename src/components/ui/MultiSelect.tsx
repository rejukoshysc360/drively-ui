// components/MultiSelect.tsx
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

const ALL = "__ALL__";

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  label: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  /**
   * If true, includes an "All [label]" option that selects/deselects everything.
   * If false, behaves as normal multi-select without "All".
   */
  includeAllOption?: boolean;
  /**
   * If true, selecting "All" and individual options are mutually exclusive
   * (like your original Projects filter: "All Projects" OR specific ones)
   */
  allIsExclusive?: boolean;
  height?: string;
};

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  includeAllOption = true,
  allIsExclusive = false,
  height = "h-[220px]",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (val === ALL) {
      // Toggle "All"
      if (value.includes(ALL)) {
        // Deselect All → go to empty (or individual if not exclusive)
        onChange([]);
      } else {
        // Select All
        if (allIsExclusive) {
          onChange([ALL]); // Exclusive: only "All"
        } else {
          onChange(options.map((o) => o.value)); // Select every individual
        }
      }
    } else {
      // Individual option
      let newValue: string[];

      if (value.includes(val)) {
        newValue = value.filter((v) => v !== val);
      } else {
        newValue = [...value, val];
      }

      // If exclusive mode and we just selected an individual → remove "All"
      if (allIsExclusive && value.includes(ALL)) {
        newValue = newValue.filter((v) => v !== ALL);
      }

      // If all individuals are now selected and not exclusive → optionally select "All" too
      // (we don't auto-select "All" in exclusive mode)
      if (!allIsExclusive && newValue.length === options.length) {
        newValue = [...newValue, ALL];
      }

      onChange(newValue);
    }
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  const isAllSelected = value.includes(ALL);
  const selectedCount = value.filter((v) => v !== ALL).length;

  const displayText =
    value.length === 0
      ? "None selected"
      : isAllSelected && allIsExclusive
        ? `All ${label.toLowerCase()}` // ← FIXED: dynamic!
        : selectedCount === options.length && selectedCount > 0
          ? `All ${label.toLowerCase()} selected`
          : selectedCount > 3
            ? `${selectedCount} selected`
            : options
                .filter((o) => value.includes(o.value) && o.value !== ALL)
                .map((o) => o.label)
                .join(", ");

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs text-gray-500 block mb-1">{label}</label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 border border-gray-300 rounded-md bg-white text-left text-sm flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      >
        <span className="truncate text-gray-700">{displayText}</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearch("");
            }}
          />

          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className={`relative overflow-y-auto ${height}`}>
              <div className="sticky top-0 z-20 bg-white border-b px-2 py-2 shadow-sm">
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <ul className="pt-1">
                {/* "All" option — only shown if enabled */}
                {includeAllOption && (
                  <li
                    onClick={() => toggleOption(ALL)}
                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-start gap-3 text-sm font-medium min-w-0"
                  >
                    <div
                      className={`w-4 h-4 border-2 rounded flex items-center justify-center transition ${
                        isAllSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-gray-400 bg-white"
                      }`}
                    >
                      {isAllSelected && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <span className="break-all whitespace-normal min-w-0 flex-1">
                      All {label.toLowerCase()}
                    </span>
                  </li>
                )}

                {/* Individual options */}
                {filteredOptions.map((opt) => {
                  const checked = value.includes(opt.value);
                  return (
                    <li
                      key={opt.value}
                      onClick={() => toggleOption(opt.value)}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-start gap-3 text-sm min-w-0"
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 shrink-0 border-2 rounded flex items-center justify-center transition ${
                          checked
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {checked && <Check size={12} className="text-white" />}
                      </div>

                      <span className="break-all whitespace-normal leading-snug min-w-0 flex-1">
                        {opt.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
