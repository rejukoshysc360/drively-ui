// src/components/GlobalSuccessToaster.tsx
import { useEffect, useState } from "react";
import { successBus } from "../lib/success-bus";

type Toast = { id: number; message: string };

export default function GlobalSuccessToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let idCounter = 1;
    const handler = ({ message }: { message: string }) => {
      const id = idCounter++;
      setToasts((t) => [...t, { id, message }]);
      // auto-dismiss
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    };
    successBus.on("success", handler);
    return () => successBus.off("success", handler);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 80, // stack above error toaster
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            minWidth: 260,
            maxWidth: 420,
            padding: "12px 14px",
            background: "#059669", // ✅ green for success
            color: "white",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Success</div>
          <div style={{ fontSize: 14 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}
