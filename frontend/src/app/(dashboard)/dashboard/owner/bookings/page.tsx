"use client";

import { useOwnerBookings, useUpdateBookingStatus, Booking } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Calendar, Check, X, MapPin, User, Clock } from "lucide-react";

export default function OwnerBookingsPage() {
    const { data: bookings, isLoading } = useOwnerBookings();
    const { mutate: updateStatus, isPending } = useUpdateBookingStatus();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <Skeleton className="h-10 w-48 mb-4" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    if (!bookings || bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg m-4">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Bookings Yet</h3>
                <p className="text-muted-foreground">You don't have any booking requests for your banquets.</p>
            </div>
        );
    }

    const handleStatusUpdate = (id: string, status: "CONFIRMED" | "CANCELLED") => {
        if (confirm(`Are you sure you want to ${status.toLowerCase()} this booking?`)) {
            updateStatus({ id, status });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Booking Requests</h1>
                <p className="text-muted-foreground">Manage bookings for all your venues.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookings.map((booking: Booking) => (
                    <Card key={booking._id} className="overflow-hidden">
                        <CardHeader className="pb-3 bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge
                                        variant={
                                            booking.status === "CONFIRMED" ? "default" :
                                                booking.status === "CANCELLED" ? "destructive" :
                                                    booking.status === "PENDING" ? "secondary" : "outline"
                                        }
                                        className="mb-2"
                                    >
                                        {booking.status}
                                    </Badge>
                                    <CardTitle className="text-base font-semibold">{booking.banquet.name}</CardTitle>
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Guest: {booking.guestCount}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center text-sm">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                {format(parseISO(booking.eventDate), "PPP")}
                            </div>
                            <div className="flex items-center text-sm">
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                {booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : "Unknown User"}
                            </div>
                            {booking.notes && (
                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                                    <span className="font-semibold text-xs uppercase block mb-1">Notes:</span>
                                    {booking.notes}
                                </div>
                            )}

                            {booking.status === "PENDING" && (
                                <div className="flex gap-2 mt-4 pt-2 border-t">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        size="sm"
                                        onClick={() => handleStatusUpdate(booking._id, "CONFIRMED")}
                                        disabled={isPending}
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Accept
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleStatusUpdate(booking._id, "CANCELLED")}
                                        disabled={isPending}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
