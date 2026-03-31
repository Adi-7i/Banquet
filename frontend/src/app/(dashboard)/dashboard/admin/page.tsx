"use client";

import { useAdminOverview } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, CalendarDays, DollarSign, AlertCircle, Clock } from "lucide-react";

export default function AdminDashboardPage() {
    const { data: stats, isLoading } = useAdminOverview();

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-20" /></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-10" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const cards = [
        { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
        { title: "Total Banquets", value: stats.totalBanquets, icon: Building2, color: "text-purple-500" },
        { title: "Active Bookings", value: stats.totalBookings, icon: CalendarDays, color: "text-green-500" },
        { title: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-yellow-500" },
        { title: "Pending Banquets", value: stats.pendingBanquets, icon: Clock, color: "text-orange-500" },
        { title: "Pending Reviews", value: stats.pendingReviews, icon: AlertCircle, color: "text-red-500" },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Admin Overview</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* We can add charts or recent activity lists here later */}
        </div>
    );
}
