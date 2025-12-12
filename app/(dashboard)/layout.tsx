"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { ErrorBoundary, SimpleErrorFallback } from "@/components/ErrorBoundary";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Handle window resize for tablet collapse
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024 && window.innerWidth >= 768) {
                setSidebarCollapsed(true);
            } else if (window.innerWidth >= 1024) {
                setSidebarCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Mobile Sidebar Overlay */}
                <MobileSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Desktop/Tablet Sidebar */}
                <div className="hidden md:block">
                    <Sidebar
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                </div>

                {/* Main Content */}
                <div
                    className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"
                        }`}
                >
                    {/* Header */}
                    <Header
                        onMenuClick={() => setSidebarOpen(true)}
                        user={session?.user}
                    />

                    {/* Page Content with Error Boundary */}
                    <main className="p-4 md:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            <ErrorBoundary fallback={<SimpleErrorFallback />}>
                                {children}
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>
            </div>
        </ErrorBoundary>
    );
}

