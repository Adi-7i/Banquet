import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface Booking {
    _id: string;
    banquet: {
        _id: string;
        name: string;
        primaryImage?: string;
    };
    user?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    eventDate: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    totalAmount: number;
    guestCount: number;
    notes?: string;
    createdAt?: string;
}

export interface CreateBookingDto {
    banquetId: string;
    eventDate: string; // YYYY-MM-DD or ISO string
    guestCount: number;
    notes?: string;
}

async function fetchMyBookings() {
    try {
        const { data } = await api.get("/bookings/my");
        return data?.data || data || [];
    } catch (error) {
        console.error("Error fetching my bookings:", error);
        return [];
    }
}

async function fetchOwnerBookings() {
    try {
        const { data } = await api.get("/bookings/owner");
        return data?.data || data || [];
    } catch (error) {
        console.error("Error fetching owner bookings:", error);
        return [];
    }
}

async function createBooking(data: CreateBookingDto) {
    const { data: response } = await api.post("/bookings", data);
    return response.data;
}

async function updateBookingStatus({ id, status }: { id: string; status: string }) {
    const { data: response } = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
}

export function useBookings() {
    const { user } = useAuth();
    const isOwner = user?.role === "OWNER";

    return useQuery({
        queryKey: ["myBookings"],
        queryFn: fetchMyBookings,
        enabled: !isOwner, // Don't fetch if user is an owner (prevents 403)
    });
}

export function useOwnerBookings() {
    return useQuery({
        queryKey: ["ownerBookings"],
        queryFn: fetchOwnerBookings,
    });
}

export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBooking,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myBookings"] });
            toast.success("Booking request sent successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create booking");
        },
    });
}

export function useUpdateBookingStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBookingStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ownerBookings"] });
            queryClient.invalidateQueries({ queryKey: ["myBookings"] }); // In case owner is also a customer
            toast.success("Booking status updated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update booking status");
        },
    });
}
