import type { Metadata } from 'next';
import { Geist, Geist_Mono, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
});

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Rival Tasks',
    description: 'Team task management with real-time collaboration',
};

// Apply the persisted theme before paint to avoid a flash of the wrong theme.
const themeScript = `try{var t=JSON.parse(localStorage.getItem('theme')||'{}');if(t&&t.state&&t.state.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                'h-full',
                'antialiased',
                geistSans.variable,
                geistMono.variable,
                'font-mono',
                jetbrainsMono.variable,
            )}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="min-h-full flex flex-col">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
