"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useJourney } from "@/components/JourneyProvider";

/**
 * Keeps non-admin account sessions out of the admin UI. Database RLS remains
 * the enforcement layer for direct Supabase access.
 */
export function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasRole, isAuthenticated, isAuthReady } = useJourney();
  const isAdmin = hasRole("admin");

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      router.replace("/sign-in");
    } else if (!isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isAuthenticated, isAuthReady, router]);

  if (!isAuthReady || !isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
