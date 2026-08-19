import { APP_CONFIG } from "../config/appConfig";

export function getReasonLabel(value?: string): string {
  if (!value) return "—";
  const reason = APP_CONFIG.FINAL_SETTLEMENT.REASON_OPTIONS.find(
    (r) => r.value === value
  );
  return reason?.label || value;
}
