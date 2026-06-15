'use client';

import { toast } from 'sonner';
import { Trash } from '@phosphor-icons/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { fullName, initialsOf } from '@/lib/task-ui';
import { usePresence } from '@/lib/store/presence';
import { cn } from '@/lib/utils';
import type { Role, TeamAccess, TeamMember } from '@/lib/types';

interface Props {
    teamId: string;
    members: TeamMember[];
    roles: Role[];
    access?: TeamAccess;
    onChanged: () => void;
}

export function MembersTab({ teamId, members, roles, access, onChanged }: Props) {
    const online = usePresence((s) => s.online);
    const canUpdateRole =
        access?.hasAll || access?.permissions.includes('MEMBER_UPDATE_ROLE');
    const canRemove =
        access?.hasAll || access?.permissions.includes('MEMBER_REMOVE');

    async function changeRole(userId: string, roleId: string) {
        try {
            await api.patch(`/teams/${teamId}/members/${userId}`, { roleId });
            toast.success('Role updated');
            onChanged();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Update failed');
        }
    }

    async function remove(userId: string) {
        try {
            await api.delete(`/teams/${teamId}/members/${userId}`);
            toast.success('Member removed');
            onChanged();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Remove failed');
        }
    }

    return (
        <div className="divide-y rounded-lg border">
            {members.map((m) => {
                const isOnline = online.includes(m.userId);
                return (
                    <div key={m.userId} className="flex items-center gap-3 p-3">
                        <div className="relative">
                            <Avatar className="size-9">
                                <AvatarFallback className="text-xs">
                                    {initialsOf(m.firstName, m.lastName, m.email)}
                                </AvatarFallback>
                            </Avatar>
                            <span
                                className={cn(
                                    'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background',
                                    isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                                )}
                                title={isOnline ? 'Online' : 'Offline'}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {fullName(m.firstName, m.lastName, m.email)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {m.email}
                            </p>
                        </div>

                        {m.isOwner ? (
                            <Badge variant="secondary">Owner</Badge>
                        ) : canUpdateRole ? (
                            <Select
                                value={m.roleId}
                                onValueChange={(v) => changeRole(m.userId, v)}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Badge variant="outline">{m.roleName}</Badge>
                        )}

                        {canRemove && !m.isOwner && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(m.userId)}
                                aria-label="Remove member"
                            >
                                <Trash className="size-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
