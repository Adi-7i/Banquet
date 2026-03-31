"use client";

import { useRouter } from "next/navigation";
import { useCreateBanquet, CreateBanquetDto } from "@/hooks/useBanquets";
import { BanquetForm, BanquetFormValues } from "@/components/banquets/banquet-form";

export default function CreateBanquetPage() {
    const router = useRouter();
    const { mutate: createBanquet, isPending } = useCreateBanquet();

    async function onSubmit(values: BanquetFormValues) {
        // Transform form data to match backend DTO
        const payload: CreateBanquetDto = {
            name: values.name,
            description: values.description,
            address: values.address,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
            capacity: values.capacity,
            pricing: {
                perPlate: values.pricePerPlate,
                minimumGuests: values.minimumGuests || 50,
            },
            amenities: values.amenities.reduce((acc, amenity) => {
                acc[amenity.toLowerCase().replace(/\s+/g, '')] = true;
                return acc;
            }, {} as Record<string, any>),
            images: values.images,
        };

        createBanquet(payload, {
            onSuccess: () => {
                router.push("/dashboard/banquets");
            }
        });
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Add New Banquet</h1>
            </div>

            <BanquetForm
                onSubmit={async (values) => onSubmit(values)}
                isSubmitting={isPending}
                buttonText="Create Banquet"
                onCancel={() => router.back()}
            />
        </div>
    );
}
