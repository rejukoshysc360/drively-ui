import React from "react";
import {
  AlertTriangle,
  Circle,
  ArrowDownCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from "lucide-react";

export const PriorityBadge: React.FC<{ priority?: "low" | "medium" | "high" }> = ({ priority }) => {
  if (!priority) return null;
  const map = {
    high: { icon: AlertTriangle, className: "text-red-500", label: "H" },
    medium: { icon: Circle, className: "text-amber-500", label: "M" },
    low: { icon: ArrowDownCircle, className: "text-green-500", label: "L" },
  } as const;
  const cfg = map[priority];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border">
      <Icon size={14} className={cfg.className} />
      {cfg.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  const normalized = status.toLowerCase();
  const map: Record<string, any> = {
    todo: { color: "text-gray-500", label: "Todo", icon: Circle },
    in_progress: { color: "text-blue-500", label: "In Progress", icon: PauseCircle },
    done: { color: "text-green-600", label: "Done", icon: CheckCircle2 },
    blocked: { color: "text-red-500", label: "Blocked", icon: XCircle },
    draft: { color: "text-gray-400", label: "Draft", icon: Circle },
    submitted: { color: "text-amber-500", label: "Submitted", icon: PauseCircle },
    approved: { color: "text-green-600", label: "Approved", icon: CheckCircle2 },
    rejected: { color: "text-red-500", label: "Rejected", icon: XCircle },
  };
  const cfg = map[normalized];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border">
      <Icon size={14} className={cfg.color} />
      {cfg.label}
    </span>
  );
};