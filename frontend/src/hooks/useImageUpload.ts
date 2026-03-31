import { useState } from "react";
import { toast } from "sonner";

export function useImageUpload() {
    const [isUploading, setIsUploading] = useState(false);

    const uploadImage = async (file: File): Promise<string> => {
        setIsUploading(true);
        // Mock upload delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Return a mock URL (ideally this would be a real upload to S3/Cloudinary)
        // Using Unsplash images for realistic look
        const mockUrls = [
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc6?q=80&w=2069&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2162&auto=format&fit=crop"
        ];
        const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];

        setIsUploading(false);
        toast.success("Image uploaded successfully!");
        return randomUrl;
    };

    return { uploadImage, isUploading };
}
