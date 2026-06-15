'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { useTeams } from '@/lib/store/team';
import type { Team } from '@/lib/types';

const schema = z.object({ name: z.string().min(1, 'Required').max(120) });
type Values = z.infer<typeof schema>;

export function CreateTeamDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const fetchTeams = useTeams((s) => s.fetchTeams);
    const setCurrentTeam = useTeams((s) => s.setCurrentTeam);
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    async function onSubmit(values: Values) {
        setSubmitting(true);
        try {
            const team = await api.post<Team>('/teams', values);
            await fetchTeams();
            setCurrentTeam(team.id);
            toast.success('Team created');
            reset();
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Create failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Create team</DialogTitle>
                    <DialogDescription>
                        Teams group tasks and members together.
                    </DialogDescription>
                </DialogHeader>
                <form
                    id="create-team"
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-2"
                >
                    <Label htmlFor="name">Team name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && (
                        <p className="text-xs text-destructive">
                            {errors.name.message}
                        </p>
                    )}
                </form>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="create-team" disabled={submitting}>
                        {submitting && <CircleNotch className="animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
