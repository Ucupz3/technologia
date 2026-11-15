import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-brand-border bg-brand-secondary/95 backdrop-blur-md text-brand-text max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isSuccess
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : isError
          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
          : 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30'
      }`}>
        {isSuccess ? <CheckCircle2 size={16} /> : isError ? <AlertCircle size={16} /> : <Info size={16} />}
      </div>
      <span className="text-sm font-medium flex-1 text-brand-text leading-snug">
        {toast.message}
      </span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-brand-text-muted hover:text-brand-text transition p-1 -mr-1 rounded-lg hover:bg-brand-muted shrink-0"
          title="Tutup notifikasi"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

