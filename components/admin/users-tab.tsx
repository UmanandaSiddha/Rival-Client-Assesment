'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { fullName } from '@/lib/task-ui';
import { useAuth } from '@/lib/store/auth';
import type { Paginated, User, UserRole } from '@/lib/types';

export function UsersTab() {
    const selfId = useAuth((s) => s.user?.id);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Paginated<User> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebounced(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (debounced.trim()) params.set('search', debounced.trim());
            setData(await api.get<Paginated<User>>(`/admin/users?${params}`));
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [page, debounced]);

    useEffect(() => {
        load();
    }, [load]);

    function patchLocal(id: string, patch: Partial<User>) {
        setData((d) =>
            d
                ? { ...d, data: d.data.map((u) => (u.id === id ? { ...u, ...patch } : u)) }
                : d,
        );
    }

    async function changeRole(id: string, role: UserRole) {
        try {
            await api.patch(`/admin/users/${id}/role`, { role });
            patchLocal(id, { role });
            toast.success('Role updated');
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Update failed');
        }
    }

    async function toggleDisabled(u: User) {
        try {
            await api.patch(`/admin/users/${u.id}/disable`, {
                disabled: !u.isDisabled,
            });
            patchLocal(u.id, { isDisabled: !u.isDisabled });
            toast.success(u.isDisabled ? 'User enabled' : 'User disabled');
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Update failed');
        }
    }

    return (
        <div className="space-y-3">
            <div className="relative max-w-xs">
                <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="pl-8"
                />
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">User</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Role</th>
                                <th className="p-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data.map((u) => {
                                const isSelf = u.id === selfId;
                                return (
                                    <tr
                                        key={u.id}
                                        className="border-b last:border-0 hover:bg-muted/30"
                                    >
                                        <td className="p-3">
                                            <p className="font-medium">
                                                {fullName(
                                                    u.firstName,
                                                    u.lastName,
                                                    u.email,
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {u.email}
                                            </p>
                                        </td>
                                        <td className="p-3">
                                            {u.isDisabled ? (
                                                <Badge variant="destructive">
                                                    Disabled
                                                </Badge>
                                            ) : u.isVerified ? (
                                                <Badge variant="secondary">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Unverified
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <Select
                                                value={u.role}
                                                onValueChange={(v) =>
                                                    changeRole(u.id, v as UserRole)
                                                }
                                                disabled={isSelf}
                                            >
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USER">
                                                        User
                                                    </SelectItem>
                                                    <SelectItem value="ADMIN">
                                                        Admin
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-3 text-right">
                                            {!isSelf && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleDisabled(u)}
                                                    className={
                                                        u.isDisabled
                                                            ? ''
                                                            : 'text-destructive'
                                                    }
                                                >
                                                    {u.isDisabled
                                                        ? 'Enable'
                                                        : 'Disable'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-end gap-3 text-sm">
                    <span className="text-muted-foreground">
                        Page {data.page} of {data.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
