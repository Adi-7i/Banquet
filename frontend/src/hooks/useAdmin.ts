import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// --- Types ---

export interface AdminStats {
    totalUsers: number;
    totalBanquets: number;
    totalBookings: number;
    revenue: number;
    pendingReviews: number;
    pendingBanquets: number;
    openTickets: number;
}

export interface AdminUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "CUSTOMER" | "OWNER" | "ADMIN";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt: string;
}

export interface AdminBanquet {
    _id: string;
    name: string;
    city: string;
    owner: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    status: "PENDING" | "APPROVED" | "REJECTED";
    isPublished: boolean;
    createdAt: string;
}

export interface SupportTicket {
    _id: string;
    subject: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    priority: "LOW" | "MEDIUM" | "HIGH";
    user: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    assignedTo?: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AdminReview {
    _id: string;
    rating: number;
    content: string;
    banquet: {
        _id: string;
        name: string;
    };
    user: {
        firstName: string;
        lastName: string;
    };
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";


// --- API Functions ---

async function fetchAdminOverview() {
    const { data } = await api.get("/admin/overview");
    return data.data;
}

async function fetchAdminUsers(params?: any) {
    const { data } = await api.get("/admin/users", { params });
    return data.data;
}

async function fetchAdminBanquets(params?: any) {
    const { data } = await api.get("/admin/banquets", { params });
    return data.data; // Should return list of banquets (pending or all)
}

async function fetchAdminTickets(params?: any) {
    const { data } = await api.get("/admin/tickets", { params });
    return data.data;
}

async function fetchAdminReviews(params?: any) {
    const { data } = await api.get("/reviews/moderation/pending", { params });
    // Note: implementation_plan says /reviews/moderation/pending, checking API alignment
    return data.data;
}

async function approveReview(reviewId: string) {
    const { data } = await api.post(`/reviews/${reviewId}/approve`);
    return data.data;
}

async function rejectReview(reviewId: string) {
    const { data } = await api.post(`/reviews/${reviewId}/reject`);
    return data.data;
}


// User Actions
async function suspendUser(userId: string) {
    const { data } = await api.patch(`/admin/users/${userId}/suspend`);
    return data.data;
}

async function activateUser(userId: string) {
    const { data } = await api.patch(`/admin/users/${userId}/activate`);
    return data.data;
}

// Banquet Actions
async function approveBanquet(banquetId: string) {
    const { data } = await api.post(`/admin/banquets/${banquetId}/approve`);
    return data.data;
}

async function rejectBanquet(banquetId: string) {
    const { data } = await api.post(`/admin/banquets/${banquetId}/reject`);
    return data.data;
}

// Ticket Actions
async function resolveTicket(ticketId: string) {
    const { data } = await api.post(`/admin/tickets/${ticketId}/resolve`);
    return data.data;
}

// --- Hooks ---

export function useAdminOverview() {
    return useQuery({
        queryKey: ["admin", "overview"],
        queryFn: fetchAdminOverview,
    });
}

export function useAdminUsers(params?: any) {
    return useQuery({
        queryKey: ["admin", "users", params],
        queryFn: () => fetchAdminUsers(params),
    });
}

export function useAdminBanquets(status: "PENDING" | "APPROVED" | "REJECTED" | "ALL" = "ALL") {
    return useQuery({
        queryKey: ["admin", "banquets", status],
        queryFn: () => fetchAdminBanquets({ status: status === "ALL" ? undefined : status }),
    });
}

export function useAdminTickets(status?: string) {
    return useQuery({
        queryKey: ["admin", "tickets", status],
        queryFn: () => fetchAdminTickets({ status }),
    });
}

export function useAdminReviews() {
    return useQuery({
        queryKey: ["admin", "reviews", "pending"],
        queryFn: () => fetchAdminReviews(),
    });
}


// Mutations

export function useAdminUserActions() {
    const queryClient = useQueryClient();

    const suspendMutation = useMutation({
        mutationFn: suspendUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success("User suspended");
        },
        onError: (err: any) => toast.error(err.message || "Failed to suspend user"),
    });

    const activateMutation = useMutation({
        mutationFn: activateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success("User activated");
        },
        onError: (err: any) => toast.error(err.message || "Failed to activate user"),
    });

    return { suspendUser: suspendMutation.mutate, activateUser: activateMutation.mutate };
}

export function useAdminBanquetActions() {
    const queryClient = useQueryClient();

    const approveMutation = useMutation({
        mutationFn: approveBanquet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "banquets"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
            toast.success("Banquet approved");
        },
        onError: (err: any) => toast.error(err.message || "Failed to approve banquet"),
    });

    const rejectMutation = useMutation({
        mutationFn: rejectBanquet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "banquets"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
            toast.success("Banquet rejected");
        },
        onError: (err: any) => toast.error(err.message || "Failed to reject banquet"),
    });

    return { approveBanquet: approveMutation.mutate, rejectBanquet: rejectMutation.mutate };
}

export function useAdminTicketActions() {
    const queryClient = useQueryClient();

    const resolveMutation = useMutation({
        mutationFn: resolveTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
            toast.success("Ticket resolved");
        },
        onError: (err: any) => toast.error(err.message || "Failed to resolve ticket"),
    });

    return { resolveTicket: resolveMutation.mutate };
}

export function useAdminReviewActions() {
    const queryClient = useQueryClient();

    const approveMutation = useMutation({
        mutationFn: approveReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
            toast.success("Review approved");
        },
        onError: (err: any) => toast.error(err.message || "Failed to approve review"),
    });

    const rejectMutation = useMutation({
        mutationFn: rejectReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
            toast.success("Review rejected");
        },
        onError: (err: any) => toast.error(err.message || "Failed to reject review"),
    });

    return { approveReview: approveMutation.mutate, rejectReview: rejectMutation.mutate };
}

