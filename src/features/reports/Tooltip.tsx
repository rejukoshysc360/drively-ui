// src/components/Tooltip.tsx
import React, { useState, useRef } from "react";

interface TooltipProps {
  text: string;
}

export default function Tooltip({ text }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  return (
    <span
      ref={ref}
      className="relative inline-block ml-1 text-gray-400 align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      aria-label={text}
    >
      ⓘ
      {open && (
        <span
          className="absolute z-10 left-1/2 -translate-x-1/2 top-5 max-w-[300px] whitespace-normal word-break-break-word rounded-md border bg-white px-2 py-1 text-xs text-gray-700 shadow"
        >
          {text}
        </span>
      )}
    </span>
  );
}