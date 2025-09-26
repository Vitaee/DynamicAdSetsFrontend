import { create } from 'zustand';

export type Crumb = { label: string; href?: string };

type NavState = {
  breadcrumbs: Crumb[] | null;
  setBreadcrumbs: (items: Crumb[]) => void;
  clearBreadcrumbs: () => void;
};

export const useNav = create<NavState>((set) => ({
  breadcrumbs: null,
  setBreadcrumbs: (items) => set({ breadcrumbs: items }),
  clearBreadcrumbs: () => set({ breadcrumbs: null }),
}));

