"use client";

import { useAdminReviews, useAdminReviewActions } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminReviewsPage() {
    const { data: reviews, isLoading } = useAdminReviews();
    const { approveReview, rejectReview } = useAdminReviewActions();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Review Moderation</h2>
                <p className="text-muted-foreground">Approve or reject pending customer reviews.</p>
            </div>

            <div className="grid gap-4">
                {reviews?.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-muted-foreground">No pending reviews found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    reviews?.map((review: any) => (
                        <Card key={review._id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-semibold">
                                            {review.banquet.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        by {review.user.firstName} {review.user.lastName}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    <span className="font-semibold">{review.rating}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm mt-2 mb-4">{review.content}</p>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => rejectReview(review._id)}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => approveReview(review._id)}
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
