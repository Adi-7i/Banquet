import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { z } from "zod";

// --- Types ---
export interface User {
    id: string;
    email: string;
    role: "CUSTOMER" | "OWNER" | "ADMIN";
    firstName?: string;
    lastName?: string;
}

export type LoginCredentials = {
    email: string;
    password: string;
};

// Customer registration data
export type CustomerRegisterData = {
    email: string;
    password: string;
    role: "CUSTOMER";
    firstName: string;
    lastName: string;
    phoneNumber: string;
};

// Owner registration data
export type OwnerRegisterData = {
    email: string;
    password: string;
    role: "OWNER";
    businessName: string;
    contactNumber: string;
};

// Combined type for registration
export type RegisterData = CustomerRegisterData | OwnerRegisterData;

// --- API Functions ---

// --- API Functions ---

async function loginUser(credentials: LoginCredentials) {
    const { data } = await api.post("/auth/login", credentials);
    return data;
}

async function registerUser(userData: RegisterData) {
    // Construct payload based on role
    const payload = {
        email: userData.email,
        password: userData.password,
        role: userData.role,
        // Add profile data structure as required by backend DTOs
        ...(userData.role === "OWNER" ? {
            ownerProfile: {
                businessName: (userData as OwnerRegisterData).businessName,
                contactNumber: (userData as OwnerRegisterData).contactNumber,
            }
        } : {
            customerProfile: {
                firstName: (userData as CustomerRegisterData).firstName,
                lastName: (userData as CustomerRegisterData).lastName,
                phoneNumber: (userData as CustomerRegisterData).phoneNumber,
            }
        })
    };
    const { data } = await api.post("/auth/register", payload);
    return data;
}

async function verifyOtpUser(data: { identifier: string; otp: string; type: "EMAIL" | "PHONE" }) {
    const { data: response } = await api.post("/auth/verify-otp", data);
    return response;
}

async function fetchCurrentUser() {
    const { data } = await api.get("/auth/me");
    return data.data; // Backend wraps response in { success: true, data: ... }
}

async function logoutUser() {
    const refreshToken = localStorage.getItem("refreshToken");
    await api.post("/auth/logout", { refreshToken });
}

// --- Hook ---

export function useAuth() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Check if we have a token before attempting to fetch user
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

    // Get current user - only fetch if token exists
    const { data: user, isLoading: isLoadingUser, error: userError } = useQuery<User>({
        queryKey: ["currentUser"],
        queryFn: fetchCurrentUser,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 mins
        enabled: hasToken, // Only fetch if we have a token
    });

    // Login Mutation
    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (response) => {
            // Store tokens
            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            localStorage.setItem("user", JSON.stringify(response.data.user)); // Optional cache

            // Update query cache
            queryClient.setQueryData(["currentUser"], response.data.user);

            // Redirect based on role
            const role = response.data.user.role;
            if (role === "ADMIN") router.push("/dashboard/users");
            else if (role === "OWNER") router.push("/dashboard/banquets");
            else router.push("/"); // Customer to home/search
        },
    });

    // Register Mutation
    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (_, variables) => {
            // Redirect to OTP page with email
            router.push(`/verify-otp?email=${encodeURIComponent(variables.email)}`);
        },
    });

    // Verify OTP Mutation
    const verifyOtpMutation = useMutation({
        mutationFn: verifyOtpUser,
        onSuccess: () => {
            router.push("/login");
        }
    });

    // Logout Mutation
    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSettled: () => {
            localStorage.clear();
            queryClient.clear();
            router.push("/login");
        },
    });

    return {
        user,
        isLoadingUser,
        isAuthenticated: !!user,
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,
        register: registerMutation.mutate,
        isRegistering: registerMutation.isPending,
        registerError: registerMutation.error,
        verifyOtp: verifyOtpMutation.mutate,
        isVerifyingOtp: verifyOtpMutation.isPending,
        verifyOtpError: verifyOtpMutation.error,
        logout: logoutMutation.mutate,
    };
}

