import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "250px",
        animation: "slideIn 0.3s ease-out forwards",
        marginBottom: "10px",
        position: "relative",
      }}
    >
      {icons[toast.type]}
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", flex: 1 }}>
        {toast.message}
      </span>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
