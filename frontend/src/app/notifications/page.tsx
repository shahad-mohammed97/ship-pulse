'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  MoreHorizontal,
  Search,
  CheckCheck,
  Trash2,
  Clock,
  ArrowLeft,
  List,
  BellRing as BellDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }

  const notifications = [
    { id: 1, title: 'Shipment Delayed', message: 'Shipment #SP-8122 from China is delayed by 3 days. Estimated arrival is now April 15th.', time: '2m ago', type: 'warning', read: false },
    { id: 2, title: 'New Order Created', message: 'A new bulk order #ORD-9901 has been successfully imported from the ERP.', time: '1h ago', type: 'info', read: false },
    { id: 3, title: 'Risk Alert: Route High', message: 'Route CN -> SA is currently experiencing high transit congestion. Expect 2-4 days extra delay.', time: '3h ago', type: 'danger', read: false },
    { id: 4, title: 'System Maintenance', message: 'ShipPulse will undergo scheduled maintenance tonight at 02:00 UTC.', time: '1d ago', type: 'info', read: true },
    { id: 5, title: 'Custom Rule Triggered', message: 'Local Rule #43: "High Value Priority" was applied to 12 new shipments.', time: '2d ago', type: 'success', read: true },
  ];

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <Clock className="text-warning" size={18} />;
      case 'danger': return <AlertCircle className="text-destructive" size={18} />;
      case 'success': return <CheckCircle2 className="text-primary" size={18} />;
      default: return <Info className="text-blue-600" size={18} />;
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pt-0">
      {/* Header / Actions - Absolute Top Layout (Synced with Shipments) */}
      <div className="flex-none pt-0 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground">Updates & Alerts</h1>
                <Badge variant="outline" className="h-5 px-2 text-[10px] bg-primary/5 text-primary border-primary/10 rounded-lg font-black">
                  {notifications.length}
                </Badge>
              </div>
              <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Manage your system communications</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Filter Tabs - Icons Only */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border border-border">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl smooth-transition transition-all",
                  filter === 'all'
                    ? 'bg-white text-primary shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="All Notifications"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl smooth-transition transition-all",
                  filter === 'unread'
                    ? 'bg-white text-primary shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Unread Only"
              >
                <BellDot size={16} />
              </button>
            </div>

            {/* Search Bar - Synced with Shipments */}
            <div className="relative group w-full md:w-32 lg:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={14} />
              <Input
                placeholder="Filter..."
                className="pl-9 bg-muted border-border h-11 text-xs rounded-xl focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                onChange={(e) => { }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { }}
                title="Mark all as read"
                className="w-11 h-11 relative overflow-hidden bg-white text-[#000000] rounded-2xl flex items-center justify-center border border-border/50 smooth-transition shadow-sm hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white"
              >
                <CheckCheck size={18} />
              </button>
              <button
                onClick={() => { }}
                title="Clear all notifications"
                className="w-11 h-11 relative overflow-hidden bg-white text-[#000000] rounded-2xl flex items-center justify-center border border-border/50 smooth-transition shadow-sm hover:text-red-500 hover:bg-red-500/[0.03] hover:backdrop-blur-sm active:bg-red-500 active:text-white"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pt-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  "group bg-card border border-border transition-all hover:translate-x-1 relative overflow-hidden shadow-sm",
                  !n.read ? "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary" : "opacity-80"
                )}>
                  <CardContent className="p-6">
                    <div className="flex gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
                        !n.read ? "bg-primary/10 border-primary/20" : "bg-muted border-border"
                      )}>
                        {getIcon(n.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-3">
                            <h3 className={cn("text-sm font-black tracking-tight", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</h3>
                            {!n.read && <Badge className="bg-primary text-background border-0 text-[8px] h-4">NEW</Badge>}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-medium text-muted-foreground/30 flex items-center gap-1">
                              <MoreHorizontal size={14} className="hover:text-foreground cursor-pointer transition-colors" />
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-3">{n.message}</p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {n.time}</span>
                          <span>•</span>
                          <button className="hover:text-primary transition-colors">Mark as {n.read ? 'unread' : 'read'}</button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center bg-card rounded-[2.5rem] border border-dashed border-border shadow-sm">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/20 mb-6">
                <Bell size={32} />
              </div>
              <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Everything is up to date</h3>
              <p className="text-[10px] text-muted-foreground/20 font-medium mt-1">Check back later for system notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
