declare module "frappe-gantt" {
  export interface GanttTask {
    id: string;
    name: string;
    start: string | Date;
    end: string | Date;
    progress?: number;
    dependencies?: string | string[];
  }

  export interface GanttOptions {
    viewMode?: "Day" | "Week" | "Month";
    onClick?: (task: GanttTask) => void;
    onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
    onProgressChange?: (task: GanttTask, progress: number) => void;
  }

  export default class Gantt {
    constructor(
      selector: string | HTMLElement,
      tasks: GanttTask[],
      options?: GanttOptions
    );
  }
}
