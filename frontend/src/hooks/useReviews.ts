import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface Review {
    _id: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    banquetId: string;
    banquet?: { // Added for My Reviews page
        _id: string;
        name: string;
        primaryImage: string;
    };
    rating: number;
    title?: string;
    content: string;
    photos?: { url: string; caption?: string }[];
    createdAt: string;
}

export interface CreateReviewDto {
    banquetId: string;
    rating: number;
    content: string;
    title?: string;
    photos?: { url: string; caption?: string }[];
}

async function fetchBanquetReviews(banquetId: string) {
    try {
        const { data } = await api.get(`/reviews/banquet/${banquetId}`);
        return data?.data || data || [];
    } catch (error) {
        console.error("Error fetching banquet reviews:", error);
        return [];
    }
}

async function fetchMyReviews() {
    try {
        const { data } = await api.get("/reviews/my");
        return data?.data || data || [];
    } catch (error) {
        console.error("Error fetching my reviews:", error);
        return [];
    }
}

async function createReview(data: CreateReviewDto) {
    const { data: response } = await api.post("/reviews", data);
    return response.data;
}

export function useReviews(banquetId: string) {
    return useQuery({
        queryKey: ["reviews", "banquet", banquetId],
        queryFn: () => fetchBanquetReviews(banquetId),
        enabled: !!banquetId,
    });
}

export function useMyReviews() {
    const { user } = useAuth();
    const isOwner = user?.role === "OWNER";

    return useQuery({
        queryKey: ["reviews", "my"],
        queryFn: fetchMyReviews,
        enabled: !isOwner, // Don't fetch if user is an owner (prevents 403)
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createReview,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reviews", "banquet", variables.banquetId] });
            queryClient.invalidateQueries({ queryKey: ["reviews", "my"] });
            queryClient.invalidateQueries({ queryKey: ["myBookings"] }); // Update booking status if connected
            toast.success("Review submitted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to submit review");
        },
    });
}
// ... existing code ...

async function replyToReview({ id, content }: { id: string; content: string }) {
    const { data } = await api.post(`/reviews/${id}/reply`, { content });
    return data.data;
}

export function useReplyToReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: replyToReview,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] }); // Invalidate all review queries
            toast.success("Reply submitted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to submit reply");
        },
    });
}
