'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, UsersThree, ShieldCheck } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/store/auth';

const items = [
    { href: '/tasks', label: 'Tasks', icon: ListChecks },
    { href: '/team', label: 'Team', icon: UsersThree },
];

export function Nav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const role = useAuth((s) => s.user?.role);

    const links =
        role === 'ADMIN'
            ? [...items, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
            : items;

    return (
        <nav className="flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        className={cn(
                            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            active
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                        )}
                    >
                        <Icon className="size-4" />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
