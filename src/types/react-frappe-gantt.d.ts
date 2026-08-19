declare module 'react-frappe-gantt' {
  import React from 'react';

  export type Task = {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
  };

  interface GanttProps {
    tasks: Task[];
    viewMode?: 'Day' | 'Week' | 'Month';
    onClick?: (task: Task) => void;
    onDateChange?: (task: Task, start: Date, end: Date) => void;
    onProgressChange?: (task: Task, progress: number) => void;
    onTasksChange?: (tasks: Task[]) => void;
  }

  export default function ReactFrappeGantt(props: GanttProps): JSX.Element;
}
