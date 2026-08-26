// Tiny toast/notification store — no external deps.
import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = { id: number; kind: ToastKind; message: string };

let counter = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, kind: ToastKind = 'info') {
  const id = ++counter;
  toasts = [...toasts, { id, kind, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3800);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts(): Toast[] {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    const l = (t: Toast[]) => setList(t);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return list;
}
