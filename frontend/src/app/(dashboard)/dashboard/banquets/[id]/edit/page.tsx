"use client";

import { useParams, useRouter } from "next/navigation";
import { useBanquet, useUpdateBanquet, UpdateBanquetDto } from "@/hooks/useBanquets";
import { BanquetForm, BanquetFormValues } from "@/components/banquets/banquet-form";
import { Loader2 } from "lucide-react";

export default function EditBanquetPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: banquet, isLoading } = useBanquet(id);
    const { mutate: updateBanquet, isPending: isUpdating } = useUpdateBanquet();

    async function onSubmit(values: BanquetFormValues) {
        const payload: UpdateBanquetDto = {
            ...values,
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

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Edit Banquet</h1>
            </div>

            <BanquetForm
                defaultValues={{
                    name: banquet.name,
                    description: banquet.description || "",
                    address: banquet.address,
                    city: banquet.city,
                    capacity: banquet.capacity,
                    pricePerPlate: banquet.pricePerPlate,
                    amenities: banquet.amenities || [],
                }}
                onSubmit={async (values) => onSubmit(values)}
                isSubmitting={isUpdating}
                buttonText="Update Banquet"
                onCancel={() => router.back()}
            />
        </div>
    );
}
