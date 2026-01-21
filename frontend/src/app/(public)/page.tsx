"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, IndianRupee, TrendingUp, Compass } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BanquetCard, BanquetProps } from "@/components/banquet-card";
import { useQuery } from "@tanstack/react-query";
import { usePopularSearches, useTrendingLocations } from "@/hooks/useSearch";
import { Badge } from "@/components/ui/badge";
// import WaveAnimation from "@/components/ui/wave-animation";
import { IndianPatternBg } from "@/components/ui/indian-pattern-bg";

// Fetch trending function (mocked or real)
async function fetchTrendingBanquets() {
    // Mock data for initial display to look good immediately
    // Using valid MongoDB ObjectId format (24-character hex strings)
    return [
        {
            id: "677e8a1b2c3d4e5f6a7b8c9d",
            name: "Grand Palace Hotel",
            address: "123 Main St",
            city: "Mumbai",
            capacity: 500,
            pricePerPlate: 1200,
            rating: 4.8,
            amenities: ["AC", "Parking", "Catering"],
            primaryImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop"
        },
        {
            id: "677e8a1b2c3d4e5f6a7b8c9e",
            name: "Sea View Banquets",
            address: "45 Beach Road",
            city: "Goa",
            capacity: 200,
            pricePerPlate: 2500,
            rating: 4.5,
            amenities: ["Sea View", "Bar", "DJ"],
            primaryImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
        },
        {
            id: "677e8a1b2c3d4e5f6a7b8c9f",
            name: "Royal Garden",
            address: "88 Garden Lane",
            city: "Delhi",
            capacity: 1000,
            pricePerPlate: 800,
            rating: 4.2,
            amenities: ["Open Lawn", "Valet", "Decor"],
            primaryImage: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg"
        }
    ] as BanquetProps[];
}

export default function HomePage() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const { data: trendingBanquets, isLoading } = useQuery({
        queryKey: ["trendingBanquets"],
        queryFn: fetchTrendingBanquets,
    });

    const { data: popularSearches } = usePopularSearches();
    const { data: trendingLocations } = useTrendingLocations();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center bg-muted">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg"
                        alt="Hero"
                        className="w-full h-full object-cover brightness-50"
                    />
                </div>
                {/* <WaveAnimation /> */}
                <div className="relative z-10 container px-4 md:px-6 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Find the Perfect Venue for Your Event
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
                        Discover and book the best banquet halls, party lawns, and event spaces across the country.
                    </p>

                    <div className="bg-background/10 backdrop-blur-md p-4 rounded-lg max-w-3xl mx-auto shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                            <div className="relative flex-1">
                                <Input
                                    className="pl-10 h-12 bg-background border-none text-foreground text-lg" // Increased text size
                                    placeholder="Search by city, venue name..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            </div>
                            <Button type="submit" size="lg" className="h-12 px-8 font-semibold text-base transition-transform hover:scale-105">
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Popular Tags */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        <span className="text-sm text-gray-300 mr-2 flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Trending:</span>
                        {/* Mock or Real Popular Searches */}
                        {(popularSearches?.length ? popularSearches : ["Wedding Hall", "Poolside", "Goa Beach", "Corporate"]).slice(0, 4).map((tag: string) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-white/20 hover:bg-white/30 text-white cursor-pointer backdrop-blur-sm"
                                onClick={() => router.push(`/search?q=${tag}`)}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trending Locations Section (New) */}
            <section className="py-12 bg-muted/20 border-b">
                <div className="container px-4 md:px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8 text-muted-foreground">
                        <Compass className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-widest">Explore Top Destinations</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(trendingLocations?.length ? trendingLocations : ["Mumbai", "Delhi", "Bangalore", "Goa"]).map((city: string) => (
                            <div
                                key={city}
                                className="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer"
                                onClick={() => router.push(`/search?cities=${city}`)}
                            >
                                <img
                                    src={`/images/cities/${city.toLowerCase()}.png`} // Local dynamic image
                                    alt={city}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                    <h3 className="text-white text-xl font-bold tracking-wide">{city}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Venues Section */}
            <section className="py-16 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Trending Venues</h2>
                            <p className="text-muted-foreground mt-2">Most booked venues this month</p>
                        </div>
                        <Button variant="outline" asChild>
                            <a href="/search">View All</a>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            // Skeletons
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-[350px] bg-muted animate-pulse rounded-xl" />
                            ))
                        ) : (
                            trendingBanquets?.map((banquet) => (
                                <BanquetCard key={banquet.id} banquet={banquet} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-muted/30 border-t relative overflow-hidden">
                <IndianPatternBg pattern="lotus" opacity={0.08} />
                <div className="container px-4 text-center relative z-10">
                    <h2 className="text-3xl font-bold mb-12">Why Book With Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 bg-background rounded-lg shadow-sm border transition-shadow hover:shadow-md">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Prime Locations</h3>
                            <p className="text-muted-foreground">Access premium venues in top cities with verified listings.</p>
                        </div>
                        <div className="p-6 bg-background rounded-lg shadow-sm border transition-shadow hover:shadow-md">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <Star className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Verified Reviews</h3>
                            <p className="text-muted-foreground">Make informed decisions with reliable customer ratings and reviews.</p>
                        </div>
                        <div className="p-6 bg-background rounded-lg shadow-sm border transition-shadow hover:shadow-md">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <IndianRupee className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
                            <p className="text-muted-foreground">Transparent pricing with no hidden charges and direct booking.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
