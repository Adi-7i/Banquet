"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
// import { useCreateBooking } from "@/hooks/useBookings"; // To be implemented

const bookingSchema = z.object({
    banquetId: z.string(),
    eventDate: z.date({
        required_error: "A date is required.",
    }).refine((date) => date > new Date(), {
        message: "Event date must be in the future.",
    }),
    guestCount: z.coerce.number().min(1, "At least 1 guest is required"),
    notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
    banquetId: string;
    onSuccess?: () => void;
}

export function BookingForm({ banquetId, onSuccess }: BookingFormProps) {
    // const { mutate: createBooking, isPending } = useCreateBooking(); // Mock for now
    const [isPending, setIsPending] = useState(false);

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: {
            banquetId: banquetId,
            guestCount: 50,
            notes: "",
        },
    });

    function onSubmit(values: BookingFormValues) {
        setIsPending(true);
        // Simulate API call
        setTimeout(() => {
            console.log("Booking Values:", values);
            toast.success("Booking request sent successfully!");
            setIsPending(false);
            if (onSuccess) onSuccess();
        }, 1000);

        // Real implementation:
        // createBooking(values, {
        //     onSuccess: () => {
        //         toast.success("Booking request sent successfully!");
        //         if (onSuccess) onSuccess();
        //     },
        // });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Event Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Guest Count</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Any specific requirements?"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Sending Request..." : "Confirm Booking"}
                </Button>
            </form>
        </Form>
    );
}
