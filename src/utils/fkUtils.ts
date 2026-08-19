/**
 * Extracts the related table name from a Postgres FK violation message.
 *
 * Example input:
 *   update or delete on table "projects" violates foreign key constraint "invoices_project_id_fkey" on table "invoices"
 *
 * Returns:
 *   "invoices"
 */
export function getRelatedTableFromMessage(msg: string): string {
  if (!msg) return 'related records';

  // Match the last: on table "invoices"
  const match = msg.match(/on table\s+"(\w+)"/g);
  if (!match) return 'related records';

  const last = match[match.length - 1];
  const table = last.match(/"(\w+)"/)?.[1];
  return table ?? 'related records';
}

/**
 * Optionally: provide a friendly label for UI
 */
export function getFriendlyTableName(table: string): string {
  const friendlyMap: Record<string, string> = {
    invoices: 'invoices',
    tasks: 'tasks',
    employees: 'employees',
    assignments: 'employee assignments',
  };
  return friendlyMap[table] ?? table.replace(/_/g, ' ');
}
