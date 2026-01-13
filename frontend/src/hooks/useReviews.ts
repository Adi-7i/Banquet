import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Review {
    _id: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    banquetId: string;
    rating: number;
    content: string;
    createdAt: string;
}

export interface CreateReviewDto {
    banquetId: string;
    rating: number;
    content: string;
}

async function fetchReviews(banquetId: string) {
    // const { data } = await api.get(`/reviews?banquetId=${banquetId}`);
    // return data.data;

    // Mock Data
    return [
        {
            _id: "r1",
            user: { _id: "u1", firstName: "Alice", lastName: "Smith" },
            banquetId: banquetId,
            rating: 5,
            content: "Amazing venue! Had a great time.",
            createdAt: new Date().toISOString(),
        },
        {
            _id: "r2",
            user: { _id: "u2", firstName: "Bob", lastName: "Jones" },
            banquetId: banquetId,
            rating: 4,
            content: "Good food, but parking was tight.",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
    ] as Review[];
}

async function createReview(data: CreateReviewDto) {
    const { data: response } = await api.post("/reviews", data);
    return response.data;
}

export function useReviews(banquetId: string) {
    return useQuery({
        queryKey: ["reviews", banquetId],
        queryFn: () => fetchReviews(banquetId),
        enabled: !!banquetId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createReview,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reviews", variables.banquetId] });
            // Also invalidate bookings to update status if needed
            queryClient.invalidateQueries({ queryKey: ["myBookings"] });
        },
    });
}
