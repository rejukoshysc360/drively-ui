// Chart/utils.ts
export const idMap = (tasks: any[]) => {
  const m = new Map<string, any>();
  tasks.forEach((t) => m.set(t.id, t));
  return m;
};

export const getRootId = (tasks: any[], task: any) => {
  const map = idMap(tasks);
  let cur = task;
  const seen = new Set<string>();
  while (cur?.parentId) {
    if (seen.has(cur.parentId)) break;
    seen.add(cur.parentId);
    const next = map.get(cur.parentId);
    if (!next) break;
    cur = next;
  }
  return cur.id;
};

export function flattenHierarchy(tasks: any[]) {
  const roots = tasks.filter((t) => !t.parentId);
  const ordered: any[] = [];
  const visit = (task: any, level = 0) => {
    ordered.push({ ...task, _level: level });
    tasks
      .filter((t) => t.parentId === task.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .forEach((child) => visit(child, level + 1));
  };
  roots
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .forEach((r) => visit(r, 0));
  return ordered;
}
