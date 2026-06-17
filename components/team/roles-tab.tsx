'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, PencilSimple, Trash, ShieldCheck } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { PERMISSION_LABELS } from '@/lib/rbac';
import { RoleFormDialog } from './role-form-dialog';
import type { Role, TeamAccess } from '@/lib/types';

const MAX_BADGES = 6;

interface Props {
    teamId: string;
    roles: Role[];
    access?: TeamAccess;
    onChanged: () => void;
}

export function RolesTab({ teamId, roles, access, onChanged }: Props) {
    const canCreate = access?.hasAll || access?.permissions.includes('ROLE_CREATE');
    const canUpdate = access?.hasAll || access?.permissions.includes('ROLE_UPDATE');
    const canDelete = access?.hasAll || access?.permissions.includes('ROLE_DELETE');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    function openCreate() {
        setEditingRole(null);
        setDialogOpen(true);
    }
    function openEdit(role: Role) {
        setEditingRole(role);
        setDialogOpen(true);
    }

    async function remove(role: Role) {
        try {
            await api.delete(`/teams/${teamId}/roles/${role.id}`);
            toast.success('Role deleted');
            onChanged();
        } catch (err) {
            // The API blocks deletion of a role still assigned to a member/invite (409).
            toast.error(err instanceof ApiError ? err.message : 'Delete failed');
        }
    }

    return (
        <div className="space-y-4">
            {canCreate && (
                <div className="flex justify-end">
                    <Button onClick={openCreate} className="gap-1.5">
                        <Plus weight="bold" /> New role
                    </Button>
                </div>
            )}

            <div className="divide-y rounded-lg border">
                {roles.map((role) => (
                    <div key={role.id} className="flex items-start gap-3 p-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{role.name}</p>
                                {role.isSystem && (
                                    <Badge variant="secondary" className="gap-1">
                                        <ShieldCheck className="size-3" /> System
                                    </Badge>
                                )}
                            </div>
                            {role.description && (
                                <p className="text-xs text-muted-foreground">
                                    {role.description}
                                </p>
                            )}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {role.permissions.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        No permissions
                                    </span>
                                ) : (
                                    <>
                                        {role.permissions.slice(0, MAX_BADGES).map((p) => (
                                            <Badge
                                                key={p}
                                                variant="outline"
                                                className="font-normal"
                                            >
                                                {PERMISSION_LABELS[p] ?? p}
                                            </Badge>
                                        ))}
                                        {role.permissions.length > MAX_BADGES && (
                                            <Badge variant="outline" className="font-normal">
                                                +{role.permissions.length - MAX_BADGES}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {!role.isSystem && (canUpdate || canDelete) && (
                            <div className="flex items-center gap-1">
                                {canUpdate && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(role)}
                                        aria-label="Edit role"
                                    >
                                        <PencilSimple className="size-4" />
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(role)}
                                        aria-label="Delete role"
                                    >
                                        <Trash className="size-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <RoleFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                teamId={teamId}
                role={editingRole}
                onSaved={onChanged}
            />
        </div>
    );
}
