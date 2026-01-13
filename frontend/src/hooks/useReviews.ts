import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
    const { data } = await api.get(`/reviews/banquet/${banquetId}`);
    return data.data; // Assuming backend returns { data: Review[], meta: ... } or just data array
}

async function fetchMyReviews() {
    const { data } = await api.get("/reviews/my");
    return data.data;
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
    return useQuery({
        queryKey: ["reviews", "my"],
        queryFn: fetchMyReviews,
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
