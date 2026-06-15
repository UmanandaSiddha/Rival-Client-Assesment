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
}

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
                tasks: exists
                    ? s.tasks.map((t) => (t.id === task.id ? task : t))
                    : [task, ...s.tasks],
            };
        }),

    removeLocal: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
}));
