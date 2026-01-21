"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value?: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5 }: ImageUploadProps) {
    const { uploadImage, isUploading } = useImageUpload();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (value.length + files.length > maxFiles) {
            alert(`You can only upload up to ${maxFiles} images.`);
            return;
        }

        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
            const url = await uploadImage(files[i]);
            newUrls.push(url);
        }
        onChange([...value, ...newUrls]);
    };

    const removeImage = (index: number) => {
        const newUrls = [...value];
        newUrls.splice(index, 1);
        onChange(newUrls);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                        <Image src={url} alt="Uploaded" fill className="object-cover" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeImage(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {value.length < maxFiles && (
                    <div className="flex items-center justify-center aspect-square border-2 border-dashed rounded-md hover:bg-muted/50 transition cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                                <ImagePlus className="h-8 w-8" />
                            )}
                            <span className="text-xs">{isUploading ? "Uploading..." : "Upload Image"}</span>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Max {maxFiles} images. Supported formats: JPG, PNG.
            </p>
        </div>
    );
}
