import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Banquet {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    capacity: number;
    pricing: {
        perPlate?: number;
        minimumGuests?: number;
        [key: string]: any;
    };
    rating: number;
    isPublished: boolean;
    description?: string;
    reviewsCount?: number;
    amenities?: Record<string, any>;
    images?: string[];
}

export interface CreateBanquetDto {
    name: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    capacity: number;
    pricing: Record<string, any>;
    amenities?: Record<string, any>;
    images?: string[];
}

export interface UpdateBanquetDto extends Partial<CreateBanquetDto> {
    isPublished?: boolean;
}

// Fetch Functions
async function fetchMyBanquets(): Promise<Banquet[]> {
    try {
        const { data } = await api.get("/banquets/my");
        // Ensure we return an array even if the response structure is unexpected
        return data?.data || data || [];
    } catch (error) {
        console.error("Error fetching banquets:", error);
        // Return empty array instead of undefined to prevent React Query error
        return [];
    }
}

async function fetchBanquetById(id: string): Promise<Banquet> {
    try {
        const { data } = await api.get(`/banquets/${id}`);
        return data?.data || data;
    } catch (error) {
        console.error("Error fetching banquet:", error);
        throw error; // Re-throw to let React Query handle the error state
    }
}

async function createBanquet(data: CreateBanquetDto) {
    try {
        const { data: response } = await api.post("/banquets", data);
        return response?.data || response;
    } catch (error) {
        console.error("Error creating banquet:", error);
        throw error;
    }
}

async function updateBanquet({ id, data }: { id: string; data: UpdateBanquetDto }) {
    try {
        const { data: response } = await api.patch(`/banquets/${id}`, data);
        return response?.data || response;
    } catch (error) {
        console.error("Error updating banquet:", error);
        throw error;
    }
}

async function deleteBanquet(id: string) {
    try {
        const { data: response } = await api.delete(`/banquets/${id}`);
        return response?.data || response;
    } catch (error) {
        console.error("Error deleting banquet:", error);
        throw error;
    }
}

// Hooks
export function useMyBanquets() {
    return useQuery({
        queryKey: ["myBanquets"],
        queryFn: fetchMyBanquets,
    });
}

export function useBanquet(id: string) {
    return useQuery({
        queryKey: ["banquet", id],
        queryFn: () => fetchBanquetById(id),
        enabled: !!id,
    });
}

export function useCreateBanquet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBanquet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myBanquets"] });
            toast.success("Banquet created successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create banquet");
        },
    });
}

export function useUpdateBanquet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBanquet,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["myBanquets"] });
            queryClient.invalidateQueries({ queryKey: ["banquet", variables.id] });
            toast.success("Banquet updated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update banquet");
        },
    });
}

export function useDeleteBanquet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBanquet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myBanquets"] });
            toast.success("Banquet deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete banquet");
        },
    });
}
