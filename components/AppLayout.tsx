'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Home, Compass, Building2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import localFont from 'next/font/local';

const nauryzFont = localFont({
  src: '../app/fonts/NauryzRedKeds.ttf',
  display: 'swap',
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, language } = useTranslation();
  const isOffline = useAppStore((state) => state.isOffline);
  const setOffline = useAppStore((state) => state.setOffline);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  const navItems = [
    { href: '/', icon: Home, label: t('nav.home') },
    { href: '/discover', icon: Compass, label: t('nav.discover') },
    { href: '/venues', icon: Building2, label: t('nav.venues') },
  ];

  // 管理员页面不渲染前台 layout
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col md:flex-row">
      {/* Top Navbar (Mobile & Desktop) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 md:ml-64">
        {isOffline && (
          <div className="bg-orange-500 text-white text-xs py-1 text-center">
            {t('common.offline')}
          </div>
        )}
        <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 md:hidden">
            <span className={clsx("font-bold tracking-wide text-lg", nauryzFont.className)}>ARTWALK</span>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button
              className="md:hidden p-2 text-neutral-600"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden px-4 pb-3 overflow-hidden"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t('nav.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-neutral-200 z-40">
        <div className="p-6 flex items-center gap-3">
          <span className={clsx("font-bold text-2xl tracking-wide text-black", nauryzFont.className)}>ARTWALK</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-black text-white font-medium shadow-md"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 底部版权 + 公众号入口 */}
        <div className="p-4 border-t border-neutral-100 space-y-2">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Copyright © 2026 Artwalk.<br />All Rights Reserved.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsQrOpen(true)}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors underline underline-offset-2"
            >
              展览收录
            </button>
            <button
              onClick={() => setIsQrOpen(true)}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors underline underline-offset-2"
            >
              联系我们
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-14 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
        {/* 移动端底部版权（显示在内容区末尾） */}
        <div className="md:hidden px-4 py-6 text-center border-t border-neutral-100 mt-8 space-y-2">
          <p className="text-xs text-neutral-400">Copyright © 2026 Artwalk. All Rights Reserved.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsQrOpen(true)}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors underline underline-offset-2"
            >
              展览收录
            </button>
            <button
              onClick={() => setIsQrOpen(true)}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors underline underline-offset-2"
            >
              联系我们
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-neutral-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive ? "text-black" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <item.icon className={clsx("w-5 h-5", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* 微信公众号二维码弹窗 */}
      <AnimatePresence>
        {isQrOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsQrOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className="relative z-10 bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setIsQrOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400"
                aria-label="关闭"
              >
                {/* 内联 X 图标，避免重新引入 lucide */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h3 className="text-lg font-bold text-neutral-900">扫码关注公众号</h3>
              <p className="text-sm text-neutral-500 text-center">展览收录 &amp; 联系我们</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wechat-qr.png"
                alt="ARTWALK 微信公众号二维码"
                className="w-52 h-52 object-contain rounded-xl"
              />
              <p className="text-xs text-neutral-400">微信扫一扫关注我们</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
