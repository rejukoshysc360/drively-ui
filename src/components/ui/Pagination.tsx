type Props = { total: number; page: number; limit: number; onChange: (p: number) => void; };
export default function Pagination({ total, page, limit, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
      <div className="space-x-2">
        <button className="btn" onClick={() => onChange(1)} disabled={page === 1}>First</button>
        <button className="btn" onClick={() => onChange(page - 1)} disabled={page === 1}>Prev</button>
        <button className="btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next</button>
        <button className="btn" onClick={() => onChange(totalPages)} disabled={page >= totalPages}>Last</button>
      </div>
    </div>
  );
}
