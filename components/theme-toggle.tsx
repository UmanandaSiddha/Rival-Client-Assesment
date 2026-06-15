'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/store/theme';

export function ThemeToggle() {
    const theme = useTheme((s) => s.theme);
    const toggle = useTheme((s) => s.toggle);

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
    );
}
