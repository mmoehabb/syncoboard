"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { setGlobalApiToken } from "@syncoboard/api";
import { Users, CreditCard, LogOut, LayoutDashboard } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/login");
    } else {
      setGlobalApiToken(token);
    }
  }, [router]);

  if (!mounted) return null;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setGlobalApiToken(null);
    router.push("/login");
  };

  const navItems = [
    { href: "/users", label: "Users", icon: Users },
    { href: "/plans", label: "Plans", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-obsidian-night text-gray-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-void-grey border-r border-glass-light flex flex-col">
        <div className="p-6 border-b border-glass-light flex items-center space-x-3">
          <LayoutDashboard className="text-neon-pulse" />
          <h1 className="text-xl font-space font-bold text-white">
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-neon-pulse/10 text-neon-pulse border border-neon-pulse/20"
                    : "hover:bg-glass-light text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-glass-light">
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-warning-flare hover:bg-warning-flare/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-pulse/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="p-8 max-w-7xl mx-auto relative z-10">{children}</div>
      </main>
    </div>
  );
}
