'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTab } from '@/components/admin/users-tab';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store/auth';
import {
    PRIORITY_LABELS,
    STATUS_LABELS,
    formatDate,
    fullName,
} from '@/lib/task-ui';
import type { Paginated, Task } from '@/lib/types';

interface AdminTeam {
    id: string;
    name: string;
    ownerEmail?: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    memberCount: number;
    taskCount: number;
}

export default function AdminPage() {
    const router = useRouter();
    const role = useAuth((s) => s.user?.role);

    useEffect(() => {
        if (role && role !== 'ADMIN') router.replace('/tasks');
    }, [role, router]);

    if (role !== 'ADMIN') return null;

    return (
        <div className="space-y-5 p-4 sm:p-6">
            <div>
                <h1 className="font-heading text-xl font-semibold tracking-tight">
                    Admin
                </h1>
                <p className="text-sm text-muted-foreground">
                    Platform-wide users, teams, and tasks.
                </p>
            </div>

            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-4">
                    <UsersTab />
                </TabsContent>
                <TabsContent value="teams" className="mt-4">
                    <AdminTeams />
                </TabsContent>
                <TabsContent value="tasks" className="mt-4">
                    <AdminTasks />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AdminTeams() {
    const [rows, setRows] = useState<AdminTeam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Paginated<AdminTeam>>('/admin/teams?limit=50')
            .then((r) => setRows(r.data))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <TableSkeleton />;

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="p-3 font-medium">Team</th>
                        <th className="p-3 font-medium">Owner</th>
                        <th className="p-3 font-medium">Members</th>
                        <th className="p-3 font-medium">Tasks</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((t) => (
                        <tr key={t.id} className="border-b last:border-0">
                            <td className="p-3 font-medium">{t.name}</td>
                            <td className="p-3 text-muted-foreground">
                                {fullName(
                                    t.ownerFirstName,
                                    t.ownerLastName,
                                    t.ownerEmail,
                                )}
                            </td>
                            <td className="p-3">{t.memberCount}</td>
                            <td className="p-3">{t.taskCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function AdminTasks() {
    const [rows, setRows] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Paginated<Task>>('/admin/tasks?limit=50')
            .then((r) => setRows(r.data))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <TableSkeleton />;

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="p-3 font-medium">Task</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Priority</th>
                        <th className="p-3 font-medium">Due</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((t) => (
                        <tr key={t.id} className="border-b last:border-0">
                            <td className="p-3 font-medium">{t.title}</td>
                            <td className="p-3">
                                <Badge variant="secondary">
                                    {STATUS_LABELS[t.status]}
                                </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                                {PRIORITY_LABELS[t.priority]}
                            </td>
                            <td className="p-3 text-muted-foreground">
                                {t.dueDate ? formatDate(t.dueDate) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}
