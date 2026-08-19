import mitt from "mitt";

type Events = {
  info: string;
};

export const infoBus = mitt<Events>();

export function emitInfo(message: string) {
  infoBus.emit("info", message);
}
