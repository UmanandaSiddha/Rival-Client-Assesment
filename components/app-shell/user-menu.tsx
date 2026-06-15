'use client';

import { useRouter } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/store/auth';

export function UserMenu() {
    const router = useRouter();
    const user = useAuth((s) => s.user);
    const logout = useAuth((s) => s.logout);

    const initials =
        `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() ||
        user?.email?.[0]?.toUpperCase() ||
        '?';

    async function onLogout() {
        await logout();
        router.replace('/login');
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-medium">
                        {[user?.firstName, user?.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Account'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {user?.email}
                    </p>
                    {user?.role === 'ADMIN' && (
                        <Badge variant="secondary" className="mt-1.5">
                            Admin
                        </Badge>
                    )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="gap-2">
                    <SignOut className="size-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
