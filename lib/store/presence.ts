import { create } from 'zustand';

interface PresenceState {
    online: string[];
    setSnapshot: (ids: string[]) => void;
    add: (id: string) => void;
    remove: (id: string) => void;
    reset: () => void;
}

export const usePresence = create<PresenceState>((set) => ({
    online: [],
    setSnapshot: (ids) => set({ online: Array.from(new Set(ids)) }),
    add: (id) =>
        set((s) => (s.online.includes(id) ? s : { online: [...s.online, id] })),
    remove: (id) => set((s) => ({ online: s.online.filter((x) => x !== id) })),
    reset: () => set({ online: [] }),
}));
