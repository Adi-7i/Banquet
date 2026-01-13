"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, IndianRupee } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BanquetCard, BanquetProps } from "@/components/banquet-card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch trending function (mocked or real)
async function fetchTrendingBanquets() {
    // Use real API if available, else mock
    // const { data } = await api.get("/search/banquets", { params: { limit: 3, sort: "rating_high" } });
    // return data.data; 

    // Mock data for initial display to look good immediately
    return [
        {
            _id: "1",
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
            _id: "2",
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
            _id: "3",
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
                <div className="relative z-10 container px-4 md:px-6 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
                        Find the Perfect Venue for Your Event
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                        Discover and book the best banquet halls, party lawns, and event spaces across the country.
                    </p>

                    <div className="bg-background/10 backdrop-blur-md p-4 rounded-lg max-w-3xl mx-auto">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                            <div className="relative flex-1">
                                <Input
                                    className="pl-10 h-12 bg-background border-none text-foreground"
                                    placeholder="Search by city, venue name..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            </div>
                            {/* 
                <div className="relative flex-1 hidden md:block">
                   <Input 
                     className="pl-10 h-12 bg-background border-none text-foreground"
                     placeholder="Select Date"
                     type="date"
                   />
                   <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                </div>
                */}
                            <Button type="submit" size="lg" className="h-12 px-8 font-semibold">
                                Search
                            </Button>
                        </form>
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
                                <BanquetCard key={banquet._id} banquet={banquet} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-muted/30 border-t">
                <div className="container px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Why Book With Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 bg-background rounded-lg shadow-sm border">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Prime Locations</h3>
                            <p className="text-muted-foreground">Access premium venues in top cities with verified listings.</p>
                        </div>
                        <div className="p-6 bg-background rounded-lg shadow-sm border">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Verified Reviews</h3>
                            <p className="text-muted-foreground">Make informed decisions with reliable customer ratings and reviews.</p>
                        </div>
                        <div className="p-6 bg-background rounded-lg shadow-sm border">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IndianRupee className="h-6 w-6 text-primary" />
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
