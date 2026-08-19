import { useEffect, useState } from 'react';
import { errorBus } from '../lib/error-bus';

type Toast = { id: number; message: string; status?: number };
export default function GlobalErrorToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let idCounter = 1;
    const handler = ({ message, status }: { message: string; status?: number }) => {
      const id = idCounter++;
      setToasts((t) => [...t, { id, message, status }]);
      // auto-dismiss
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    };
    errorBus.on('api-error', handler);
    return () => errorBus.off('api-error', handler);
  }, []);

  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          minWidth: 260, maxWidth: 420, padding: '12px 14px',
          background: '#1f2937', color: 'white', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,.2)'
        }}>
          <div style={{ fontSize: 12, opacity: .8, marginBottom: 4 }}>
            {t.status ? `Error ${t.status}` : 'Error'}
          </div>
          <div style={{ fontSize: 14 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}
