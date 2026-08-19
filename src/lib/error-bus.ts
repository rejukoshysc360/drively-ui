import mitt from 'mitt';

type Events = {
  'api-error': { message: string; status?: number; raw?: unknown };
};
export const errorBus = mitt<Events>();

let lastErrorTime = 0;
let lastErrorMessage = "";

export function emitApiError(e: { message: string; status?: number; raw?: unknown }) {
  const now = Date.now();
  if (e.message === lastErrorMessage && now - lastErrorTime < 3000) {
    return; // ignore duplicate within 3 seconds
  }
  lastErrorMessage = e.message;
  lastErrorTime = now;
  errorBus.emit("api-error", e);
}
