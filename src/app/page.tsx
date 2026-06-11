"use client";

// Root page — redirects to /overview if logged in, otherwise to /login.
// This runs immediately on app load to send the user to the right page.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { PageLoader } from "@/components/ui/LoadingSpinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if a JWT token exists in localStorage
    if (getToken()) {
      router.replace("/overview");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Show a loader while the redirect happens
  return <PageLoader />;
}
