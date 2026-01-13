"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BanquetCard, BanquetProps } from "@/components/banquet-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Search as SearchIcon, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Mock facets/filters
const AMENITIES = ["AC", "Parking", "Catering", "Decor", "Alcohol Allowed", "DJ", "Valet"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Goa", "Pune"];

async function searchBanquets(params: any) {
    // Convert URLSearchParams to object
    // const { data } = await api.post("/search/banquets", params);
    // return data.data;

    // Mock
    const allBanquets: BanquetProps[] = [
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
            primaryImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc6?q=80&w=2069&auto=format&fit=crop"
        },
        {
            _id: "4",
            name: "City Convention Center",
            address: "Corporate Park",
            city: "Bangalore",
            capacity: 1500,
            pricePerPlate: 1800,
            rating: 4.6,
            amenities: ["AC", "Parking", "Valet", "Catering"],
            primaryImage: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2162&auto=format&fit=crop"
        }
    ];

    // Simple client-side filtering mock
    let results = [...allBanquets];
    if (params.q) {
        results = results.filter(b => b.name.toLowerCase().includes(params.q.toLowerCase()) || b.city.toLowerCase().includes(params.q.toLowerCase()));
    }
    // Filter by price (mock)
    if (params.maxPrice) {
        results = results.filter(b => b.pricePerPlate <= params.maxPrice);
    }

    return {
        results,
        total: results.length
    };
}

import { Suspense } from "react";

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // State for filters
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [priceRange, setPriceRange] = useState([5000]); // Max price
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    // Construct query params
    const queryParams = {
        q,
        maxPrice: priceRange[0],
        amenities: selectedAmenities,
    };

    const { data, isLoading } = useQuery({
        queryKey: ["search", queryParams],
        queryFn: () => searchBanquets(queryParams),
        staleTime: 0, // Always fresh search
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Update URL
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        router.push(`/search?${params.toString()}`);
    };

    const FilterContent = () => (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 font-medium text-sm text-foreground uppercase tracking-wider">Filters</h3>
                <Accordion type="single" collapsible defaultValue="price" className="w-full">
                    <AccordionItem value="price">
                        <AccordionTrigger>Price Limit (₹)</AccordionTrigger>
                        <AccordionContent className="pt-4 pb-2 px-1">
                            <Slider
                                value={priceRange}
                                max={10000}
                                step={100}
                                onValueChange={setPriceRange}
                            />
                            <div className="mt-2 text-sm text-muted-foreground text-right border rounded p-1 inline-block float-right">
                                Up to ₹{priceRange[0]}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="amenities">
                        <AccordionTrigger>Amenities</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-1">
                                {AMENITIES.map((amenity) => (
                                    <div key={amenity} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={amenity}
                                            checked={selectedAmenities.includes(amenity)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedAmenities([...selectedAmenities, amenity]);
                                                else setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                                            }}
                                        />
                                        <Label htmlFor={amenity} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {amenity}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="cities">
                        <AccordionTrigger>City</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-1">
                                {CITIES.map((city) => (
                                    <div key={city} className="flex items-center space-x-2">
                                        <Checkbox id={city} />
                                        <Label htmlFor={city} className="text-sm font-normal cursor-pointer">{city}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );

    return (
        <div className="container min-h-screen py-6 px-4 md:px-6">

            {/* Search Header */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Search Results</h1>
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search venues..."
                        className="pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </form>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar - Desktop */}
                <aside className="w-64 hidden lg:block flex-shrink-0">
                    <div className="sticky top-24">
                        <FilterContent />
                    </div>
                </aside>

                {/* Mobile Filter */}
                <div className="lg:hidden mb-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Filter className="mr-2 h-4 w-4" /> Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <FilterContent />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Results Grid */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className="h-[380px] w-full bg-muted animate-pulse rounded-lg" />
                            ))
                        ) : (
                            data?.results.map((banquet) => (
                                <BanquetCard key={banquet._id} banquet={banquet} />
                            ))
                        )}
                        {!isLoading && data?.results.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                <p className="text-lg">No venues found matching your criteria.</p>
                                <Button variant="link" onClick={() => { setQ(""); setPriceRange([10000]); setSelectedAmenities([]) }}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading results...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
