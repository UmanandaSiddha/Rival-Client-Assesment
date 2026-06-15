'use client';

import {
    DotsThree,
    PencilSimple,
    Trash,
    CalendarBlank,
    ArrowRight,
} from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    PRIORITY_BADGE,
    PRIORITY_LABELS,
    STATUS_LABELS,
    STATUS_ORDER,
    formatDate,
    isOverdue,
} from '@/lib/task-ui';
import type { Task, TaskStatus } from '@/lib/types';

export interface MemberInfo {
    name: string;
    initials: string;
}

interface Props {
    task: Task;
    assignee?: MemberInfo;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onStatusChange: (task: Task, status: TaskStatus) => void;
    onToggleComplete: (task: Task) => void;
}

export function TaskCard({
    task,
    assignee,
    onEdit,
    onDelete,
    onStatusChange,
    onToggleComplete,
}: Props) {
    const done = task.status === 'DONE';
    const overdue = isOverdue(task.dueDate, task.status);

    return (
        <div className="group rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-foreground/20">
            <div className="flex items-start gap-2">
                <Checkbox
                    checked={done}
                    onCheckedChange={() => onToggleComplete(task)}
                    className="mt-0.5"
                    aria-label="Toggle complete"
                />
                <button
                    onClick={() => onEdit(task)}
                    className={cn(
                        'flex-1 text-left text-sm font-medium leading-snug',
                        done && 'text-muted-foreground line-through',
                    )}
                >
                    {task.title}
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100">
                        <DotsThree className="size-5" weight="bold" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2">
                            <PencilSimple className="size-4" /> Edit
                        </DropdownMenuItem>
                        {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
                            <DropdownMenuItem
                                key={s}
                                onClick={() => onStatusChange(task, s)}
                                className="gap-2"
                            >
                                <ArrowRight className="size-4" /> Move to{' '}
                                {STATUS_LABELS[s]}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(task)}
                            variant="destructive"
                            className="gap-2"
                        >
                            <Trash className="size-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                    variant="secondary"
                    className={cn('font-normal', PRIORITY_BADGE[task.priority])}
                >
                    {PRIORITY_LABELS[task.priority]}
                </Badge>
                {task.dueDate && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 text-xs text-muted-foreground',
                            overdue && 'text-red-600 dark:text-red-400',
                        )}
                    >
                        <CalendarBlank className="size-3.5" />
                        {formatDate(task.dueDate)}
                    </span>
                )}
                {assignee && (
                    <Avatar className="ml-auto size-6" title={assignee.name}>
                        <AvatarFallback className="text-[10px]">
                            {assignee.initials}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
        </div>
    );
}
