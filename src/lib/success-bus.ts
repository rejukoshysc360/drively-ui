import mitt from "mitt";

type Events = {
  success: { message: string; type?: "success"; raw?: unknown };
};

export const successBus = mitt<Events>();

let lastSuccessTime = 0;
let lastSuccessMessage = "";

/**
 * Emit a success event with optional type and raw data.
 * Works like emitApiError — prevents duplicates within 3 seconds.
 */
export function emitSuccess(e: { message: string; type?: "success"; raw?: unknown }) {
  const now = Date.now();

  // Prevent duplicate messages within 3 seconds
  if (e.message === lastSuccessMessage && now - lastSuccessTime < 3000) {
    return;
  }

  lastSuccessMessage = e.message;
  lastSuccessTime = now;

  const payload = {
    message: e.message || "Success",
    type: e.type || "success",
    raw: e.raw,
  };

  successBus.emit("success", payload);
}
