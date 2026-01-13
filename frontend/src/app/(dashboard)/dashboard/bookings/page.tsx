"use client";

import { useBookings, Booking } from "@/hooks/useBookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ReviewDialog } from "@/components/reviews/review-dialog";
import { Button } from "@/components/ui/button";

export default function BookingsPage() {
    const { data: bookings, isLoading } = useBookings();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
            </div>

            <div className="grid gap-4">
                {bookings?.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No bookings found.
                    </div>
                ) : (
                    bookings?.map((booking: Booking) => (
                        <Card key={booking._id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold">
                                    {booking.banquet.name}
                                </CardTitle>
                                <Badge variant={
                                    booking.status === "CONFIRMED" ? "default" :
                                        booking.status === "COMPLETED" ? "outline" : "secondary"
                                }>
                                    {booking.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mb-2">
                                    Event Date: {format(new Date(booking.eventDate), "MMMM d, yyyy")}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">
                                        Amount: ₹{booking.totalAmount.toLocaleString()}
                                    </div>
                                    {booking.status === "COMPLETED" && (
                                        <ReviewDialog
                                            banquetId={booking.banquet._id}
                                            banquetName={booking.banquet.name}
                                            trigger={<Button size="sm" variant="outline">Write Review</Button>}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
