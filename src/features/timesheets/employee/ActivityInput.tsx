import { useState, useEffect } from "react";
import { useActivitySuggestions } from "../hooks";

/* ----------------------------------
   🔧 Debounce Hook (local)
---------------------------------- */
function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

/* ----------------------------------
   🧩 Activity Input Component
---------------------------------- */
type Props = {
  value: string;
  projectId?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function ActivityInput({
  value,
  projectId,
  onChange,
  disabled,
}: Props) {
  const [input, setInput] = useState(value || "");
  const [show, setShow] = useState(false);

  const debounced = useDebounce(input, 300);

  const {
    data: suggestions = [],
    isLoading,
  } = useActivitySuggestions(debounced, projectId);

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  return (
    <div className="relative w-full overflow-visible">
      <input
        type="text"
        value={input}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          setInput(val);
          onChange(val);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder="Describe activity..."
        className="border rounded-lg px-3 py-2.5 text-sm w-full shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
      />

      {/* Suggestions dropdown */}
      {show && debounced.length >= 2 && (
      <div className="absolute left-0 top-full mt-1 w-full z-[9999] bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-auto text-sm">
          {isLoading && (
            <div className="px-3 py-2 text-gray-400 italic">
              Loading...
            </div>
          )}

          {!isLoading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-gray-400 italic">
              No suggestions
            </div>
          )}

          {!isLoading &&
            suggestions.map((s: string, idx: number) => (
              <div
                key={idx}
                onClick={() => {
                  setInput(s);
                  onChange(s);
                  setShow(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShow(false);
                  }
                }}
                className="px-3 py-2 cursor-pointer hover:bg-indigo-50"
              >
                {s}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}