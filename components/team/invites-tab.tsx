'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CircleNotch, Trash, EnvelopeSimple } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/task-ui';
import type { Invite, Role, TeamAccess } from '@/lib/types';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    roleId: z.string().min(1, 'Pick a role'),
});
type Values = z.infer<typeof schema>;

interface Props {
    teamId: string;
    invites: Invite[];
    roles: Role[];
    access?: TeamAccess;
    onChanged: () => void;
}

export function InvitesTab({ teamId, invites, roles, access, onChanged }: Props) {
    const canInvite = access?.hasAll || access?.permissions.includes('MEMBER_INVITE');
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema) });
    const roleId = watch('roleId');

    if (!canInvite) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                You don’t have permission to manage invites for this team.
            </p>
        );
    }

    async function onSubmit(values: Values) {
        setSubmitting(true);
        try {
            await api.post(`/teams/${teamId}/invites`, values);
            toast.success(`Invite sent to ${values.email}`);
            reset({ email: '', roleId: '' });
            onChanged();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Invite failed');
        } finally {
            setSubmitting(false);
        }
    }

    async function revoke(id: string) {
        try {
            await api.delete(`/teams/${teamId}/invites/${id}`);
            toast.success('Invite revoked');
            onChanged();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Revoke failed');
        }
    }

    return (
        <div className="space-y-5">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-wrap items-start gap-2 rounded-lg border p-3"
            >
                <div className="min-w-48 flex-1 space-y-1">
                    <Input
                        type="email"
                        placeholder="teammate@example.com"
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </div>
                <div className="w-40 space-y-1">
                    <Select
                        value={roleId ?? ''}
                        onValueChange={(v) =>
                            setValue('roleId', v, { shouldValidate: true })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                    {r.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.roleId && (
                        <p className="text-xs text-destructive">
                            {errors.roleId.message}
                        </p>
                    )}
                </div>
                <Button type="submit" disabled={submitting} className="gap-1.5">
                    {submitting ? (
                        <CircleNotch className="animate-spin" />
                    ) : (
                        <EnvelopeSimple />
                    )}
                    Invite
                </Button>
            </form>

            {invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending invites.</p>
            ) : (
                <div className="divide-y rounded-lg border">
                    {invites.map((inv) => (
                        <div key={inv.id} className="flex items-center gap-3 p-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {inv.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {inv.roleName ?? 'Member'} · expires{' '}
                                    {formatDate(inv.expiresAt)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => revoke(inv.id)}
                                aria-label="Revoke invite"
                            >
                                <Trash className="size-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
