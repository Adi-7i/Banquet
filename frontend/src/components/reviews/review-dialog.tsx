"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/hooks/useReviews";
import { toast } from "sonner";

const reviewSchema = z.object({
    rating: z.number().min(1, "Please select a rating").max(5),
    content: z.string().min(5, "Review must be at least 5 characters"),
});

interface ReviewDialogProps {
    banquetId: string;
    banquetName: string;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function ReviewDialog({ banquetId, banquetName, trigger, onSuccess }: ReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const { mutate: submitReview, isPending } = useCreateReview();

    const form = useForm<z.infer<typeof reviewSchema>>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            content: "",
        },
    });

    function onSubmit(values: z.infer<typeof reviewSchema>) {
        submitReview(
            {
                banquetId,
                rating: values.rating,
                content: values.content,
            },
            {
                onSuccess: () => {
                    toast.success("Review submitted successfully");
                    setOpen(false);
                    form.reset();
                    onSuccess?.();
                },
                onError: (error: any) => {
                    toast.error(error?.formattedMessage || "Failed to submit review");
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Leave a Review</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review {banquetName}</DialogTitle>
                    <DialogDescription>
                        Share your experience to help others.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`p-1 transition-colors ${star <= field.value ? "text-yellow-500" : "text-gray-300"
                                                    }`}
                                                onClick={() => field.onChange(star)}
                                            >
                                                <Star className="h-8 w-8 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write your review here..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
