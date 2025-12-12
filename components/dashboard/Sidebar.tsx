"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Home,
    Package,
    Video,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "./ConnectionStatus";
import { StorageInfo } from "./StorageInfo";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    {
        href: "/dashboard",
        label: "หน้าหลัก",
        icon: Home,
        exact: true,
    },
    {
        href: "/dashboard/products",
        label: "สินค้าของฉัน",
        icon: Package,
    },
    {
        href: "/dashboard/videos",
        label: "วิดีโอของฉัน",
        icon: Video,
    },
    {
        href: "/dashboard/analytics",
        label: "สถิติ",
        icon: BarChart3,
    },
    {
        href: "/dashboard/settings",
        label: "ตั้งค่า",
        icon: Settings,
    },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-kanit font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                            AI Video Pro
                        </span>
                    )}
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="hidden lg:flex"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
                                {!collapsed && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Connection Status */}
            {!collapsed && (
                <div className="px-3 mt-4">
                    <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        การเชื่อมต่อ
                    </p>
                    <ConnectionStatus />
                </div>
            )}

            {/* Storage Info */}
            {!collapsed && (
                <div className="px-3 mt-4">
                    <StorageInfo />
                </div>
            )}

            {/* Bottom Section */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                        collapsed ? "justify-center px-0" : "justify-start"
                    )}
                    onClick={() => signOut({ callbackUrl: "/" })}
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3">ออกจากระบบ</span>}
                </Button>
            </div>
        </aside>
    );
}
