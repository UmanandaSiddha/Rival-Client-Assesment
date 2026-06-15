'use client';

import { useEffect, useState } from 'react';
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
import { getNextParam } from '@/lib/redirect';
import type { User } from '@/lib/types';

const schema = z.object({
    otpString: z.string().length(6, 'Enter the 6-digit code'),
});
type Values = z.infer<typeof schema>;

export default function VerifyPage() {
    const router = useRouter();
    const user = useAuth((s) => s.user);
    const status = useAuth((s) => s.status);
    const setUser = useAuth((s) => s.setUser);
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    // Need a session to verify against; if there's none, go sign in.
    useEffect(() => {
        if (status === 'unauthenticated') router.replace('/login');
        if (status === 'authenticated' && user?.isVerified)
            router.replace(getNextParam());
    }, [status, user, router]);

    async function onSubmit(values: Values) {
        if (!user?.email) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: User }>('/auth/verify-otp', {
                email: user.email,
                otpString: values.otpString,
            });
            setUser(res.data);
            toast.success('Verified!');
            router.replace(getNextParam());
        } catch (err) {
            toast.error(
                err instanceof ApiError ? err.message : 'Verification failed',
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function resend() {
        if (!user?.email) return;
        try {
            await api.post('/auth/request-otp', { email: user.email });
            toast.success('Code sent');
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Could not resend');
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Verify your email</CardTitle>
                <CardDescription>
                    Enter the 6-digit code sent to {user?.email ?? 'your email'}.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="otpString">Verification code</Label>
                        <Input
                            id="otpString"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            className="text-center tracking-[0.5em]"
                            {...register('otpString')}
                        />
                        {errors.otpString && (
                            <p className="text-xs text-destructive">
                                {errors.otpString.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            In development the code is always{' '}
                            <span className="font-semibold">000000</span>.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="mt-6 flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <CircleNotch className="animate-spin" />}
                        Verify
                    </Button>
                    <button
                        type="button"
                        onClick={resend}
                        className="text-sm text-muted-foreground underline"
                    >
                        Resend code
                    </button>
                </CardFooter>
            </form>
        </Card>
    );
}
