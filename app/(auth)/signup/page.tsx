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
import { getNextParam, useNextSuffix } from '@/lib/redirect';
import type { User } from '@/lib/types';

const schema = z.object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
});
type Values = z.infer<typeof schema>;

export default function SignupPage() {
    const router = useRouter();
    const setUser = useAuth((s) => s.setUser);
    const nextSuffix = useNextSuffix();
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    async function onSubmit(values: Values) {
        setSubmitting(true);
        try {
            const res = await api.post<{ data: User }>('/auth/sign-up', values);
            setUser(res.data);
            toast.success('Account created — verify your email to continue');
            router.replace(`/verify?next=${encodeURIComponent(getNextParam())}`);
        } catch (err) {
            toast.error(
                err instanceof ApiError ? err.message : 'Sign up failed',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Start managing tasks with your team.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input id="firstName" {...register('firstName')} />
                            {errors.firstName && (
                                <p className="text-xs text-destructive">
                                    {errors.firstName.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input id="lastName" {...register('lastName')} />
                            {errors.lastName && (
                                <p className="text-xs text-destructive">
                                    {errors.lastName.message}
                                </p>
                            )}
                        </div>
                    </div>
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
                            autoComplete="new-password"
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
                        {submitting && <CircleNotch className="animate-spin" />}
                        Create account
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href={`/login${nextSuffix}`}
                            className="text-foreground underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
