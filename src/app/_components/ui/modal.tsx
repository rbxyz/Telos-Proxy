"use client";

export function Modal({ open, title, children, onClose, onConfirm }: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded bg-white p-4 shadow">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <div className="mb-4 text-sm text-gray-700">{children}</div>
        <div className="flex justify-end gap-2">
          <button className="rounded border px-3 py-1.5 text-sm" onClick={onClose}>Cancelar</button>
          {onConfirm && (
            <button className="rounded bg-red-600 px-3 py-1.5 text-sm text-white" onClick={onConfirm}>
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

