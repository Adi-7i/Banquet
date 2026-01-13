import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface UserProfile {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "customer" | "owner" | "admin";
    createdAt: string;
}

export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    email?: string; // Usually email updates require verification, but including for completeness
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

async function fetchUserProfile() {
    const { data } = await api.get("/users/me");
    return data.data;
}

async function updateUserProfile(data: UpdateProfileDto) {
    const { data: response } = await api.patch("/users/me", data);
    return response.data;
}

async function changeUserPassword(data: ChangePasswordDto) {
    const { data: response } = await api.patch("/users/me/password", data);
    return response.data;
}

export function useUser() {
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery<UserProfile>({
        queryKey: ["user", "me"],
        queryFn: fetchUserProfile,
        retry: 1,
    });

    const updateProfileMutation = useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user", "me"] });
            toast.success("Profile updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update profile");
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: changeUserPassword,
        onSuccess: () => {
            toast.success("Password changed successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to change password");
        },
    });

    return {
        user,
        isLoading,
        updateProfile: updateProfileMutation.mutate,
        isUpdatingProfile: updateProfileMutation.isPending,
        changePassword: changePasswordMutation.mutate,
        isChangingPassword: changePasswordMutation.isPending,
    };
}
