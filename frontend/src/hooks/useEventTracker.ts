"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export function useEventTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Track page view on route change
        const trackPageView = async () => {
            try {
                await api.post("/analytics/track/pageview", {
                    path: pathname,
                    search: searchParams.toString(),
                });
            } catch (error) {
                // Silent fail for analytics
                console.error("Analytics error:", error);
            }
        };

        trackPageView();
    }, [pathname, searchParams]);
}
