'use client';

import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/task-ui';
import { cn } from '@/lib/utils';
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

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id });
    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn('touch-none', isDragging && 'opacity-50')}
        >
            {children}
        </div>
    );
}

function Column({
    status,
    count,
    children,
}: {
    status: TaskStatus;
    count: number;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {count}
                </span>
            </div>
            <div
                ref={setNodeRef}
                className={cn(
                    'flex min-h-24 flex-col gap-2 rounded-lg bg-muted/40 p-2 transition-colors',
                    isOver && 'bg-accent/60 ring-2 ring-primary/40',
                )}
            >
                {children}
            </div>
        </div>
    );
}

export function TaskBoard({ tasks, members, onStatusChange, ...handlers }: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;
        const task = tasks.find((t) => t.id === active.id);
        const status = over.id as TaskStatus;
        if (task && task.status !== status) onStatusChange(task, status);
    }

    return (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {STATUS_ORDER.map((status) => {
                    const column = tasks.filter((t) => t.status === status);
                    return (
                        <Column key={status} status={status} count={column.length}>
                            {column.length === 0 ? (
                                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                                    Drop tasks here
                                </p>
                            ) : (
                                column.map((task) => (
                                    <DraggableCard key={task.id} id={task.id}>
                                        <TaskCard
                                            task={task}
                                            assignee={
                                                task.assigneeId
                                                    ? members[task.assigneeId]
                                                    : undefined
                                            }
                                            onStatusChange={onStatusChange}
                                            {...handlers}
                                        />
                                    </DraggableCard>
                                ))
                            )}
                        </Column>
                    );
                })}
            </div>
        </DndContext>
    );
}
