'use client';

import {
    DotsThree,
    PencilSimple,
    Trash,
    CalendarBlank,
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
    formatDate,
    isOverdue,
} from '@/lib/task-ui';
import type { Task, TaskStatus } from '@/lib/types';
import type { MemberInfo } from './task-card';

interface Props {
    tasks: Task[];
    members: Record<string, MemberInfo>;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onToggleComplete: (task: Task) => void;
}

const STATUS_BADGE: Record<TaskStatus, string> = {
    TODO: 'bg-muted text-muted-foreground',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    DONE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export function TaskList({
    tasks,
    members,
    onEdit,
    onDelete,
    onToggleComplete,
}: Props) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="w-10 p-3" />
                        <th className="p-3 font-medium">Task</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Priority</th>
                        <th className="hidden p-3 font-medium md:table-cell">Due</th>
                        <th className="hidden p-3 font-medium sm:table-cell">
                            Assignee
                        </th>
                        <th className="w-10 p-3" />
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => {
                        const done = task.status === 'DONE';
                        const overdue = isOverdue(task.dueDate, task.status);
                        const assignee = task.assigneeId
                            ? members[task.assigneeId]
                            : undefined;
                        return (
                            <tr
                                key={task.id}
                                className="border-b last:border-0 hover:bg-muted/30"
                            >
                                <td className="p-3">
                                    <Checkbox
                                        checked={done}
                                        onCheckedChange={() => onToggleComplete(task)}
                                        aria-label="Toggle complete"
                                    />
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => onEdit(task)}
                                        className={cn(
                                            'text-left font-medium',
                                            done &&
                                                'text-muted-foreground line-through',
                                        )}
                                    >
                                        {task.title}
                                    </button>
                                </td>
                                <td className="p-3">
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            'font-normal',
                                            STATUS_BADGE[task.status],
                                        )}
                                    >
                                        {STATUS_LABELS[task.status]}
                                    </Badge>
                                </td>
                                <td className="p-3">
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            'font-normal',
                                            PRIORITY_BADGE[task.priority],
                                        )}
                                    >
                                        {PRIORITY_LABELS[task.priority]}
                                    </Badge>
                                </td>
                                <td className="hidden p-3 md:table-cell">
                                    {task.dueDate ? (
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 text-muted-foreground',
                                                overdue &&
                                                    'text-red-600 dark:text-red-400',
                                            )}
                                        >
                                            <CalendarBlank className="size-3.5" />
                                            {formatDate(task.dueDate)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="hidden p-3 sm:table-cell">
                                    {assignee ? (
                                        <Avatar
                                            className="size-6"
                                            title={assignee.name}
                                        >
                                            <AvatarFallback className="text-[10px]">
                                                {assignee.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="text-muted-foreground">
                                            <DotsThree
                                                className="size-5"
                                                weight="bold"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => onEdit(task)}
                                                className="gap-2"
                                            >
                                                <PencilSimple className="size-4" />{' '}
                                                Edit
                                            </DropdownMenuItem>
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
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
