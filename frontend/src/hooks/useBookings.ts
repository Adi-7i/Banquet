import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
    const { data } = await api.get("/bookings/my");
    return data.data;
}

async function fetchOwnerBookings() {
    // Assuming backend endpoint for owner bookings exists
    const { data } = await api.get("/bookings/owner");
    return data.data;
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
    return useQuery({
        queryKey: ["myBookings"],
        queryFn: fetchMyBookings,
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
