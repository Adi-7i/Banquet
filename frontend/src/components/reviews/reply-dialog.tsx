"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useReplyToReview } from "@/hooks/useReviews";
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";

const replySchema = z.object({
    content: z.string().min(10, "Reply must be at least 10 characters").max(1000, "Reply must not exceed 1000 characters"),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface ReplyDialogProps {
    reviewId: string;
    trigger?: React.ReactNode;
}

export function ReplyDialog({ reviewId, trigger }: ReplyDialogProps) {
    const [open, setOpen] = useState(false);
    const { mutate: replyToReview, isPending } = useReplyToReview();

    const form = useForm<ReplyFormValues>({
        resolver: zodResolver(replySchema),
        defaultValues: {
            content: "",
        },
    });

    function onSubmit(data: ReplyFormValues) {
        replyToReview(
            { id: reviewId, content: data.content },
            {
                onSuccess: () => {
                    setOpen(false);
                    form.reset();
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reply
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reply to Review</DialogTitle>
                    <DialogDescription>
                        Write a professional response to this review. Your reply will be visible to everyone.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Reply</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Thank you for your feedback..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Reply
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
