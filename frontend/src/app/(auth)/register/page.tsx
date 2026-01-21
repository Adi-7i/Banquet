"use client";

import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

// Base schema
const baseSchema = z.object({
    email: z.string().email(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[0-9]/, "Must contain at least one number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character"),
    role: z.enum(["CUSTOMER", "OWNER"]),
});

// Customer-specific schema
const customerSchema = baseSchema.extend({
    role: z.literal("CUSTOMER"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    phoneNumber: z.string().min(10, "Valid phone number is required"),
});

// Owner-specific schema
const ownerSchema = baseSchema.extend({
    role: z.literal("OWNER"),
    businessName: z.string().min(3, "Business name is required"),
    contactNumber: z.string().min(10, "Valid contact number is required"),
});

// Combined discriminated union schema
const registerSchema = z.discriminatedUnion("role", [customerSchema, ownerSchema]);

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register, isRegistering } = useAuth();
    const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "OWNER">("CUSTOMER");

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            role: "CUSTOMER",
            firstName: "",
            lastName: "",
            phoneNumber: "",
        } as any,
    });

    // Watch role changes to update form structure
    const watchRole = form.watch("role");

    // Update selected role when form role changes
    if (watchRole !== selectedRole) {
        setSelectedRole(watchRole);
        // Reset role-specific fields when switching
        if (watchRole === "CUSTOMER") {
            form.setValue("firstName" as any, "");
            form.setValue("lastName" as any, "");
            form.setValue("phoneNumber" as any, "");
        } else {
            form.setValue("businessName" as any, "");
            form.setValue("contactNumber" as any, "");
        }
    }

    function onSubmit(values: RegisterFormData) {
        register(values as any, {
            onSuccess: () => {
                toast.success("Registration successful. Please verify your email.");
            },
            onError: (error: any) => {
                toast.error(error?.formattedMessage || "Failed to register");
            }
        });
    }

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join us to book or manage banquets</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>I am a:</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md flex-1 justify-center has-[:checked]:bg-muted">
                                                <input
                                                    type="radio"
                                                    {...field}
                                                    value="CUSTOMER"
                                                    checked={field.value === "CUSTOMER"}
                                                    className="accent-primary"
                                                />
                                                Customer
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md flex-1 justify-center has-[:checked]:bg-muted">
                                                <input
                                                    type="radio"
                                                    {...field}
                                                    value="OWNER"
                                                    checked={field.value === "OWNER"}
                                                    className="accent-primary"
                                                />
                                                Venue Owner
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedRole === "CUSTOMER" ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={"firstName" as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={"lastName" as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="mt-4">
                                    <FormField
                                        control={form.control}
                                        name={"phoneNumber" as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91 9876543210" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <FormField
                                    control={form.control}
                                    name={"businessName" as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Grand Banquet Hall" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={"contactNumber" as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+91 9876543210" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

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

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Password Requirements:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                { label: "At least 8 characters", valid: (form.watch("password") || "").length >= 8 },
                                                { label: "Lowercase letter", valid: /[a-z]/.test(form.watch("password") || "") },
                                                { label: "Uppercase letter", valid: /[A-Z]/.test(form.watch("password") || "") },
                                                { label: "Number", valid: /[0-9]/.test(form.watch("password") || "") },
                                                { label: "Special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(form.watch("password") || "") },
                                            ].map((req, index) => (
                                                <li key={index} className="flex items-center gap-2 text-xs">
                                                    <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${req.valid ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 bg-background"}`}>
                                                        {req.valid && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                    <span className={req.valid ? "text-foreground font-medium" : "text-muted-foreground"}>{req.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isRegistering}>
                            {isRegistering ? "Creating account..." : "Register"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
