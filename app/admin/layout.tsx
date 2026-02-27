'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAdminToken, removeAdminToken } from '@/lib/admin-api';
import Link from 'next/link';
import { LayoutDashboard, LogOut, Plus, Settings } from 'lucide-react';
import clsx from 'clsx';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = getAdminToken();

        // 如果没有 token 且不是在登录页，重定向到登录页
        if (!token && !pathname.includes('/admin/login')) {
            router.push('/admin/login');
        } else if (token) {
            setIsAuthenticated(true);
        }
    }, [pathname, router]);

    if (!isMounted) return null;

    // 登录页直接渲染，不需要后台侧边栏
    if (pathname === '/admin/login') {
        return <div className="min-h-screen bg-neutral-50">{children}</div>;
    }

    // 验证中不渲染内容
    if (!isAuthenticated) return null;

    const handleLogout = () => {
        removeAdminToken();
        router.push('/admin/login');
    };

    const navItems = [
        { label: '展览管理', href: '/admin', icon: LayoutDashboard },
        { label: '系统设置', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* 侧边栏 */}
            <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col hidden md:flex fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-neutral-200">
                    <h1 className="text-xl font-bold font-serif italic text-black">FUHUNG Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-fuhung-blue text-white"
                                        : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-neutral-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        退出登录
                    </button>
                </div>
            </aside>

            {/* 移动端顶部导航 (简单版) */}
            <div className="md:hidden fixed top-0 w-full h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-20">
                <h1 className="text-lg font-bold font-serif italic">FUHUNG Admin</h1>
                <button onClick={handleLogout} className="p-2 text-neutral-600">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* 主内容区 */}
            <main className="flex-1 md:ml-64 pt-14 md:pt-0">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
