'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  MapPin,
  Plane,
  Truck,
  Ship,
  Globe,
  MoreVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { getOrders, getStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DelayedShipments } from './components/DelayedShipments';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data for Revenue Trends
const revenueData = [
  { name: 'Mon', revenue: 4200 },
  { name: 'Tue', revenue: 3800 },
  { name: 'Wed', revenue: 5100 },
  { name: 'Thu', revenue: 4600 },
  { name: 'Fri', revenue: 5900 },
  { name: 'Sat', revenue: 3200 },
  { name: 'Sun', revenue: 2800 },
];

const fleetStatus = [
  { label: 'Air Freight', percentage: 88, icon: Plane, color: 'text-primary' },
  { label: 'Road Transport', percentage: 72, icon: Truck, color: 'text-blue-600' },
  { label: 'Sea Logistics', percentage: 45, icon: Ship, color: 'text-warning' },
];
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    delayed: 0,
    stuck: 0,
    delivered: 0,
    normal: 0,
    delayedTrends: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([getOrders(search), getStats()]);
      setOrders(ordersRes.data.slice(0, 5));
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const getPercentage = (count: number) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  const statCards = [
    { label: 'Normal Shipments', value: stats.normal, subValue: 'Live', icon: Package, color: 'blue' },
    { label: 'Stucked Shipments', value: stats.stuck, subValue: 'Action needed', icon: ShieldAlert, color: 'yellow' },
    { label: 'Delayed Shipments', value: stats.delayed, subValue: 'Monitoring', icon: Clock, color: 'red' },
    { label: 'Delivered Shipments', value: stats.delivered, subValue: 'Completed', icon: CheckCircle2, color: 'green' },
  ];

  const shipmentDistribution = [
    { label: 'Normal', percentage: getPercentage(stats.normal), icon: Package, color: 'text-blue-400' },
    { label: 'Stucked', percentage: getPercentage(stats.stuck), icon: ShieldAlert, color: 'text-yellow-400' },
    { label: 'Delayed', percentage: getPercentage(stats.delayed), icon: Clock, color: 'text-red-400' },
    { label: 'Delivered', percentage: getPercentage(stats.delivered), icon: CheckCircle2, color: 'text-green-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full items-stretch">

        {/* Left Column (35%) */}
        <div className="lg:w-[35%] flex flex-col gap-6 min-w-0">

          {/* Metric Grid (2x2) */}
          <div className="grid grid-cols-2 gap-6">
            {statCards.map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -2 }}
                className="charcoal-card p-4 relative overflow-hidden group cursor-pointer border border-border bg-card shadow-sm hover:shadow-md"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "p-2 rounded-xl border border-border",
                      card.color === 'blue' && "bg-blue-600/10 text-blue-600",
                      card.color === 'green' && "bg-green-600/10 text-green-600",
                      card.color === 'red' && "bg-red-600/10 text-red-600",
                      card.color === 'yellow' && "bg-yellow-600/10 text-yellow-600"
                    )}>
                      <card.icon size={20} />
                    </div>

                  </div>
                  <h3 className="text-2xl font-black tracking-tighter mb-1 text-foreground">{loading ? '...' : card.value}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{card.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Shipment List - Expanded Height */}
          <Card className="charcoal-card flex-[2.5] flex flex-col overflow-hidden min-h-0 border-0">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                    Recent Shipments
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">LIVE</Badge>
                  </CardTitle>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Tracking pipeline</p>
                </div>
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={fetchData}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted text-[#000000] hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white smooth-transition relative overflow-hidden"
                  >
                    <RefreshCw size={16} className={cn("relative z-10", loading && "animate-spin")} />
                  </motion.button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-2">
              <div className="space-y-3">
                <AnimatePresence>
                  {orders.map((order, i) => (
                    <motion.div
                      key={order.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-[1rem] bg-primary/15 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black font-mono px-3 py-1 rounded-full bg-muted text-primary group-hover:bg-primary/10 transition-colors">
                          {order.trackingNumber || 'NO TRACKING'}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            order.status === 'NORMAL' && "bg-blue-500",
                            order.status === 'STUCK' && "bg-yellow-500",
                            order.status === 'DELAYED' && "bg-red-500",
                            order.status === 'DELIVERED' && "bg-green-500"
                          )} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            order.status === 'NORMAL' && "text-blue-500",
                            order.status === 'STUCK' && "text-yellow-500",
                            order.status === 'DELAYED' && "text-red-500",
                            order.status === 'DELIVERED' && "text-green-500"
                          )}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground">{order.originCountry || 'INT'} → {order.destinationCountry || 'INT'}</span>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{order.carrier || 'Standard'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[14px] font-black text-foreground">{order.daysPassed}</span>
                          <span className="text-[8px] uppercase font-black text-muted-foreground tracking-widest">Days</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (65%) */}
        <div className="lg:w-[65%] flex flex-col gap-6">

          {/* Live Map Card */}
          <Card className="flex-[1.5] relative overflow-hidden border-0 bg-black shadow-none rounded-[16px]">
            {/* Premium Purple Neon City Lights View */}
            <div className="absolute inset-0">
              <img 
                src="/images/city_lights_purple.png"
                alt="Global Operations - Purple City Lights"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </Card>

          <div className="flex flex-col md:flex-row gap-6 h-fit shrink-0">
            {/* Delayed Analysis Chart - High Fidelity Overhaul */}
            <div className="flex-[2] h-full">
              <DelayedShipments 
                data={stats.delayedTrends} 
                total={stats.total} 
              />
            </div>

            {/* Shipment Status Breakdown */}
            <Card className="flex-1 p-6 bg-primary border-0 shadow-xl shadow-primary/20 rounded-[16px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardTitle className="text-xl font-black mb-1 text-white relative z-10">Shipment Status</CardTitle>
              <p className="text-[11px] uppercase font-bold tracking-widest text-white/50 mb-8 relative z-10">Overview distribution</p>

              <div className="space-y-6 relative z-10">
                {shipmentDistribution.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon size={14} className={item.color} />
                        <span className="text-[11px] font-bold text-white">{item.label}</span>
                      </div>
                      <span className="text-xs font-black text-white">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className="h-full bg-white rounded-full transition-all shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
