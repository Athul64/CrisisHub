"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: { icon: "#22c55e", border: "rgba(34, 197, 94, 0.3)", bar: "#22c55e" },
  error: { icon: "#ef4444", border: "rgba(239, 68, 68, 0.3)", bar: "#ef4444" },
  warning: { icon: "#f59e0b", border: "rgba(245, 158, 11, 0.3)", bar: "#f59e0b" },
  info: { icon: "#3b82f6", border: "rgba(59, 130, 246, 0.3)", bar: "#3b82f6" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = toast.duration ?? 5000;

      setToasts((prev) => [...prev, { ...toast, id, duration }]);

      timersRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        style={{ maxWidth: "380px", width: "100%" }}
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          const colors = colorMap[toast.type];

          return (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-xl px-4 py-3 shadow-xl flex items-start gap-3 relative overflow-hidden"
              style={{
                background: "var(--toast-bg)",
                border: `1px solid var(--toast-border)`,
                boxShadow: `0 8px 30px var(--toast-shadow), 0 0 0 1px ${colors.border}`,
                animation: "toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)",
              }}
              role="alert"
            >
              <Icon
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: colors.icon }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {toast.title}
                </p>
                {toast.message && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded-md transition-colors hover:bg-red-500/10 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>

              {/* Progress bar */}
              <div
                className="absolute bottom-0 left-0 h-[3px] rounded-b-xl"
                style={{
                  background: colors.bar,
                  animation: `toast-progress ${toast.duration ?? 5000}ms linear forwards`,
                }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
