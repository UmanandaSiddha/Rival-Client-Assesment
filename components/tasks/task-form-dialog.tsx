'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CircleNotch } from '@phosphor-icons/react';
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
import { api, ApiError } from '@/lib/api';
import { fullName } from '@/lib/task-ui';
import type { Task } from '@/lib/types';

interface TeamMemberLite {
    userId: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

const UNASSIGNED = 'UNASSIGNED';

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

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, dirtyFields },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    // Reset the form whenever the dialog opens (with the task's values when editing).
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

    // Load team members for the assignee picker.
    useEffect(() => {
        if (!open) return;
        api.get<TeamMemberLite[]>(`/teams/${teamId}/members`)
            .then(setMembers)
            .catch(() => setMembers([]));
    }, [open, teamId]);

    async function onSubmit(values: Values) {
        setSubmitting(true);
        try {
            const assignee =
                values.assigneeId === UNASSIGNED ? null : values.assigneeId;
            let saved: Task;

            if (editing && task) {
                const patch: Record<string, unknown> = {};
                if (dirtyFields.title) patch.title = values.title;
                if (dirtyFields.description)
                    patch.description = values.description || null;
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit task' : 'New task'}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? 'Update the task details.'
                            : 'Add a task to this team.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="task-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" {...register('title')} />
                        {errors.title && (
                            <p className="text-xs text-destructive">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={3}
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
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="URGENT">
                                                Urgent
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due date</Label>
                            <Input id="dueDate" type="date" {...register('dueDate')} />
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
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={UNASSIGNED}>
                                                Unassigned
                                            </SelectItem>
                                            {members.map((m) => (
                                                <SelectItem
                                                    key={m.userId}
                                                    value={m.userId}
                                                >
                                                    {fullName(
                                                        m.firstName,
                                                        m.lastName,
                                                        m.email,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="task-form" disabled={submitting}>
                        {submitting && <CircleNotch className="animate-spin" />}
                        {editing ? 'Save changes' : 'Create task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
