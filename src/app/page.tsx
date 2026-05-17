"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.replace(token ? "/overview" : "/login");
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center text-textMed">
      Redirecting...
    </div>
  );
}
