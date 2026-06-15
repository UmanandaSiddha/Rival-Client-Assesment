'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardText, Warning } from '@phosphor-icons/react';
import { api, ApiError } from '@/lib/api';
import { useTeams } from '@/lib/store/team';
import { useTasks } from '@/lib/store/tasks';
import { fullName, initialsOf } from '@/lib/task-ui';
import { TaskFilters, type TaskView } from '@/components/tasks/task-filters';
import { TaskBoard } from '@/components/tasks/task-board';
import { TaskList } from '@/components/tasks/task-list';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import type { MemberInfo } from '@/components/tasks/task-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Task, TaskStatus, TeamMember } from '@/lib/types';

export default function TasksPage() {
    const currentTeamId = useTeams((s) => s.currentTeamId);
    const teams = useTeams((s) => s.teams);
    const currentTeam = teams.find((t) => t.id === currentTeamId);

    const tasks = useTasks((s) => s.tasks);
    const loading = useTasks((s) => s.loading);
    const error = useTasks((s) => s.error);
    const query = useTasks((s) => s.query);
    const totalPages = useTasks((s) => s.totalPages);
    const setTeam = useTasks((s) => s.setTeam);
    const setQuery = useTasks((s) => s.setQuery);
    const fetchTasks = useTasks((s) => s.fetch);
    const upsert = useTasks((s) => s.upsert);
    const removeLocal = useTasks((s) => s.removeLocal);

    const [view, setView] = useState<TaskView>('board');
    const [members, setMembers] = useState<Record<string, MemberInfo>>({});
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Task | null>(null);
    const [deleting, setDeleting] = useState<Task | null>(null);

    useEffect(() => {
        setTeam(currentTeamId);
    }, [currentTeamId, setTeam]);

    useEffect(() => {
        fetchTasks();
    }, [query, fetchTasks]);

    useEffect(() => {
        if (!currentTeamId) return setMembers({});
        api.get<TeamMember[]>(`/teams/${currentTeamId}/members`)
            .then((ms) => {
                const map: Record<string, MemberInfo> = {};
                for (const m of ms) {
                    map[m.userId] = {
                        name: fullName(m.firstName, m.lastName, m.email),
                        initials: initialsOf(m.firstName, m.lastName, m.email),
                    };
                }
                setMembers(map);
            })
            .catch(() => setMembers({}));
    }, [currentTeamId]);

    function onViewChange(v: TaskView) {
        setView(v);
        if (v === 'board' && query.status !== 'ALL') setQuery({ status: 'ALL' });
    }

    async function patchTask(task: Task, patch: Record<string, unknown>) {
        try {
            const updated = await api.patch<Task>(`/tasks/${task.id}`, patch);
            upsert(updated);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Update failed');
        }
    }

    const onToggleComplete = (task: Task) =>
        patchTask(task, { status: task.status === 'DONE' ? 'TODO' : 'DONE' });
    const onStatusChange = (task: Task, status: TaskStatus) =>
        patchTask(task, { status });

    async function onDeleteConfirmed() {
        if (!deleting) return;
        try {
            await api.delete(`/tasks/${deleting.id}`);
            removeLocal(deleting.id);
            toast.success('Task deleted');
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Delete failed');
        } finally {
            setDeleting(null);
        }
    }

    const handlers = {
        onEdit: (task: Task) => {
            setEditing(task);
            setFormOpen(true);
        },
        onDelete: (task: Task) => setDeleting(task),
        onStatusChange,
        onToggleComplete,
    };

    return (
        <div className="space-y-5 p-4 sm:p-6">
            <div>
                <h1 className="font-heading text-xl font-semibold tracking-tight">
                    Tasks
                </h1>
                <p className="text-sm text-muted-foreground">
                    {currentTeam?.name ?? 'No team selected'}
                </p>
            </div>

            <TaskFilters
                view={view}
                onViewChange={onViewChange}
                onNewTask={() => {
                    setEditing(null);
                    setFormOpen(true);
                }}
            />

            {!currentTeamId ? (
                <EmptyState
                    title="No team selected"
                    body="Pick or create a team to start adding tasks."
                />
            ) : loading && tasks.length === 0 ? (
                <LoadingState view={view} />
            ) : error ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
                    <Warning className="size-7 text-destructive" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={() => fetchTasks()}>
                        Retry
                    </Button>
                </div>
            ) : tasks.length === 0 ? (
                <EmptyState
                    title="No tasks yet"
                    body="Create your first task to get going."
                    action={
                        <Button
                            onClick={() => {
                                setEditing(null);
                                setFormOpen(true);
                            }}
                        >
                            New task
                        </Button>
                    }
                />
            ) : view === 'board' ? (
                <TaskBoard tasks={tasks} members={members} {...handlers} />
            ) : (
                <>
                    <TaskList
                        tasks={tasks}
                        members={members}
                        onEdit={handlers.onEdit}
                        onDelete={handlers.onDelete}
                        onToggleComplete={onToggleComplete}
                    />
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-3 text-sm">
                            <span className="text-muted-foreground">
                                Page {query.page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={query.page <= 1}
                                onClick={() => setQuery({ page: query.page - 1 })}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={query.page >= totalPages}
                                onClick={() => setQuery({ page: query.page + 1 })}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}

            {currentTeamId && (
                <TaskFormDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    teamId={currentTeamId}
                    task={editing}
                    onSaved={upsert}
                />
            )}

            <AlertDialog
                open={Boolean(deleting)}
                onOpenChange={(o) => !o && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            “{deleting?.title}” will be permanently removed. This
                            can’t be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDeleteConfirmed}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function EmptyState({
    title,
    body,
    action,
}: {
    title: string;
    body: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <ClipboardText className="size-8 text-muted-foreground" />
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
            </div>
            {action}
        </div>
    );
}

function LoadingState({ view }: { view: TaskView }) {
    if (view === 'list') {
        return (
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, col) => (
                <div key={col} className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ))}
        </div>
    );
}
