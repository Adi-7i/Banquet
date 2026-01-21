"use client";

import { useAdminBanquets, useAdminBanquetActions } from "@/hooks/useAdmin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useState } from "react";

export default function AdminBanquetsPage() {
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING">("PENDING");
    const { data: banquets, isLoading } = useAdminBanquets(statusFilter);
    const { approveBanquet, rejectBanquet } = useAdminBanquetActions();

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Banquet Moderation</h2>
            </div>

            <Tabs defaultValue="PENDING" onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList>
                    <TabsTrigger value="PENDING">Pending Approval</TabsTrigger>
                    <TabsTrigger value="ALL">All Banquets</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="mt-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Banquet Name</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!banquets || banquets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No banquets found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    banquets?.map((banquet) => (
                                        <TableRow key={banquet._id}>
                                            <TableCell className="font-medium">{banquet.name}</TableCell>
                                            <TableCell>{banquet.city}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{banquet.owner.firstName} {banquet.owner.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{banquet.owner.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        banquet.status === "APPROVED" ? "default" :
                                                            banquet.status === "REJECTED" ? "destructive" : "secondary"
                                                    }
                                                >
                                                    {banquet.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(banquet.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild title="View Details">
                                                        <Link href={`/banquets/${banquet._id}`} target="_blank">
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {banquet.status === "PENDING" && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => approveBanquet(banquet._id)}
                                                                title="Approve"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => rejectBanquet(banquet._id)}
                                                                title="Reject"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
