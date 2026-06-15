'use client';

import { STATUS_LABELS, STATUS_ORDER } from '@/lib/task-ui';
import type { Task, TaskStatus } from '@/lib/types';
import { TaskCard, type MemberInfo } from './task-card';

interface Props {
    tasks: Task[];
    members: Record<string, MemberInfo>;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onStatusChange: (task: Task, status: TaskStatus) => void;
    onToggleComplete: (task: Task) => void;
}

export function TaskBoard({ tasks, members, ...handlers }: Props) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STATUS_ORDER.map((status) => {
                const column = tasks.filter((t) => t.status === status);
                return (
                    <div key={status} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-semibold">
                                {STATUS_LABELS[status]}
                            </h2>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                {column.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2 min-h-24">
                            {column.length === 0 ? (
                                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                                    No tasks
                                </p>
                            ) : (
                                column.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        assignee={
                                            task.assigneeId
                                                ? members[task.assigneeId]
                                                : undefined
                                        }
                                        {...handlers}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
