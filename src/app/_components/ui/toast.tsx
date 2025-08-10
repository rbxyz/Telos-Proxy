"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string };

type ToastContextValue = {
  toasts: Toast[];
  show: (message: string, ms?: number) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, ms: number = 2500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message }]);
    if (ms > 0) setTimeout(() => remove(id), ms);
  }, [remove]);

  const value = useMemo(() => ({ toasts, show, remove }), [toasts, show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded border border-gray-200 bg-white p-3 shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-gray-900">{t.message}</div>
              <button
                onClick={() => remove(t.id)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                fechar
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

