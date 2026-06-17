'use client';

import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { api, ApiError } from '@/lib/api';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '@/lib/rbac';
import type { Permission, Role } from '@/lib/types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    role?: Role | null; // null/undefined = create
    onSaved: () => void;
}

export function RoleFormDialog({ open, onOpenChange, teamId, role, onSaved }: Props) {
    const editing = Boolean(role);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [perms, setPerms] = useState<Set<Permission>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(role?.name ?? '');
        setDescription(role?.description ?? '');
        setPerms(new Set(role?.permissions ?? []));
    }, [open, role]);

    function toggle(p: Permission) {
        setPerms((prev) => {
            const next = new Set(prev);
            if (next.has(p)) next.delete(p);
            else next.add(p);
            return next;
        });
    }

    async function submit() {
        if (!name.trim()) {
            toast.error('Role name is required');
            return;
        }
        setSubmitting(true);
        try {
            const body = {
                name: name.trim(),
                description: description.trim() || undefined,
                permissions: [...perms],
            };
            if (editing && role) {
                await api.patch(`/teams/${teamId}/roles/${role.id}`, body);
            } else {
                await api.post(`/teams/${teamId}/roles`, body);
            }
            toast.success(editing ? 'Role updated' : 'Role created');
            onSaved();
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
                    <DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle>
                    <DialogDescription>
                        Choose what members with this role can do.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Name</Label>
                        <Input
                            id="role-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={60}
                            placeholder="e.g. Editor"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-desc">Description</Label>
                        <Textarea
                            id="role-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={300}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Permissions</Label>
                        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                            {PERMISSION_GROUPS.map((g) => (
                                <div key={g.label} className="space-y-1.5">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        {g.label}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {g.permissions.map((p) => (
                                            <label
                                                key={p}
                                                className="flex cursor-pointer items-center gap-2 text-sm"
                                            >
                                                <Checkbox
                                                    checked={perms.has(p)}
                                                    onCheckedChange={() => toggle(p)}
                                                />
                                                {PERMISSION_LABELS[p]}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={submitting}>
                        {submitting && <CircleNotch className="animate-spin" />}
                        {editing ? 'Save role' : 'Create role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
