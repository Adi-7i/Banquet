"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBanquetSearch, useSearchSuggestions } from "@/hooks/useSearch";
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
import { Search as SearchIcon, Filter, MapPin, Star } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Suspense } from "react";
import { IndianPatternBg } from "@/components/ui/indian-pattern-bg";

// Mock facets/filters (ideally fetched from API via useSearchFacets)
const AMENITIES = ["AC", "Parking", "Catering", "Decor", "Alcohol Allowed", "DJ", "Valet"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Goa", "Pune"];
const RATINGS = [4.5, 4.0, 3.5, 3.0];

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // State for filters
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [searchQuery, setSearchQuery] = useState(q);
    const [priceRange, setPriceRange] = useState([parseInt(searchParams.get("maxPrice") || "5000")]);
    const [minRating, setMinRating] = useState(parseInt(searchParams.get("minRating") || "0"));
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(searchParams.getAll("amenities"));
    const [selectedCities, setSelectedCities] = useState<string[]>(searchParams.getAll("cities"));

    // Autocomplete State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const { data: suggestions } = useSearchSuggestions(searchQuery);

    // Debounce search query update for actual filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setQ(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filters = {
        text: q,
        maxPrice: priceRange[0],
        minRating,
        amenities: selectedAmenities,
        city: selectedCities.length > 0 ? selectedCities[0] : undefined, // API often takes single or multiple, assume single for now or handle array
    };

    const { data, isLoading } = useBanquetSearch(filters);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        updateUrl();
    };

    const updateUrl = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (priceRange[0] < 10000) params.set("maxPrice", priceRange[0].toString());
        if (minRating > 0) params.set("minRating", minRating.toString());
        selectedAmenities.forEach(a => params.append("amenities", a));
        selectedCities.forEach(c => params.append("cities", c));

        router.push(`/search?${params.toString()}`);
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const toggleCity = (city: string) => {
        setSelectedCities(prev =>
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
        );
    };

    const FilterContent = () => (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 font-medium text-sm text-foreground uppercase tracking-wider">Filters</h3>
                <Accordion type="single" collapsible defaultValue="price" className="w-full">

                    {/* Price Filter */}
                    <AccordionItem value="price">
                        <AccordionTrigger>Price Limit (₹)</AccordionTrigger>
                        <AccordionContent className="pt-4 pb-2 px-1">
                            <Slider
                                value={priceRange}
                                max={10000}
                                step={100}
                                onValueChange={setPriceRange}
                                onValueCommit={updateUrl}
                            />
                            <div className="mt-2 text-sm text-muted-foreground text-right border rounded p-1 inline-block float-right">
                                Up to ₹{priceRange[0]}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Rating Filter (New) */}
                    <AccordionItem value="rating">
                        <AccordionTrigger>Rating</AccordionTrigger>
                        <AccordionContent className="space-y-2">
                            {RATINGS.map((rating) => (
                                <div key={rating} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`rating-${rating}`}
                                        checked={minRating === rating}
                                        onCheckedChange={(checked) => {
                                            setMinRating(checked ? rating : 0);
                                            updateUrl();
                                        }}
                                    />
                                    <Label htmlFor={`rating-${rating}`} className="text-sm font-normal cursor-pointer flex items-center">
                                        {rating}+ <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                                    </Label>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>

                    {/* Amenities Filter */}
                    <AccordionItem value="amenities">
                        <AccordionTrigger>Amenities</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-1">
                                {AMENITIES.map((amenity) => (
                                    <div key={amenity} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={amenity}
                                            checked={selectedAmenities.includes(amenity)}
                                            onCheckedChange={() => toggleAmenity(amenity)}
                                        />
                                        <Label htmlFor={amenity} className="text-sm font-normal cursor-pointer">
                                            {amenity}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Cities Filter */}
                    <AccordionItem value="cities">
                        <AccordionTrigger>City</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-1">
                                {CITIES.map((city) => (
                                    <div key={city} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={city}
                                            checked={selectedCities.includes(city)}
                                            onCheckedChange={() => toggleCity(city)}
                                        />
                                        <Label htmlFor={city} className="text-sm font-normal cursor-pointer">{city}</Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <Button className="w-full mt-4" onClick={updateUrl}>Apply Filters</Button>
            </div>
        </div>
    );

    return (
        <div className="container min-h-screen py-6 px-4 md:px-6 relative">
            <IndianPatternBg pattern="floral" opacity={0.03} className="fixed inset-0 pointer-events-none" />

            {/* Search Header */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between z-50 relative">
                <h1 className="text-2xl font-bold tracking-tight">Search Results</h1>

                {/* Search Bar with Autocomplete */}
                <div className="relative w-full md:w-96" ref={searchRef}>
                    <form onSubmit={handleSearch}>
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Search venues..."
                            className="pl-10"
                        />
                        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </form>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                            {suggestions.map((suggestion: string, index: number) => (
                                <div
                                    key={index}
                                    className="px-4 py-2 hover:bg-muted cursor-pointer text-sm flex items-center"
                                    onClick={() => {
                                        setSearchQuery(suggestion);
                                        setQ(suggestion);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <SearchIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                            data?.banquets?.map((banquet: any) => (
                                <BanquetCard key={banquet.id} banquet={banquet} />
                            ))
                        )}
                        {!isLoading && (!data?.banquets || data.banquets.length === 0) && (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                <p className="text-lg">No venues found matching your criteria.</p>
                                <Button variant="link" onClick={() => {
                                    setSearchQuery("");
                                    setQ("");
                                    setPriceRange([10000]);
                                    setMinRating(0);
                                    setSelectedAmenities([]);
                                    setSelectedCities([]);
                                    router.push("/search");
                                }}>
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
