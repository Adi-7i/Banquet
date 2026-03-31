"use client";

import { useAdminTickets, useAdminTicketActions } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function AdminTicketsPage() {
    const [statusFilter, setStatusFilter] = useState("OPEN");
    const { data: tickets, isLoading } = useAdminTickets(statusFilter === "ALL" ? undefined : statusFilter);
    const { resolveTicket } = useAdminTicketActions();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "HIGH": return "text-red-500 bg-red-100 dark:bg-red-900/20";
            case "MEDIUM": return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20";
            case "LOW": return "text-green-500 bg-green-100 dark:bg-green-900/20";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Support Tickets</h2>
                <p className="text-muted-foreground">Manage user inquiries and issues.</p>
            </div>

            <Tabs defaultValue="OPEN" onValueChange={setStatusFilter} className="w-full">
                <TabsList>
                    <TabsTrigger value="OPEN">Open</TabsTrigger>
                    <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
                    <TabsTrigger value="ALL">All Tickets</TabsTrigger>
                </TabsList>
                <TabsContent value={statusFilter} className="mt-4">
                    <div className="grid gap-4">
                        {tickets?.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center">
                                    <p className="text-muted-foreground">No tickets found.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            tickets?.map((ticket: any) => (
                                <Card key={ticket._id}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                {ticket.subject}
                                                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                                    {ticket.priority}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>
                                                From: {ticket.user?.firstName} {ticket.user?.lastName} • {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                                            </CardDescription>
                                        </div>
                                        {ticket.status === "OPEN" && (
                                            <Button size="sm" onClick={() => resolveTicket(ticket._id)}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
                                            </Button>
                                        )}
                                        {ticket.status === "RESOLVED" && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Resolved</Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            Status: <span className="font-medium text-foreground">{ticket.status}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
