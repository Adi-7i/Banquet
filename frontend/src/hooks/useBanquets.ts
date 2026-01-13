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

export function useMyBanquets() {
    return useQuery({
        queryKey: ["myBanquets"],
        queryFn: fetchMyBanquets,
    });
}
