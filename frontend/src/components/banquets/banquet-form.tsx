"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";


const banquetSchema = z.object({
    name: z.string().min(5, "Name must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Pincode must be valid"),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    pricePerPlate: z.coerce.number().min(0, "Price must be positive"),
    minimumGuests: z.coerce.number().min(1, "Minimum guests is required").optional(),
    amenities: z.array(z.string()).refine((value) => value.length > 0, {
        message: "Select at least one amenity",
    }),
    images: z.array(z.string()).min(1, "Upload at least one image"),
});


export const AMENITIES_LIST = [
    "AC", "Parking", "Catering", "Decor", "Alcohol Allowed", "DJ", "Valet", "Bridal Room", "Wifi", "Power Backup"
];

export type BanquetFormValues = z.infer<typeof banquetSchema>;

interface BanquetFormProps {
    defaultValues?: Partial<BanquetFormValues>;
    onSubmit: (values: BanquetFormValues) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
    onCancel: () => void;
}

export function BanquetForm({ defaultValues, onSubmit, isSubmitting, buttonText, onCancel }: BanquetFormProps) {
    const form = useForm<BanquetFormValues>({
        resolver: zodResolver(banquetSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            capacity: 100,
            pricePerPlate: 500,
            minimumGuests: 50,
            amenities: [],
            images: [],
            ...defaultValues,
        },
    });

    return (
        <Card className="max-w-2xl mx-auto w-full">
            <CardHeader>
                <CardTitle>Venue Details</CardTitle>
                <CardDescription>Provide all the information about your venue.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Grand Hotel" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe your venue..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="images"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue Images</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            maxFiles={5}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Upload up to 5 high-quality images of your venue.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, Opp. Station" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mumbai" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Maharashtra" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pincode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pincode</FormLabel>
                                        <FormControl>
                                            <Input placeholder="400001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Guest Capacity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pricePerPlate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price Per Plate (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minimumGuests"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Guests</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="amenities"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Amenities</FormLabel>
                                        <FormDescription>Select the amenities available at your venue.</FormDescription>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {AMENITIES_LIST.map((item) => (
                                            <FormField
                                                key={item}
                                                control={form.control}
                                                name="amenities"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={item}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, item])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== item
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {item}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {buttonText}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
