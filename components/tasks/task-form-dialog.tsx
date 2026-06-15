'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CircleNotch, CalendarBlank, PencilLine } from '@phosphor-icons/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { fullName, formatDate } from '@/lib/task-ui';
import { useEditing, type EditLock } from '@/lib/store/editing';
import { TaskActivityFeed } from './task-activity-feed';
import { TaskAttachments } from './task-attachments';
import type { Task } from '@/lib/types';

interface TeamMemberLite {
    userId: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

const UNASSIGNED = 'UNASSIGNED';
const HEARTBEAT_MS = 20_000; // keep the edit lock alive while the dialog is open
const DRAFT_DEBOUNCE_MS = 400; // batch keystrokes before broadcasting

const schema = z.object({
    title: z.string().min(1, 'Title is required').max(300),
    description: z.string().max(10000).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueDate: z.string().optional(),
    assigneeId: z.string().optional(),
});
type Values = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    task?: Task | null;
    onSaved: (task: Task) => void;
}

export function TaskFormDialog({ open, onOpenChange, teamId, task, onSaved }: Props) {
    const editing = Boolean(task);
    const [members, setMembers] = useState<TeamMemberLite[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [lockedBy, setLockedBy] = useState<EditLock | null>(null);
    const [iHoldLock, setIHoldLock] = useState(false);

    // Their live draft (when someone else holds the lock) comes from the realtime store.
    const liveDraft = useEditing((s) => (task ? s.drafts[task.id] : undefined));
    const readOnly = Boolean(lockedBy);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, dirtyFields },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (!open) return;
        reset({
            title: task?.title ?? '',
            description: task?.description ?? '',
            status: task?.status ?? 'TODO',
            priority: task?.priority ?? 'MEDIUM',
            dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
            assigneeId: task?.assigneeId ?? UNASSIGNED,
        });
    }, [open, task, reset]);

    useEffect(() => {
        if (!open) return;
        api.get<TeamMemberLite[]>(`/teams/${teamId}/members`)
            .then(setMembers)
            .catch(() => setMembers([]));
    }, [open, teamId]);

    // Claim the edit lock while the dialog is open for an existing task. If someone else holds it,
    // we go read-only and watch their live draft. We refresh our lock on a heartbeat and release on close.
    useEffect(() => {
        if (!open || !editing || !task) return;
        let active = true;
        let held = false;
        let heartbeat: ReturnType<typeof setInterval>;
        const lockUrl = `/realtime/teams/${teamId}/tasks/${task.id}/edit-lock`;

        (async () => {
            try {
                const res = await api.post<{ ok: boolean; holder: EditLock | null }>(
                    lockUrl,
                );
                if (!active) {
                    if (res.ok) api.delete(lockUrl).catch(() => undefined);
                    return;
                }
                if (res.ok) {
                    held = true;
                    setIHoldLock(true);
                    setLockedBy(null);
                    heartbeat = setInterval(
                        () => api.post(lockUrl).catch(() => undefined),
                        HEARTBEAT_MS,
                    );
                } else {
                    setLockedBy(res.holder);
                }
            } catch {
                // best-effort — editing still works, just without the soft lock
            }
        })();

        return () => {
            active = false;
            setIHoldLock(false);
            setLockedBy(null);
            clearInterval(heartbeat);
            if (held) api.delete(lockUrl).catch(() => undefined);
        };
    }, [open, editing, task, teamId]);

    // While I hold the lock, stream batched keystrokes so others see my edits live.
    const titleVal = watch('title');
    const descVal = watch('description');
    useEffect(() => {
        if (!iHoldLock || !task) return;
        const t = setTimeout(() => {
            api.post(`/realtime/teams/${teamId}/tasks/${task.id}/draft`, {
                title: titleVal,
                description: descVal,
            }).catch(() => undefined);
        }, DRAFT_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [titleVal, descVal, iHoldLock, task, teamId]);

    async function onSubmit(values: Values) {
        setSubmitting(true);
        try {
            const assignee = values.assigneeId === UNASSIGNED ? null : values.assigneeId;
            let saved: Task;

            if (editing && task) {
                const patch: Record<string, unknown> = {};
                if (dirtyFields.title) patch.title = values.title;
                if (dirtyFields.description) patch.description = values.description || null;
                if (dirtyFields.status) patch.status = values.status;
                if (dirtyFields.priority) patch.priority = values.priority;
                if (dirtyFields.dueDate) patch.dueDate = values.dueDate || null;
                if (dirtyFields.assigneeId) patch.assigneeId = assignee;

                if (Object.keys(patch).length === 0) {
                    onOpenChange(false);
                    return;
                }
                saved = await api.patch<Task>(`/tasks/${task.id}`, patch);
            } else {
                saved = await api.post<Task>('/tasks', {
                    teamId,
                    title: values.title,
                    description: values.description || undefined,
                    status: values.status,
                    priority: values.priority,
                    dueDate: values.dueDate || undefined,
                    assigneeId: assignee ?? undefined,
                });
            }

            onSaved(saved);
            toast.success(editing ? 'Task updated' : 'Task created');
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Save failed');
        } finally {
            setSubmitting(false);
        }
    }

    const detailsForm = (
        <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {lockedBy && (
                <div className="space-y-2 rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
                    <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                        <PencilLine className="size-4" />
                        {fullName(lockedBy.firstName, lockedBy.lastName, 'Someone')} is
                        editing this task
                    </div>
                    {(liveDraft?.title || liveDraft?.description) && (
                        <div className="rounded bg-background/60 p-2 text-muted-foreground">
                            <p className="font-medium text-foreground">
                                {liveDraft.title || '(no title)'}
                            </p>
                            {liveDraft.description && (
                                <p className="mt-1 whitespace-pre-wrap text-xs">
                                    {liveDraft.description}
                                </p>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        You can edit once they’re done.
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" disabled={readOnly} {...register('title')} />
                {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={3}
                    disabled={readOnly}
                    {...register('description')}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={readOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">
                                        In Progress
                                    </SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Priority</Label>
                    <Controller
                        control={control}
                        name="priority"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={readOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Due date</Label>
                    <Controller
                        control={control}
                        name="dueDate"
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={readOnly}
                                        className={cn(
                                            'w-full justify-start gap-2 font-normal',
                                            !field.value && 'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarBlank className="size-4" />
                                        {field.value
                                            ? formatDate(field.value)
                                            : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            field.value
                                                ? new Date(`${field.value}T00:00:00`)
                                                : undefined
                                        }
                                        onSelect={(d) =>
                                            field.onChange(d ? format(d, 'yyyy-MM-dd') : '')
                                        }
                                    />
                                    {field.value && (
                                        <div className="border-t p-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => field.onChange('')}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Controller
                        control={control}
                        name="assigneeId"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={readOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.userId} value={m.userId}>
                                            {fullName(m.firstName, m.lastName, m.email)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>
        </form>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit task' : 'New task'}</DialogTitle>
                    <DialogDescription>
                        {editing ? 'Update the task details.' : 'Add a task to this team.'}
                    </DialogDescription>
                </DialogHeader>

                {editing && task ? (
                    <Tabs defaultValue="details">
                        <TabsList>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="attachments">Attachments</TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="mt-4">
                            {detailsForm}
                        </TabsContent>
                        <TabsContent value="attachments" className="mt-4">
                            <TaskAttachments
                                taskId={task.id}
                                open={open}
                                readOnly={readOnly}
                            />
                        </TabsContent>
                        <TabsContent value="activity" className="mt-4">
                            <TaskActivityFeed taskId={task.id} open={open} />
                        </TabsContent>
                    </Tabs>
                ) : (
                    detailsForm
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="task-form"
                        disabled={submitting || readOnly}
                    >
                        {submitting && <CircleNotch className="animate-spin" />}
                        {editing ? 'Save changes' : 'Create task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
