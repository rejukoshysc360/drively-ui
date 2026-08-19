// src/components/GlobalToaster.tsx
import { useEffect, useState } from "react";
import { errorBus } from "../lib/error-bus";
import { successBus } from "../lib/success-bus"; // ✅ create this like error-bus

type Toast = { id: number; type: "error" | "success"; message: string; status?: number };

export default function GlobalToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let idCounter = 1;

    const push = (t: Omit<Toast, "id">) => {
      const id = idCounter++;
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
    };

    const errHandler = ({ message, status }: { message: string; status?: number }) =>
      push({ type: "error", message, status });

    const successHandler = ({ message }: { message: string }) =>
      push({ type: "success", message });

    errorBus.on("api-error", errHandler);
    successBus.on("success", successHandler);

    return () => {
      errorBus.off("api-error", errHandler);
      successBus.off("success", successHandler);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 16, // ✅ no overlap with buttons
        right: 16,
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
            background: t.type === "error" ? "#1f2937" : "#059669",
            color: "white",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            {t.type === "error"
              ? t.status
                ? `Error ${t.status}`
                : "Error"
              : "Success"}
          </div>
          <div style={{ fontSize: 14 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}
