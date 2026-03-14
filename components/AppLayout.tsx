'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Home, Compass, Map as MapIcon, Menu, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, language } = useTranslation();
  const isOffline = useAppStore((state) => state.isOffline);
  const setOffline = useAppStore((state) => state.setOffline);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    { href: '/map', icon: MapIcon, label: t('nav.map') },
  ];

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
            <span className="font-semibold tracking-tight">WORLD ART EXHIBITION</span>
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
          <span className="font-bold text-xl tracking-tight">WORLD ART EXHIBITION</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-14 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-neutral-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
    </div>
  );
}
