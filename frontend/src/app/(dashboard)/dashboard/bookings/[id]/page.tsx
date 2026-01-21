"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, MapPin, Users, DollarSign, FileText } from "lucide-react";
import Link from "next/link";

// Mock booking detail fetch - in real app would use useQuery
export default function BookingDetailPage() {
    const params = useParams();
    const bookingId = params.id as string;

    // In a real implementation, we would fetch the booking by ID
    // For now, showing a placeholder structure
    const isLoading = false;

    // Mock booking data
    const booking = {
        _id: bookingId,
        banquet: {
            _id: "banquet123",
            name: "Grand Palace Banquet Hall",
            address: "123 Main Street, Mumbai",
            city: "Mumbai",
        },
        eventDate: new Date("2024-06-15").toISOString(),
        guestCount: 150,
        status: "CONFIRMED",
        totalAmount: 75000,
        notes: "Need vegan menu options for 20 guests",
        createdAt: new Date("2024-01-10").toISOString(),
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
                    <p className="text-muted-foreground">Booking ID: {bookingId}</p>
                </div>
                <Badge
                    variant={
                        booking.status === "CONFIRMED" ? "default" :
                            booking.status === "COMPLETED" ? "outline" :
                                booking.status === "CANCELLED" ? "destructive" : "secondary"
                    }
                    className="text-lg px-4 py-1"
                >
                    {booking.status}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Venue Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold">{booking.banquet.name}</p>
                                <p className="text-sm text-muted-foreground">{booking.banquet.address}</p>
                                <p className="text-sm text-muted-foreground">{booking.banquet.city}</p>
                            </div>
                        </div>
                        <Link href={`/banquets/${booking.banquet._id}`}>
                            <Button variant="outline" className="w-full">View Venue Details</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Event Date</p>
                                <p className="font-semibold">{format(new Date(booking.eventDate), "MMMM d, yyyy")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Guest Count</p>
                                <p className="font-semibold">{booking.guestCount} guests</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="font-semibold text-lg">₹{booking.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {booking.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Additional Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{booking.notes}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Booking Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Booked on</span>
                            <span className="font-medium">{format(new Date(booking.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium">{booking.status}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
                <Button variant="outline" asChild>
                    <Link href="/dashboard/bookings">Back to Bookings</Link>
                </Button>
                {booking.status === "CONFIRMED" && (
                    <Button variant="destructive">Cancel Booking</Button>
                )}
            </div>
        </div>
    );
}
