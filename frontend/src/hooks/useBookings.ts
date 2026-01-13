import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Booking {
    _id: string;
    banquet: {
        _id: string;
        name: string;
        primaryImage?: string;
    };
    eventDate: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    totalAmount: number;
}

async function fetchMyBookings() {
    // const { data } = await api.get("/bookings/my");
    // return data.data;

    // Mock Data
    return [
        {
            _id: "b1",
            banquet: { _id: "1", name: "Grand Palace Hotel", primaryImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop" },
            eventDate: "2024-12-25",
            status: "CONFIRMED",
            totalAmount: 150000
        },
        {
            _id: "b2",
            banquet: { _id: "2", name: "Sea View Banquets", primaryImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop" },
            eventDate: "2025-01-10",
            status: "PENDING",
            totalAmount: 50000
        }
    ] as Booking[];
}

export function useBookings() {
    return useQuery({
        queryKey: ["myBookings"],
        queryFn: fetchMyBookings,
    });
}
