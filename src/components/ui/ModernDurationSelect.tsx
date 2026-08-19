import { Listbox, Transition, Portal } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import {
  Fragment,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";
import { useOrganization } from "../../features/organizations/settings/preferences/hooks";

export default function ModernDurationSelect({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const { data: org } = useOrganization();

  const settings = org?.working_time_settings || {};
  const dailyHours = settings.ORG_DAILY_HOURS ?? 9;
  const overtimeLimit = settings.ORG_OVERTIME_LIMIT ?? 0;
  const enableOvertime = settings.ENABLE_OVERTIME ?? false;
  const maxHours = enableOvertime ? dailyHours + overtimeLimit : dailyHours;

  const durations = useMemo(() => {
    const count = Math.round(maxHours / 0.25) + 1;
    return Array.from({ length: count }, (_, i) =>
      (i * 0.25).toFixed(2)
    ).reverse();
  }, [maxHours]);

  const stringValue = value ? value.toFixed(2) : "";

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [openUp, setOpenUp] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // 🔧 Update dropdown positioning dynamically
  useLayoutEffect(() => {
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setButtonRect(rect);
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 250; // approximate height
      setOpenUp(spaceBelow < dropdownHeight);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  // 🔄 Recompute when it opens
  useEffect(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setButtonRect(rect);
  }, [value]);

  return (
    <div className="relative min-w-[6rem] text-left">
      <Listbox
        value={stringValue}
        onChange={(v: string) => onChange(parseFloat(v))}
        disabled={disabled}
      >
        {({ open }) => (
          <>
            <Listbox.Button
              ref={buttonRef}
              className={`relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 text-left shadow-sm transition-all duration-150
                ${
                  disabled
                    ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500"
                    : "hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
            >
              <span className="block truncate">
                {value > 0 ? `${value.toFixed(2)} h` : "Hours"}
              </span>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </Listbox.Button>

            {open && buttonRect && (
 <Portal>
  <div
    style={{
      position: "fixed", // ✅ fixed avoids scroll/container offset issues
      left: buttonRect.left,
      top: openUp
        ? buttonRect.top - Math.min(durations.length * 32, 240) - 1 // ✅ dynamic upward positioning
        : buttonRect.bottom - 1, // ✅ 1px overlap removes visible gap
      width: buttonRect.width,
      zIndex: 9999,
    }}
  >
    <Transition
      as={Fragment}
      show={open}
      enter="transition ease-out duration-100"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-75"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <Listbox.Options
        className="rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm max-h-60 overflow-auto py-1"
      >
        {durations.map((h) => (
          <Listbox.Option
            key={h}
            value={h}
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
                  {h} h
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
</Portal>

            )}
          </>
        )}
      </Listbox>
    </div>
  );
}
