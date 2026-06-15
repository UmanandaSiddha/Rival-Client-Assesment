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
import { PencilLine } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import {
    PRIORITY_BADGE,
    PRIORITY_LABELS,
    STATUS_LABELS,
    STATUS_ORDER,
    formatDate,
    fullName,
    isOverdue,
} from '@/lib/task-ui';
import { useAuth } from '@/lib/store/auth';
import { useEditing } from '@/lib/store/editing';
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

    const me = useAuth((s) => s.user?.id);
    const lock = useEditing((s) => s.locks[task.id]);
    const liveDraft = useEditing((s) => s.drafts[task.id]);
    const editedByOther = Boolean(lock && lock.userId !== me);
    const editorName = lock ? fullName(lock.firstName, lock.lastName, 'Someone') : '';
    // While another user edits, show their live (unsaved) title.
    const title =
        editedByOther && liveDraft?.title !== undefined && liveDraft.title !== ''
            ? liveDraft.title
            : task.title;

    return (
        <div
            className={cn(
                'group rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-foreground/20',
                editedByOther && 'ring-2 ring-amber-400/70',
            )}
        >
            {editedByOther && (
                <div className="mb-2 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <PencilLine className="size-3.5" />
                    {editorName} is editing…
                </div>
            )}
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
                    {title}
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
