export interface LeaveEmployee {
  is_half_day?: boolean;
  half_day_type?: string | null;
  start_date?: string;
  end_date?: string;
}

/**
 * Returns leave duration label + Tailwind classes
 * based on employee leave data.
 */
export function getLeaveBadge(emp: LeaveEmployee): {
  label: string;
  className: string;
} {
  // Half-day leave
  if (emp.is_half_day) {
    const session =
      emp.half_day_type?.toLowerCase() === "morning"
        ? "Morning"
        : emp.half_day_type?.toLowerCase() === "afternoon"
        ? "Afternoon"
        : null;

    return {
      label: session ? `Half Day (${session})` : "Half Day (0.5)",
      className: "bg-amber-100 text-amber-700",
    };
  }

  // Multi-day leave
  if (emp.start_date && emp.end_date && emp.start_date !== emp.end_date) {
    return {
      label: "Multi-day",
      className: "bg-blue-100 text-blue-700",
    };
  }

  // Default: Full-day leave
  return {
    label: "Full Day",
    className: "bg-green-100 text-green-700",
  };
}
