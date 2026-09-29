import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const inputCls =
  'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50';
export const labelCls = 'block text-[11px] font-semibold text-slate-400 mb-1';

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'success';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-amber-500 hover:bg-amber-400 text-onyx font-bold',
  ghost: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold',
  danger: 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold',
  success: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold',
};

export function Button({
  variant = 'ghost',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnVariants[variant]} ${className}`}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  side = false,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
  /** Slide-over drawer on the right instead of a centred dialog */
  side?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex ${side ? 'justify-end' : 'items-start justify-center p-4 overflow-y-auto'}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={
          side
            ? 'w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col'
            : `w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl`
        }
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <h3 className="text-base font-serif font-semibold text-slate-50 truncate">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-50" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className={side ? 'flex-1 overflow-y-auto p-5' : 'p-5'}>{children}</div>
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs" role="alert">
      {message}
    </div>
  );
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ISO → value for <input type="datetime-local"> in the viewer's timezone */
export function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const waLink = (phone: string, text?: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
