import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';
export type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms
};

type UIState = {
  toasts: Toast[];
  showToast: (t: Omit<Toast, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

export const useUI = create<UIState>((set, get) => ({
  toasts: [],
  showToast(toast) {
    const id = toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { duration: 3500, ...toast, id };
    set((s) => ({ toasts: [...s.toasts, t] }));
    if (t.duration && t.duration > 0) {
      setTimeout(() => {
        const exists = get().toasts.some((x) => x.id === id);
        if (exists) get().dismissToast(id);
      }, t.duration);
    }
    return id;
  },
  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  clearToasts() {
    set({ toasts: [] });
  },
}));

// Helper for non-component usage
export const toast = Object.assign(
  (opts: Omit<Toast, 'id'> & { id?: string }) => useUI.getState().showToast(opts),
  {
    success(message: string, title = 'Success') {
      return useUI.getState().showToast({ type: 'success', title, message });
    },
    error(message: string, title = 'Error') {
      return useUI.getState().showToast({ type: 'error', title, message });
    },
    info(message: string, title = 'Info') {
      return useUI.getState().showToast({ type: 'info', title, message });
    },
    dismiss(id: string) {
      return useUI.getState().dismissToast(id);
    },
    clear() {
      return useUI.getState().clearToasts();
    },
  }
);

