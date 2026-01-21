"use client";

import { useMyBanquets } from "@/hooks/useBanquets";
import { useOwnerBookings, Booking } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, Building, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function OwnerAnalyticsPage() {
    const { data: banquets, isLoading: isBanquetsLoading } = useMyBanquets();
    const { data: bookings, isLoading: isBookingsLoading } = useOwnerBookings();

    if (isBanquetsLoading || isBookingsLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-[300px]" />
            </div>
        );
    }

    const totalVenues = banquets?.length || 0;
    const totalBookings = bookings?.length || 0;
    const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0) || 0;

    // Calculate average occupancy or other stats if needed
    // For now, let's show confirmed bookings
    const confirmedBookings = bookings?.filter((b: any) => b.status === "CONFIRMED" || b.status === "COMPLETED").length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <p className="text-muted-foreground">Overview of your venue performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all venues
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookings}</div>
                        <p className="text-xs text-muted-foreground">
                            {confirmedBookings} confirmed/completed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Venues</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVenues}</div>
                        <p className="text-xs text-muted-foreground">
                            Listed on platform
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bookings?.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No bookings yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {bookings?.slice(0, 5).map((booking: any) => (
                                    <div key={booking._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{booking.banquet.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(booking.eventDate), "PPP")} • {booking.guestCount} guests
                                            </p>
                                        </div>
                                        <div className="font-medium">
                                            ₹{booking.totalAmount.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
