'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, title: 'Shipment Delayed', message: 'Shipment #SP-8122 from China is delayed by 3 days.', time: '2m ago', type: 'warning' },
    { id: 2, title: 'New Order Created', message: 'A new bulk order #ORD-9901 has been successfully imported.', time: '1h ago', type: 'info' },
    { id: 3, title: 'Risk Alert: Route High', message: 'Route CN -> SA is currently experiencing high transit congestion.', time: '3h ago', type: 'danger' },
  ];

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Sync local state when URL changes externally
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchValue) {
      setSearchValue(urlSearch);
    }
  }, [searchParams]);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (searchValue === currentSearch) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set('search', searchValue);
      } else {
        params.delete('search');
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, pathname, router]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-20 border-b border-border flex items-center justify-between bg-background/70 backdrop-blur-[64px] sticky top-0 z-50 transition-all duration-300 px-8">
      <div className="flex flex-col justify-center">
        <h2 className="text-xl font-black text-foreground tracking-tight leading-none mb-1">Welcome, {user?.name || 'User'}!</h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Global Logistics Tracking</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-11 h-11 relative overflow-hidden bg-white text-[#000000] rounded-2xl flex items-center justify-center border border-border/50 smooth-transition shadow-sm hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mounted ? theme : 'loading'}
                initial={{ y: 20, opacity: 0, rotate: 45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -20, opacity: 0, rotate: -45 }}
                transition={{ duration: 0.3 }}
              >
                {mounted && theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          <div className="absolute top-full right-0 mt-3 px-2 py-1 bg-black/90 [data-theme='light']:bg-white/90 border border-white/10 [data-theme='light']:border-black/10 text-[9px] font-black uppercase tracking-widest text-white [data-theme='light']:text-black rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
            Switch to {mounted ? (theme === 'dark' ? 'Light' : 'Dark') : '...'} Mode
          </div>
        </div>

        <div className="relative group" ref={notificationRef}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-11 h-11 relative overflow-hidden bg-white text-[#000000] rounded-2xl flex items-center justify-center border border-border/50 smooth-transition shadow-sm hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white"
          >
            <Bell size={18} className="relative z-10" />
            <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full border border-background z-20"></span>
          </motion.button>
          <div className="absolute top-full right-0 mt-3 px-2 py-1 bg-black/90 [data-theme='light']:bg-white/90 border border-white/10 [data-theme='light']:border-black/10 text-[9px] font-black uppercase tracking-widest text-white [data-theme='light']:text-black rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
            Notifications
          </div>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-background/95 [data-theme='light']:bg-white border border-border rounded-3xl shadow-xl overflow-hidden z-20"
              >
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Recent Activity</h3>
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">3 NEW</Badge>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 border-b border-border hover:bg-muted transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">{n.title}</h4>
                        <span className="text-[9px] font-medium text-foreground/30">{n.time}</span>
                      </div>
                      <p className="text-[10px] text-foreground/50 leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="w-full py-4 text-center text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all block"
                >
                  SEE ALL NOTIFICATIONS
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative group" ref={dropdownRef}>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-11 h-11 relative overflow-hidden bg-white text-[#000000] rounded-2xl flex items-center justify-center border border-border/50 smooth-transition shadow-sm hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white cursor-pointer"
          >
            <User size={20} className="relative z-10" />
          </motion.div>
          <div className="absolute top-full right-0 mt-3 px-2 py-1 bg-black/90 [data-theme='light']:bg-white/90 border border-white/10 [data-theme='light']:border-black/10 text-[9px] font-black uppercase tracking-widest text-white [data-theme='light']:text-black rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
            Account Profile
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-background/95 [data-theme='light']:bg-white border border-border rounded-[2rem] shadow-xl overflow-hidden z-20"
              >
                <div className="p-8 pb-6 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary shadow-sm mb-4">
                    <User size={40} />
                  </div>
                  <h3 className="text-base font-black text-foreground mb-0.5">{user?.name}</h3>
                  <p className="text-sm font-medium text-foreground/40 mb-6">{user?.email}</p>

                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="px-6 py-2.5 rounded-full border border-border text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted transition-all font-bold"
                  >
                    Manage your account
                  </Link>
                </div>

                <div className="p-2 pt-0 w-full flex justify-center pb-6">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-all border border-transparent hover:border-destructive/20"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
