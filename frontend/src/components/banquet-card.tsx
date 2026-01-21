import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Star, IndianRupee } from "lucide-react";
import Image from "next/image"; // Note: Ensure domain handling in next.config.ts if using external images

export interface BanquetProps {
    id: string; // MongoDB ObjectId as string
    name: string;
    address: string;
    city: string;
    capacity: number;
    pricePerPlate: number;
    rating?: number;
    reviewCount?: number;
    primaryImage?: string;
    amenities?: string[];
}

export function BanquetCard({ banquet }: { banquet: BanquetProps }) {
    return (
        <Card className="overflow-hidden bg-card transition-all hover:shadow-lg">
            <div className="aspect-video w-full relative bg-muted">
                {/* Placeholder if no image */}
                {banquet.primaryImage ? (
                    <img
                        src={banquet.primaryImage}
                        alt={banquet.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No Image
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="backdrop-blur bg-background/80">
                        <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
                        {banquet.rating?.toFixed(1) || "New"}
                    </Badge>
                </div>
            </div>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{banquet.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="mr-1 h-3 w-3" />
                            {banquet.address}, {banquet.city}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Up to {banquet.capacity} guests</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {banquet.amenities && typeof banquet.amenities === 'object' && (
                        <>
                            {Object.entries(banquet.amenities)
                                .filter(([_, value]) => value === true)
                                .slice(0, 3)
                                .map(([key]) => (
                                    <Badge key={key} variant="outline" className="text-xs font-normal">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </Badge>
                                ))}
                            {Object.entries(banquet.amenities).filter(([_, v]) => v === true).length > 3 && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    +{Object.entries(banquet.amenities).filter(([_, v]) => v === true).length - 3}
                                </Badge>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t flex items-center justify-between bg-muted/20">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Starting from</span>
                    <div className="flex items-center font-bold text-lg text-primary">
                        <IndianRupee className="h-4 w-4" />
                        {banquet.pricePerPlate}
                        <span className="text-sm font-normal text-muted-foreground ml-1">/ plate</span>
                    </div>
                </div>
                <Button asChild>
                    <Link href={`/banquets/${banquet.id}`}>View Details</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
