// components/ui/Portal.tsx
import { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  return typeof document === "object" ? createPortal(children, document.body) : null;
}