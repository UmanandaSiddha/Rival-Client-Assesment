'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CircleNotch } from '@phosphor-icons/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/store/auth';
import type { User } from '@/lib/types';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const setUser = useAuth((s) => s.setUser);
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    async function onSubmit(values: Values) {
        setSubmitting(true);
        try {
            const res = await api.post<{ data: User }>('/auth/sign-in', values);
            setUser(res.data);
            router.replace(res.data.isVerified ? '/tasks' : '/verify');
        } catch (err) {
            toast.error(
                err instanceof ApiError ? err.message : 'Sign in failed',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>
                    Welcome back. Enter your credentials.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="mt-6 flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && (
                            <CircleNotch className="animate-spin" />
                        )}
                        Sign in
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        No account?{' '}
                        <Link href="/signup" className="text-foreground underline">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
