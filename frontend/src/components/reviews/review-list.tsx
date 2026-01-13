"use client";

import { useReviews } from "@/hooks/useReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
    banquetId: string;
}

export function ReviewList({ banquetId }: ReviewListProps) {
    const { data: reviews, isLoading } = useReviews(banquetId);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/50">
                <p>No reviews yet.</p>
                <p className="text-sm">Be the first to review this banquet!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
                <Card key={review._id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.user.firstName} ${review.user.lastName}`} />
                            <AvatarFallback>{review.user.firstName[0]}{review.user.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">{review.user.firstName} {review.user.lastName}</h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </div>
                        </div>
                        <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-500">{review.rating}</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
