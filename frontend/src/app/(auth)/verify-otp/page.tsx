"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

const otpSchema = z.object({
    otp: z.string().min(6, "OTP must be 6 characters"),
    email: z.string().email().optional(), // Can be pre-filled or captured from previous step context
});

import { Suspense } from "react";

function VerifyOtpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get("email");

    const { verifyOtp, isVerifyingOtp } = useAuth();

    const form = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
            email: emailParam || "",
        },
    });

    function onSubmit(values: z.infer<typeof otpSchema>) {
        const identifier = values.email || emailParam;
        if (!identifier) {
            toast.error("Email identifier missing");
            return;
        }

        verifyOtp(
            { identifier, otp: values.otp, type: "EMAIL" },
            {
                onSuccess: () => {
                    toast.success("Verification successful! Please login.");
                    // Redirect handled in hook
                },
                onError: (error: any) => {
                    toast.error(error?.formattedMessage || "Invalid OTP");
                }
            }
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Verify Email</CardTitle>
                <CardDescription>Enter the 6-digit code sent to your email.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {!emailParam && (
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>OTP Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123456" maxLength={6} className="text-center tracking-widest text-lg" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Please enter the one-time password sent to your email.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
                            {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOtpForm />
        </Suspense>
    );
}
