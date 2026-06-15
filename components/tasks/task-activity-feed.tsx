'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
    PRIORITY_LABELS,
    STATUS_LABELS,
    fullName,
    formatDate,
} from '@/lib/task-ui';
import type { TaskActivity, TaskPriority, TaskStatus } from '@/lib/types';

const ACTION_LABEL: Record<string, string> = {
    CREATED: 'created the task',
    UPDATED: 'updated the task',
    STATUS_CHANGED: 'changed status',
    ASSIGNED: 'changed the assignee',
    COMPLETED: 'completed the task',
    REOPENED: 'reopened the task',
    DELETED: 'deleted the task',
};

const FIELD_LABEL: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    dueDate: 'Due date',
    assigneeId: 'Assignee',
};

function fmtValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (field === 'status') return STATUS_LABELS[value as TaskStatus] ?? String(value);
    if (field === 'priority')
        return PRIORITY_LABELS[value as TaskPriority] ?? String(value);
    if (field === 'dueDate') return formatDate(String(value));
    if (field === 'assigneeId') return 'someone';
    const s = String(value);
    return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

function timeOf(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export function TaskActivityFeed({ taskId, open }: { taskId: string; open: boolean }) {
    const [items, setItems] = useState<TaskActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        api.get<TaskActivity[]>(`/tasks/${taskId}/activity`)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [taskId, open]);

    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                No activity yet.
            </p>
        );
    }

    return (
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((a) => {
                const actor = fullName(a.actorFirstName, a.actorLastName, 'System');
                const diffs = Object.entries(a.changes ?? {});
                return (
                    <li key={a.id} className="border-l-2 border-muted pl-3 text-sm">
                        <p>
                            <span className="font-medium">{actor}</span>{' '}
                            <span className="text-muted-foreground">
                                {ACTION_LABEL[a.action] ?? a.action.toLowerCase()}
                            </span>
                        </p>
                        {diffs.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                {diffs.map(([field, v]) => (
                                    <li key={field}>
                                        {FIELD_LABEL[field] ?? field}:{' '}
                                        <span className="line-through">
                                            {fmtValue(field, v.from)}
                                        </span>{' '}
                                        → {fmtValue(field, v.to)}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {timeOf(a.createdAt)}
                        </p>
                    </li>
                );
            })}
        </ul>
    );
}
