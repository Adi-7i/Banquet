"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { IndianPatternBg } from "@/components/ui/indian-pattern-bg";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="relative">
                <IndianPatternBg pattern="mandala" opacity={0.015} className="fixed inset-0 pointer-events-none" />
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="font-medium text-sm">Dashboard</div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 relative z-10">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
