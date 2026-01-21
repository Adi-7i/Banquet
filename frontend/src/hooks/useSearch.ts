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
    try {
        console.log('[Search Debug] Filters:', filters);
        const { data } = await api.post('/search/banquets', filters);
        console.log('[Search Debug] Raw response:', data);
        // API returns {data: [...banquets...], pagination: {...}} directly
        const result = {
            banquets: data?.data || [],
            meta: {
                total: data?.pagination?.total || 0,
                page: data?.pagination?.page || 1,
                limit: data?.pagination?.limit || 10,
                pages: data?.pagination?.totalPages || 0,
            }
        };
        console.log('[Search Debug] Final result:', result);
        return result;
    } catch (error) {
        console.error("Error searching banquets:", error);
        return {
            banquets: [],
            meta: { total: 0, page: 1, limit: 10, pages: 0 }
        };
    }
}

async function fetchSearchFacets() {
    const { data } = await api.get('/search/facets');
    return data.data;
}

async function fetchSuggestions(query: string) {
    if (!query || query.length < 2) return [];
    try {
        const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
        return data?.data || [];
    } catch (error) {
        console.warn('Failed to fetch search suggestions:', error);
        return [];
    }
}

async function fetchPopularSearches() {
    try {
        const { data } = await api.get('/search/popular');
        return data?.data || [];
    } catch (error) {
        return [];
    }
}

async function fetchTrendingLocations() {
    try {
        const { data } = await api.get('/search/trending/locations');
        return data?.data || [];
    } catch (error) {
        return [];
    }
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
