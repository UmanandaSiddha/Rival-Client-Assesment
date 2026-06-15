import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Paginated, Task, TaskStatus } from '@/lib/types';

export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'updatedAt';
export type StatusFilter = TaskStatus | 'ALL';

export interface TaskQuery {
    status: StatusFilter;
    search: string;
    sort: SortField;
    order: 'asc' | 'desc';
    page: number;
    limit: number;
}

const DEFAULT_QUERY: TaskQuery = {
    status: 'ALL',
    search: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 50,
};

interface TaskState {
    teamId: string | null;
    tasks: Task[];
    total: number;
    totalPages: number;
    loading: boolean;
    error: string | null;
    query: TaskQuery;
    setTeam: (teamId: string | null) => void;
    setQuery: (partial: Partial<TaskQuery>) => void;
    fetch: () => Promise<void>;
    upsert: (task: Task) => void;
    removeLocal: (id: string) => void;
    // Authoritative summary from the attachments panel (acting user).
    setAttachmentSummary: (id: string, count: number, previews: string[]) => void;
    // Relative nudge from realtime events (other users).
    bumpAttachment: (id: string, delta: number, previewUrl?: string | null) => void;
}

const MAX_PREVIEWS = 3;

export const useTasks = create<TaskState>((set, get) => ({
    teamId: null,
    tasks: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    query: DEFAULT_QUERY,

    setTeam: (teamId) => set({ teamId, query: { ...DEFAULT_QUERY } }),

    // Filter/sort changes reset to page 1; an explicit page change is respected.
    setQuery: (partial) =>
        set((s) => ({
            query: {
                ...s.query,
                ...partial,
                page: partial.page ?? 1,
            },
        })),

    fetch: async () => {
        const { teamId, query } = get();
        if (!teamId) {
            set({ tasks: [], total: 0, totalPages: 0 });
            return;
        }
        set({ loading: true, error: null });
        try {
            const params = new URLSearchParams({ teamId });
            if (query.status !== 'ALL') params.set('status', query.status);
            if (query.search.trim()) params.set('search', query.search.trim());
            params.set('sort', query.sort);
            params.set('order', query.order);
            params.set('page', String(query.page));
            params.set('limit', String(query.limit));

            const res = await api.get<Paginated<Task>>(`/tasks?${params}`);
            set({
                tasks: res.data,
                total: res.total,
                totalPages: res.totalPages,
                loading: false,
            });
        } catch (err) {
            set({
                loading: false,
                error: err instanceof Error ? err.message : 'Failed to load tasks',
            });
        }
    },

    upsert: (task) =>
        set((s) => {
            if (s.teamId && task.teamId !== s.teamId) return s;
            const exists = s.tasks.some((t) => t.id === task.id);
            return {
                // Merge so a write/realtime task payload (which omits the attachment summary)
                // doesn't wipe the thumbnails already on the card.
                tasks: exists
                    ? s.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t))
                    : [task, ...s.tasks],
            };
        }),

    removeLocal: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

    setAttachmentSummary: (id, count, previews) =>
        set((s) => ({
            tasks: s.tasks.map((t) =>
                t.id === id
                    ? { ...t, attachmentCount: count, attachmentPreviews: previews }
                    : t,
            ),
        })),

    bumpAttachment: (id, delta, previewUrl) =>
        set((s) => ({
            tasks: s.tasks.map((t) => {
                if (t.id !== id) return t;
                const count = Math.max(0, (t.attachmentCount ?? 0) + delta);
                let previews = t.attachmentPreviews ?? [];
                if (delta > 0 && previewUrl) {
                    previews = [previewUrl, ...previews].slice(0, MAX_PREVIEWS);
                } else if (delta < 0) {
                    previews = previews.slice(0, count); // never show more thumbs than exist
                }
                return { ...t, attachmentCount: count, attachmentPreviews: previews };
            }),
        })),
}));
