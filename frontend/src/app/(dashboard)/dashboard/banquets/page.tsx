"use client";

import { useMyBanquets } from "@/hooks/useBanquets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Users } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function BanquetsPage() {
    const { data: banquets, isLoading } = useMyBanquets();

    if (isLoading) {
        return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Banquets</h1>
                    <p className="text-muted-foreground">Manage your venues and listings.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/banquets/create">
                        <Plus className="mr-2 h-4 w-4" /> Add Banquet
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {banquets?.map((banquet) => (
                    <Card key={banquet._id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{banquet.name}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {banquet.city}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Users className="h-4 w-4 mr-1" />
                                    {banquet.capacity}
                                </div>
                                <div className="font-semibold text-sm">
                                    ₹{banquet.pricePerPlate}/plate
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={banquet.isPublished ? "default" : "secondary"}>
                                    {banquet.isPublished ? "Published" : "Draft"}
                                </Badge>
                                <div className="text-sm text-muted-foreground ml-auto">
                                    {banquet.rating} ★
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
