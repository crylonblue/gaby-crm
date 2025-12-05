"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, FileText, Menu, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    const navItems = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/customers", label: "Kunden", icon: Users },
        { href: "/invoices", label: "Rechnungen", icon: FileText },
    ];

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login"); // Redirect to login
        router.refresh();
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar for Desktop */}
            <aside className="hidden w-64 flex-col border-r bg-white dark:bg-gray-800 md:flex">
                <div className="flex h-16 items-center justify-center border-b px-4">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        GABY-CRM
                    </h1>
                </div>
                <nav className="flex-1 space-y-2 p-4">
                    {navItems.map((item) => {
                        const isActive = item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t p-4">
                    <Button variant="outline" className="w-full justify-start gap-3" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Abmelden
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-800 md:hidden">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="ml-4 text-lg font-bold">GabyCRM</span>
                    </div>
                </header>

                {/* Mobile Sidebar (Simple Overlay) */}
                {sidebarOpen && (
                    <div className="absolute inset-0 z-50 flex md:hidden">
                        <div className="w-64 bg-white p-4 shadow-lg dark:bg-gray-800 flex flex-col">
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-lg font-bold">Menu</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    ✕
                                </Button>
                            </div>
                            <nav className="space-y-2 flex-1">
                                {navItems.map((item) => {
                                    const isActive = item.href === "/"
                                        ? pathname === "/"
                                        : pathname.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800",
                                                isActive && "bg-slate-100 dark:bg-slate-800"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-4 border-t pt-4">
                                <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4" />
                                    Abmelden
                                </Button>
                            </div>
                        </div>
                        <div
                            className="flex-1 bg-black/50"
                            onClick={() => setSidebarOpen(false)}
                        />
                    </div>
                )}

                <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}
