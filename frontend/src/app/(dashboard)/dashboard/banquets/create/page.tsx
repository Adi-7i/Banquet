"use client";

import { useRouter } from "next/navigation";
import { useCreateBanquet, CreateBanquetDto } from "@/hooks/useBanquets";
import { BanquetForm, BanquetFormValues } from "@/components/banquets/banquet-form";

export default function CreateBanquetPage() {
    const router = useRouter();
    const { mutate: createBanquet, isPending } = useCreateBanquet();

    async function onSubmit(values: BanquetFormValues) {
        // Add default temporary image for MVP if missing
        const payload: CreateBanquetDto = {
            ...values,
            images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop"],
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
