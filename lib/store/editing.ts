import { create } from 'zustand';

export interface EditLock {
    userId: string;
    firstName?: string;
    lastName?: string;
}

export interface LiveDraft {
    title?: string;
    description?: string;
}

interface EditingState {
    // taskId -> who is currently editing it
    locks: Record<string, EditLock>;
    // taskId -> their in-progress (unsaved) draft, streamed live
    drafts: Record<string, LiveDraft>;
    setLock: (taskId: string, lock: EditLock) => void;
    clearLock: (taskId: string) => void;
    setDraft: (taskId: string, draft: LiveDraft) => void;
    reset: () => void;
}

export const useEditing = create<EditingState>((set) => ({
    locks: {},
    drafts: {},
    setLock: (taskId, lock) =>
        set((s) => ({ locks: { ...s.locks, [taskId]: lock } })),
    clearLock: (taskId) =>
        set((s) => {
            const locks = { ...s.locks };
            const drafts = { ...s.drafts };
            delete locks[taskId];
            delete drafts[taskId];
            return { locks, drafts };
        }),
    setDraft: (taskId, draft) =>
        set((s) => ({ drafts: { ...s.drafts, [taskId]: draft } })),
    reset: () => set({ locks: {}, drafts: {} }),
}));
