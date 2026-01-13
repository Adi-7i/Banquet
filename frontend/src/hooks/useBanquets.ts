import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

async function fetchMyBanquets() {
    // const { data } = await api.get("/banquets/my");
    // return data.data;

    // Mock Data
    return [
        {
            _id: "1",
            name: "Grand Palace Hotel",
            address: "123 Main St",
            city: "Mumbai",
            capacity: 500,
            pricePerPlate: 1200,
            rating: 4.8,
            isPublished: true
        },
        {
            _id: "2",
            name: "Sea View Banquets",
            address: "45 Beach Road",
            city: "Goa",
            capacity: 200,
            pricePerPlate: 2500,
            rating: 4.5,
            isPublished: false
        }
    ] as Banquet[];
}

async function fetchBanquetById(id: string) {
    // const { data } = await api.get(`/banquets/${id}`);
    // return data.data;

    // Mock Individual Fetch
    const mockBanquets: Record<string, any> = {
        "1": {
            _id: "1",
            name: "Grand Palace Hotel",
            description: "A luxurious venue perfect for weddings and corporate events. Features state-of-the-art facilities and exceptional service.",
            address: "123 Main St",
            city: "Mumbai",
            capacity: 500,
            pricePerPlate: 1200,
            rating: 4.8,
            reviewsCount: 124,
            amenities: ["AC", "Parking", "Catering", "Decor", "Wifi", "Bridal Room"],
            images: [
                "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=2098&auto=format&fit=crop",
            ],
            isPublished: true
        },
        "2": {
            _id: "2",
            name: "Sea View Banquets",
            description: "Beautiful sea view banquet for memorable events.",
            address: "45 Beach Road",
            city: "Goa",
            capacity: 200,
            pricePerPlate: 2500,
            rating: 4.5,
            reviewsCount: 89,
            amenities: ["Sea View", "Bar", "DJ"],
            images: [
                "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
            ],
            isPublished: false
        }
    };
    return mockBanquets[id] || mockBanquets["1"];
}

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
    });
}
