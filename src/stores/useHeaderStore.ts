import React from 'react';
import { create } from 'zustand';

interface HeaderStore {
  title: string | null;
  actions: React.ReactNode | null;
  setTitle: (title: string | null) => void;
  setActions: (actions: React.ReactNode | null) => void;
}

export const useHeaderStore = create<HeaderStore>((set) => ({
  title: null,
  actions: null,
  setTitle: (title) => set({ title }),
  setActions: (actions) => set({ actions }),
}));
