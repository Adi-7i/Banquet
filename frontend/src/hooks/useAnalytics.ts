import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Types ---

export interface FunnelMetrics {
    pageViews: number;
    searches: number;
    banquetViews: number;
    bookingInitiated: number;
    bookingCompleted: number;
    conversionRate: number;
}

export interface RevenueMetrics {
    totalRevenue: number;
    monthlyRevenue: { month: string; revenue: number }[];
    dailyRevenue: { date: string; revenue: number }[];
}

export interface UserActivityMetrics {
    activeUsers: number;
    newRegistrations: { date: string; count: number }[];
    userTypeDistribution: { type: string; count: number }[];
}

export interface SystemHealth {
    status: "healthy" | "degraded" | "down";
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    databaseLatency: number;
}

// --- API Functions ---

async function fetchFunnelMetrics() {
    const { data } = await api.get("/analytics/funnel");
    return data.data;
}

async function fetchRevenueMetrics() {
    const { data } = await api.get("/analytics/revenue");
    return data.data;
}

async function fetchUserActivityMetrics() {
    const { data } = await api.get("/analytics/users");
    return data.data;
}

async function fetchSystemHealth() {
    const { data } = await api.get("/analytics/health");
    return data.data;
}

// --- Hooks ---

export function useFunnelMetrics() {
    return useQuery({
        queryKey: ["analytics", "funnel"],
        queryFn: fetchFunnelMetrics,
    });
}

export function useRevenueMetrics() {
    return useQuery({
        queryKey: ["analytics", "revenue"],
        queryFn: fetchRevenueMetrics,
    });
}

export function useUserActivityMetrics() {
    return useQuery({
        queryKey: ["analytics", "users"],
        queryFn: fetchUserActivityMetrics,
    });
}

export function useSystemHealth() {
    return useQuery({
        queryKey: ["analytics", "health"],
        queryFn: fetchSystemHealth,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}
