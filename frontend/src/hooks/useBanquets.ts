import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Banquet {
    _id: string;
    name: string;
    address: string;
    city: string;
    capacity: number;
    pricePerPlate: number;
    rating: number;
    isPublished: boolean;
    description?: string;
    reviewsCount?: number;
    amenities?: string[];
    images?: string[];
}

export interface CreateBanquetDto {
    name: string;
    description?: string;
    address: string;
    city: string;
    capacity: number;
    pricePerPlate: number;
    amenities?: string[];
    images?: string[];
}

export interface UpdateBanquetDto extends Partial<CreateBanquetDto> {
    isPublished?: boolean;
}

// Fetch Functions
async function fetchMyBanquets(): Promise<Banquet[]> {
    const { data } = await api.get("/banquets/my");
    return data.data;
}

async function fetchBanquetById(id: string): Promise<Banquet> {
    const { data } = await api.get(`/banquets/${id}`);
    return data.data;
}

async function createBanquet(data: CreateBanquetDto) {
    const { data: response } = await api.post("/banquets", data);
    return response.data;
}

async function updateBanquet({ id, data }: { id: string; data: UpdateBanquetDto }) {
    const { data: response } = await api.patch(`/banquets/${id}`, data);
    return response.data;
}

async function deleteBanquet(id: string) {
    const { data: response } = await api.delete(`/banquets/${id}`);
    return response.data;
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
