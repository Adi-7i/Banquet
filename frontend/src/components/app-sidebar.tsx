"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    CalendarDays,
    Star,
    Settings,
    LogOut,
    Building2,
    Users,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null; // Or skeleton

    const getInitials = (name?: string) => name?.substring(0, 2).toUpperCase() || "U";

    // Navigation Items based on Role
    const customerItems = [
        { title: "My Bookings", url: "/dashboard/bookings", icon: CalendarDays },
        { title: "My Reviews", url: "/dashboard/reviews", icon: Star },
        { title: "Profile", url: "/dashboard/profile", icon: Settings },
    ];

    const ownerItems = [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "My Banquets", url: "/dashboard/banquets", icon: Building2 },
        { title: "Bookings", url: "/dashboard/bookings", icon: CalendarDays },
        { title: "Reviews", url: "/dashboard/reviews", icon: Star },
    ];

    const adminItems = [
        { title: "Overview", url: "/dashboard/admin", icon: LayoutDashboard },
        { title: "Users", url: "/dashboard/admin/users", icon: Users },
        { title: "Banquets", url: "/dashboard/admin/banquets", icon: Building2 },
        { title: "Reviews", url: "/dashboard/admin/reviews", icon: ShieldCheck },
        { title: "Tickets", url: "/dashboard/admin/tickets", icon: Star }, // Using Star temporarily, maybe find better icon
        { title: "Analytics", url: "/dashboard/admin/analytics", icon: LayoutDashboard },
    ];

    let items = customerItems;
    if (user.role === "OWNER") items = ownerItems;
    if (user.role === "ADMIN") items = adminItems;

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        B
                        {/* <img src="/logo_bg.png" alt="logo" /> */}
                    </div>
                    <span className="font-bold text-lg">Banquet Sys</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={pathname === item.url}>
                                    <Link href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-3 px-2 py-1.5 text-left text-sm">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src="/avatars/01.png" alt={user.email} />
                                <AvatarFallback className="rounded-lg">{getInitials(user.firstName)}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.firstName} {user.lastName}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => logout()}>
                            <LogOut />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
