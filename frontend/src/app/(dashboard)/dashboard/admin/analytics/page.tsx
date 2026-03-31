"use client";

import { useFunnelMetrics, useRevenueMetrics, useUserActivityMetrics, useSystemHealth } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, DollarSign, Users, Search, ArrowRight, Server } from "lucide-react";

export default function AdminAnalyticsPage() {
    const { data: funnel } = useFunnelMetrics();
    const { data: revenue } = useRevenueMetrics();
    const { data: userActivity } = useUserActivityMetrics();
    const { data: health } = useSystemHealth();

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Platform Analytics</h2>

            {/* System Health Banner */}
            {health && (
                <div className={`p-4 rounded-lg border flex items-center gap-4 ${health.status === 'healthy' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <Server className="h-5 w-5" />
                    <div className="flex-1 font-medium">System Status: {health.status.toUpperCase()}</div>
                    <div className="text-sm">
                        Uptime: {Math.floor(health.uptime / 3600)}h • CPU: {health.cpuUsage}% • Mem: {health.memoryUsage}%
                    </div>
                </div>
            )}

            {/* Booking Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle>Booking Conversion Funnel</CardTitle>
                    <CardDescription>Track user journey from page view to confirmed booking</CardDescription>
                </CardHeader>
                <CardContent>
                    {funnel ? (
                        <div className="flex items-center justify-between text-center py-6 px-4">
                            <div className="flex flex-col gap-2">
                                <div className="text-3xl font-bold">{funnel.pageViews}</div>
                                <div className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
                                    <Activity className="h-3 w-3" /> Page Views
                                </div>
                            </div>
                            <ArrowRight className="text-muted-foreground/30 h-8 w-8" />
                            <div className="flex flex-col gap-2">
                                <div className="text-3xl font-bold">{funnel.searches}</div>
                                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                    <Search className="h-3 w-3" /> Searches
                                </div>
                            </div>
                            <ArrowRight className="text-muted-foreground/30 h-8 w-8" />
                            <div className="flex flex-col gap-2">
                                <div className="text-3xl font-bold">{funnel.banquetViews}</div>
                                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                    <Activity className="h-3 w-3" /> Views
                                </div>
                            </div>
                            <ArrowRight className="text-muted-foreground/30 h-8 w-8" />
                            <div className="flex flex-col gap-2">
                                <div className="text-3xl font-bold">{funnel.bookingCompleted}</div>
                                <div className="text-sm text-muted-foreground font-semibold text-green-600 flex items-center justify-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Bookings
                                </div>
                            </div>
                        </div>
                    ) : <Skeleton className="h-32 w-full" />}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenue ? (
                            <div className="space-y-4">
                                <div className="text-4xl font-bold text-green-600">${revenue.totalRevenue.toLocaleString()}</div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Recent Daily Revenue</h4>
                                    {revenue.dailyRevenue.slice(0, 5).map((day: any) => (
                                        <div key={day.date} className="flex justify-between text-sm border-b py-2 last:border-0">
                                            <span>{day.date}</span>
                                            <span className="font-medium">${day.revenue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <Skeleton className="h-40 w-full" />}
                    </CardContent>
                </Card>

                {/* User Growth */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userActivity ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Users className="h-8 w-8 text-blue-500" />
                                    <div className="text-4xl font-bold">{userActivity.activeUsers}</div>
                                    <div className="text-sm text-muted-foreground">Active Users</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">New Registrations</h4>
                                    {userActivity.newRegistrations.slice(0, 5).map((day: any) => (
                                        <div key={day.date} className="flex justify-between text-sm border-b py-2 last:border-0">
                                            <span>{day.date}</span>
                                            <span className="font-medium">+{day.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <Skeleton className="h-40 w-full" />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
