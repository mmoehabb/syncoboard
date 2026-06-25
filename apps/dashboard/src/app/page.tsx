"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminApi } from "@syncoboard/api";

const api = new AdminApi(
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin`
    : "http://localhost:3000/api/admin",
);

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    api
      .me()
      .then(() => {
        router.push("/users");
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-night">
      Loading...
    </div>
  );
}
