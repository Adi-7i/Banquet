"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";

// Mock Hook for now
function useMyReviews() {
    return useQuery({
        queryKey: ["myReviews"],
        queryFn: async () => {
            // Mock Data
            return [
                {
                    _id: "1",
                    banquet: {
                        name: "Grand Palace Hotel",
                        id: "1",
                        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop"
                    },
                    rating: 5,
                    content: "Absolutely amazing experience! The staff was very helpful.",
                    createdAt: new Date().toISOString(),
                },
                {
                    _id: "2",
                    banquet: {
                        name: "Sea View Banquets",
                        id: "2",
                        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
                    },
                    rating: 4,
                    content: "Great view but the food could be better.",
                    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                }
            ];
        }
    });
}

export default function MyReviewsPage() {
    const { data: reviews, isLoading } = useMyReviews();

    return (
        <div className="flex flex-col gap-6 p-6">
            <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>

            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            )}

            {!isLoading && reviews?.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't written any reviews yet.</p>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviews?.map((review) => (
                    <Card key={review._id} className="overflow-hidden">
                        <div className="h-32 w-full overflow-hidden relative">
                            <img
                                src={review.banquet.image}
                                alt={review.banquet.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                <h3 className="text-white font-semibold truncate">{review.banquet.name}</h3>
                            </div>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-yellow-500">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-muted stroke-muted-foreground"}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">"{review.content}"</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
