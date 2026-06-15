'use client';

import { useEffect, useState } from 'react';
import {
    MagnifyingGlass,
    Plus,
    SortAscending,
    SortDescending,
    SquaresFour,
    ListBullets,
} from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTasks, type SortField, type StatusFilter } from '@/lib/store/tasks';

export type TaskView = 'board' | 'list';

const SORT_LABELS: Record<SortField, string> = {
    createdAt: 'Created',
    updatedAt: 'Updated',
    dueDate: 'Due date',
    priority: 'Priority',
};

export function TaskFilters({
    view,
    onViewChange,
    onNewTask,
}: {
    view: TaskView;
    onViewChange: (v: TaskView) => void;
    onNewTask: () => void;
}) {
    const query = useTasks((s) => s.query);
    const setQuery = useTasks((s) => s.setQuery);
    const [search, setSearch] = useState(query.search);

    // Debounce search input → store (avoids a refetch on every keystroke).
    useEffect(() => {
        const t = setTimeout(() => setQuery({ search }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-44 flex-1">
                <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks…"
                    className="pl-8"
                />
            </div>

            {view === 'list' && (
                <Select
                    value={query.status}
                    onValueChange={(v) => setQuery({ status: v as StatusFilter })}
                >
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                </Select>
            )}

            <Select
                value={query.sort}
                onValueChange={(v) => setQuery({ sort: v as SortField })}
            >
                <SelectTrigger className="w-36">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(SORT_LABELS) as SortField[]).map((s) => (
                        <SelectItem key={s} value={s}>
                            {SORT_LABELS[s]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                variant="outline"
                size="icon"
                aria-label="Toggle sort order"
                onClick={() =>
                    setQuery({ order: query.order === 'asc' ? 'desc' : 'asc' })
                }
            >
                {query.order === 'asc' ? (
                    <SortAscending />
                ) : (
                    <SortDescending />
                )}
            </Button>

            <div className="flex items-center rounded-md border p-0.5">
                <button
                    onClick={() => onViewChange('board')}
                    className={cn(
                        'rounded p-1.5',
                        view === 'board'
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground',
                    )}
                    aria-label="Board view"
                >
                    <SquaresFour className="size-4" />
                </button>
                <button
                    onClick={() => onViewChange('list')}
                    className={cn(
                        'rounded p-1.5',
                        view === 'list'
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground',
                    )}
                    aria-label="List view"
                >
                    <ListBullets className="size-4" />
                </button>
            </div>

            <Button onClick={onNewTask} className="gap-1.5">
                <Plus weight="bold" /> New task
            </Button>
        </div>
    );
}
