"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useCreateBooking } from "@/hooks/useBookings";
import { useBanquet } from "@/hooks/useBanquets";
import { Skeleton } from "@/components/ui/skeleton";

const bookingSchema = z.object({
    eventDate: z.date().refine((date) => date > new Date(), {
        message: "Event date must be in the future",
    }),
    guestCount: z.number().min(1, "At least 1 guest is required"),
    notes: z.string().optional(),
});

export default function BookingFlowPage() {
    const params = useParams();
    const router = useRouter();
    const banquetId = params.id as string;

    const { data: banquet, isLoading: isBanquetLoading } = useBanquet(banquetId);
    const { mutate: createBooking, isPending } = useCreateBooking();

    const form = useForm<z.infer<typeof bookingSchema>>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            guestCount: 50,
            notes: "",
        },
    });

    function onSubmit(values: z.infer<typeof bookingSchema>) {
        createBooking(
            {
                banquetId,
                eventDate: values.eventDate.toISOString(),
                guestCount: values.guestCount,
                notes: values.notes,
            },
            {
                onSuccess: () => {
                    router.push("/dashboard/bookings");
                },
            }
        );
    }

    if (isBanquetLoading) {
        return (
            <div className="container max-w-2xl py-10 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!banquet) {
        return (
            <div className="container max-w-2xl py-10">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Banquet not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const estimatedTotal = banquet.pricePerPlate * (form.watch("guestCount") || 0);

    return (
        <div className="container max-w-2xl py-10">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Book Your Event</h1>
                <p className="text-muted-foreground">Complete the details to reserve {banquet.name}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                            <CardDescription>
                                Provide information about your upcoming event
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                                variant="outline"
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
                                                <FormDescription>
                                                    Select the date for your event
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="guestCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expected Guest Count</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="50"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Venue capacity: {banquet.capacity} guests
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Additional Notes (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Any special requirements or requests..."
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.back()}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isPending} className="flex-1">
                                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm Booking
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle>Booking Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium">{banquet.name}</p>
                                <p className="text-xs text-muted-foreground">{banquet.city}</p>
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Price per plate</span>
                                    <span className="font-medium">₹{banquet.pricePerPlate}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Guests</span>
                                    <span className="font-medium">{form.watch("guestCount") || 0}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="font-semibold">Estimated Total</span>
                                    <span className="font-bold text-lg">₹{estimatedTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
