"use client";

import { useParams, useRouter } from "next/navigation";
import { useBanquet, useUpdateBanquet, UpdateBanquetDto } from "@/hooks/useBanquets";
import { BanquetForm, BanquetFormValues, AMENITIES_LIST } from "@/components/banquets/banquet-form";
import { Loader2 } from "lucide-react";

export default function EditBanquetPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: banquet, isLoading } = useBanquet(id);
    const { mutate: updateBanquet, isPending: isUpdating } = useUpdateBanquet();

    async function onSubmit(values: BanquetFormValues) {
        // Transform form data to match backend DTO
        const payload: UpdateBanquetDto = {
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
                acc[amenity.toLowerCase().replace(/\s+/g, "")] = true;
                return acc;
            }, {} as Record<string, any>),
            images: values.images,
        };

        updateBanquet({ id, data: payload }, {
            onSuccess: () => {
                router.push("/dashboard/banquets");
            }
        });
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!banquet) {
        return <div className="p-4">Banquet not found</div>;
    }

    // Transform banquet data for the form
    const formInitialValues = {
        name: banquet.name,
        description: banquet.description || "",
        address: banquet.address,
        city: banquet.city,
        state: banquet.state || "",
        pincode: banquet.pincode || "",
        capacity: banquet.capacity,
        pricePerPlate: banquet.pricing?.perPlate || 0,
        minimumGuests: banquet.pricing?.minimumGuests || 1,
        images: banquet.images || [],
        amenities: banquet.amenities ? Object.entries(banquet.amenities)
            .filter(([_, value]) => value === true)
            .map(([key]) => {
                // Find matching display name from AMENITIES_LIST
                const matching = AMENITIES_LIST.find(
                    a => a.toLowerCase().replace(/\s+/g, "") === key
                );
                return matching || key;
            }) : [],
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Edit Banquet</h1>
            </div>

            <BanquetForm
                defaultValues={formInitialValues}
                onSubmit={async (values) => onSubmit(values)}
                isSubmitting={isUpdating}
                buttonText="Update Banquet"
                onCancel={() => router.back()}
            />
        </div>
    );
}
