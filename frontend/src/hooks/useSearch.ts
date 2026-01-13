import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SearchFilters {
    text?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    minCapacity?: number;
    maxCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    minRating?: number;
    availableDate?: string;
    sortBy?: 'price_low' | 'price_high' | 'rating' | 'distance' | 'popularity';
    page?: number;
    limit?: number;
}

export interface SearchResult {
    banquets: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

async function searchBanquets(filters: SearchFilters): Promise<SearchResult> {
    const { data } = await api.post('/search/banquets', filters);
    return data.data;
}

async function fetchSearchFacets() {
    const { data } = await api.get('/search/facets');
    return data.data;
}

async function fetchSuggestions(query: string) {
    if (!query || query.length < 2) return [];
    const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return data.data;
}

async function fetchPopularSearches() {
    const { data } = await api.get('/search/popular');
    return data.data;
}

async function fetchTrendingLocations() {
    const { data } = await api.get('/search/trending/locations');
    return data.data;
}

// Hooks

export function useBanquetSearch(filters: SearchFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: ['search', 'banquets', filters],
        queryFn: () => searchBanquets(filters),
        enabled,
        placeholderData: (previousData) => previousData, // Keep data while fetching new
    });
}

export function useSearchFacets() {
    return useQuery({
        queryKey: ['search', 'facets'],
        queryFn: fetchSearchFacets,
    });
}

export function useSearchSuggestions(query: string) {
    return useQuery({
        queryKey: ['search', 'suggestions', query],
        queryFn: () => fetchSuggestions(query),
        enabled: query.length >= 2,
        staleTime: 60 * 1000, // Cache for 1 minute
    });
}

export function usePopularSearches() {
    return useQuery({
        queryKey: ['search', 'popular'],
        queryFn: fetchPopularSearches,
    });
}

export function useTrendingLocations() {
    return useQuery({
        queryKey: ['search', 'trending', 'locations'],
        queryFn: fetchTrendingLocations,
    });
}
