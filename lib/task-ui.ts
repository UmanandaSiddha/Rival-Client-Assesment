import type { TaskPriority, TaskStatus } from '@/lib/types';

export const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const STATUS_LABELS: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
};

export const PRIORITY_ORDER: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
};

// Functional color (always paired with a text label, never color-only).
export const PRIORITY_BADGE: Record<TaskPriority, string> = {
    LOW: 'bg-muted text-muted-foreground',
    MEDIUM: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    HIGH: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    URGENT: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function formatDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric',
    });
}

export function isOverdue(iso?: string | null, status?: TaskStatus): boolean {
    if (!iso || status === 'DONE') return false;
    return new Date(iso) < new Date();
}

export function fullName(
    first?: string | null,
    last?: string | null,
    fallback = '',
): string {
    return [first, last].filter(Boolean).join(' ') || fallback;
}

export function initialsOf(
    first?: string | null,
    last?: string | null,
    email?: string | null,
): string {
    return (
        `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() ||
        email?.[0]?.toUpperCase() ||
        '?'
    );
}
