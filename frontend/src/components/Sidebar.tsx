'use client';

import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Settings as SettingsIcon,
  User,
  LogOut,
  Download,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Orders', href: '/shipments', icon: Truck },
    { label: 'Rules', href: '/rules', icon: Database },
  ];

  return (
    <aside className="w-64 bg-card/70 backdrop-blur-[64px] border-r border-border h-full flex flex-col items-start py-8 z-20 shrink-0 select-none transition-all duration-300">
      {/* Branding */}
      <div className="flex flex-col items-start w-full px-8 mb-10">
        <Link href="/" className="branding-link group cursor-pointer flex items-center gap-2 mb-8">
            <span className="w-10 h-10 bg-transparent flex items-center justify-center text-primary font-black text-2xl group-hover:scale-110 transition-all duration-300 shrink-0">
                S
            </span>
            <span className="font-black text-xl tracking-tighter text-primary">ShipPulse</span>
        </Link>
        <div className="w-full h-[1px] bg-border/50" /> {/* Robust Separator */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full flex flex-col items-start gap-4 px-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center w-full min-h-[52px] smooth-transition group relative rounded-2xl px-4",
                isActive
                  ? "bg-white text-primary shadow-sm border border-border/50"
                  : "text-foreground hover:text-primary hover:bg-muted/50"
              )}
            >
              {isActive && (
                <div className="absolute left-[-1rem] w-1.5 h-8 bg-primary rounded-r-full" />
              )}

              <div className={cn(
                "w-10 h-10 flex items-center justify-center smooth-transition shrink-0",
                isActive ? "text-primary" : "text-foreground group-hover:text-primary"
              )}>
                <item.icon size={20} strokeWidth={isActive ? 3 : 2} className="smooth-transition group-hover:scale-110" />
              </div>

              <span className={cn(
                "ml-4 font-black text-[14px] tracking-wide smooth-transition",
                isActive ? "text-primary" : "text-foreground group-hover:text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
