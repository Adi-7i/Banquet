"use client";

import { useState } from "react";
import { useMyBanquets, useDeleteBanquet, Banquet } from "@/hooks/useBanquets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
                {banquets?.filter(b => b?.id).map((banquet: Banquet) => (
                    <Card key={banquet.id} className="overflow-hidden group">
                        <div className="relative h-48 w-full overflow-hidden border-b">
                            <Image
                                src={banquet.images?.[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop"}
                                alt={banquet.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {!banquet.isPublished && (
                                <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="backdrop-blur-md bg-white/50">Draft</Badge>
                                </div>
                            )}
                        </div>
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
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/banquets/${banquet.id}/edit`}>Edit</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/banquets/${banquet.id}`}>View Details</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DeleteBanquetItem banquetId={banquet.id} />
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
                                    ₹{banquet.pricing?.perPlate || 0}/plate
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
                {(!banquets || banquets.length === 0) && (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">No banquets yet. Create your first banquet to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DeleteBanquetItem({ banquetId }: { banquetId: string }) {
    const [open, setOpen] = useState(false);
    const { mutate: deleteBanquet, isPending } = useDeleteBanquet();

    const handleDelete = () => {
        deleteBanquet(banquetId, {
            onSuccess: () => {
                setOpen(false);
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    Delete
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your banquet
                        and remove all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
