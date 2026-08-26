import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { dismissToast, useToasts, type ToastKind } from '@/lib/toast';

const iconFor: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const colorFor: Record<ToastKind, string> = {
  success: 'border-risk-safe/40 text-risk-safe',
  error: 'border-risk-high/40 text-risk-high',
  info: 'border-gold-400/40 text-gold-300',
};

export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,90vw)]">
      {toasts.map((t) => {
        const Icon = iconFor[t.kind];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-lg border bg-razor-card/95 px-4 py-3 shadow-card backdrop-blur animate-slideIn ${colorFor[t.kind]}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm text-razor-text">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-razor-muted hover:text-razor-text transition-colors"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
