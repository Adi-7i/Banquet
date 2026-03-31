import React from "react";
import { cn } from "@/lib/utils";

interface IndianPatternBgProps extends React.HTMLAttributes<HTMLDivElement> {
    pattern?: "lotus" | "peacock" | "mandala" | "floral";
    opacity?: number;
}

const patterns = {
    lotus: "/images/Modern Lotus Scrollwork.png",
    peacock: "/images/Stylized Peacock Motif.png",
    mandala: "/images/Modern Muted Palette.png", // Using this as a mandala/abstract placeholder
    floral: "/images/Floral Petal Texture.png",
};

export function IndianPatternBg({
    className,
    pattern = "lotus",
    opacity = 0.05,
    ...props
}: IndianPatternBgProps) {
    return (
        <div
            className={cn("absolute inset-0 pointer-events-none -z-10 overflow-hidden", className)}
            {...props}
        >
            <div
                className="absolute inset-0 bg-repeat bg-center"
                style={{
                    backgroundImage: `url('${patterns[pattern]}')`,
                    backgroundSize: "cover", // or contain depending on the texture
                    opacity: opacity,
                }}
            />
        </div>
    );
}
