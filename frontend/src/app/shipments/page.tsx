'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Package,
    ArrowRight,
    Search,
    Filter,
    Clock,
    MoreVertical,
    Activity,
    Upload,
    RotateCw,
    Loader2,
    Bell,
    Send,
    X,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Plus,
    MapPin,
    User as UserIcon,
    Globe,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getOrders, uploadCsv, createOrder, getRules, syncTracking, notifyOrder, updateOrder, deleteOrder } from '@/lib/api';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LiveBadge = ({ status }: { status: string | null }) => {
    if (!status) return null;

    const styles: Record<string, string> = {
        Pending: 'text-muted-foreground border-border bg-secondary/50',
        InfoReceived: 'text-blue-600 border-blue-200 bg-blue-50',
        InTransit: 'text-primary border-primary/20 bg-primary/5',
        OutForDelivery: 'text-purple-600 border-purple-200 bg-purple-50',
        Delivered: 'text-success border-success/20 bg-success/5',
        Exception: 'text-red-600 border-red-200 bg-red-50',
        AttemptFail: 'text-warning border-warning/20 bg-warning/5',
        Expired: 'text-muted-foreground border-border bg-secondary/50',
    };

    return (
        <div className="flex items-center gap-1.5 leading-none">
            <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            <Badge variant="outline" className={cn("px-1.5 py-0 text-[8px] font-black uppercase tracking-tighter h-4 border-none bg-transparent", styles[status])}>
                {status}
            </Badge>
        </div>
    );
};

const COUNTRIES = [
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'US', name: 'United States' },
    { code: 'CH', name: 'China' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'TR', name: 'Turkey' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'TR', name: 'Turkey' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'ES', name: 'Spain' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'IN', name: 'India' },
    { code: 'SG', name: 'Singapore' },
    { code: 'QA', name: 'Qatar' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'OM', name: 'Oman' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'JO', name: 'Jordan' },
    { code: 'EG', name: 'Egypt' },
    { code: 'MA', name: 'Morocco' },
];

const CountryInput = ({ label, value, onChange, placeholder }: any) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = COUNTRIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                <Input
                    placeholder={placeholder}
                    value={value}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onChange={e => {
                        onChange(e.target.value.toUpperCase());
                        setSearch(e.target.value);
                    }}
                    className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-bold uppercase"
                />
            </div>
            <AnimatePresence>
                {showSuggestions && (search || value) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
                    >
                        {filtered.length > 0 ? (
                            filtered.map(c => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(c.code);
                                        setSearch('');
                                        setShowSuggestions(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between group"
                                >
                                    <span className="text-[11px] font-black text-foreground group-hover:text-primary transition-colors">{c.code}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground">{c.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-[10px] font-bold text-muted-foreground italic">No matching code</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        NORMAL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        DELAYED: 'bg-red-500/10 text-red-600 border-red-500/20',
        STUCK: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        DELIVERED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    };

    return (
        <Badge variant="outline" className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-wider h-5", styles[status] || styles.NORMAL)}>
            {status.replace('_', ' ')}
        </Badge>
    );
};

export default function ShipmentsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const search = searchParams.get('search') || '';
    const [orders, setOrders] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchValue, setSearchValue] = useState(search);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        riskLevel: '',
        originCountry: '',
        destinationCountry: '',
        customerName: '',
        customerEmail: ''
    });
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [messageBody, setMessageBody] = useState('');
    const [sending, setSending] = useState(false);
    const [notifiedSuccess, setNotifiedSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<any>(null);
    const [orderToEdit, setOrderToEdit] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newOrder, setNewOrder] = useState({
        trackingNumber: '',
        orderId: '',
        customerName: '',
        customerEmail: '',
        shippedDate: new Date().toISOString().split('T')[0],
        originCountry: 'Global',
        destinationCountry: '',
        carrier: '',
        customerPhone: '',
        customerAddress: ''
    });

    const fetchData = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const [ordersRes, rulesRes] = await Promise.all([getOrders(), getRules()]);
            setOrders(ordersRes.data || []);
            setRules(rulesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // Disable parent scroll on mount
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) {
            main.style.overflow = 'hidden';
        }
        return () => {
            if (main) {
                main.style.overflow = 'auto';
            }
        };
    }, []);

    // Sync local state when URL changes externally
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== searchValue) {
            setSearchValue(urlSearch);
        }
    }, [searchParams]);

    // Debounce internal search input to update URL
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
            router.push(`/shipments?${params.toString()}`, { scroll: false });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchValue, router, searchParams]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchData();
        }
    }, [refreshKey, user, authLoading, router, fetchData]);

    useEffect(() => {
        if (!user) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const socket = io(`${apiUrl}/tracking`, { transports: ['websocket'] });
        socket.on('connect', () => socket.emit('joinUser', user.id));
        socket.on('statusUpdate', (updatedOrder: any) => {
            setOrders(prev => prev.map(order =>
                order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
            ));
        });
        return () => { socket.disconnect(); };
    }, [user]);

    const handleSync = async (id: string) => {
        try {
            await syncTracking(id);
        } catch (error) {
            console.error('Manual sync failed:', error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setShowConfirmModal(true);
        e.target.value = '';
    };

    const confirmUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setShowSuccess(false);
        setUploadError(null);
        setShowConfirmModal(false);
        try {
            await uploadCsv(selectedFile);
            await fetchData();
            setRefreshKey(prev => prev + 1);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
            setSelectedFile(null);
        } catch (error: any) {
            const detail = error.response?.data?.message || error.message || 'Upload failed.';
            setUploadError(detail);
        } finally {
            setUploading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const query = searchValue.toLowerCase().trim();
        if (!query) return true;

        // Formatted date string for searching
        const formattedDate = order.shippedDate ? new Date(order.shippedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toLowerCase() : '';

        const searchFields = [
            order.trackingNumber,
            order.orderId,
            order.customerName,
            order.customerEmail,
            order.originCountry,
            order.destinationCountry,
            order.carrier,
            order.status,
            order.aftershipStatus,
            formattedDate
        ];

        return searchFields.some(field =>
            field?.toString().toLowerCase().includes(query)
        );
    });

    const handleNotifyClick = (order: any) => {
        setSelectedOrder(order);
        const matchingRule = rules.find(r => r.originCountry === order.originCountry && r.destinationCountry === order.destinationCountry);
        if (matchingRule?.customMessage) {
            setMessageBody(matchingRule.customMessage.replace(/{name}/g, order.customerName || 'Customer').replace(/{id}/g, order.orderId));
        } else {
            setMessageBody(`Dear ${order.customerName || 'Customer'},\n\nUpdate regarding order #${order.orderId}: Status is ${order.status}.\n\nThank you, ShipPulse Team.`);
        }
        setShowNotifyModal(true);
    };

    const handleSendMessage = async () => {
        if (!selectedOrder || !messageBody) return;
        setSending(true);
        try {
            await notifyOrder(selectedOrder.id, messageBody);
            setShowNotifyModal(false);
            setNotifiedSuccess(true);
            setTimeout(() => setNotifiedSuccess(false), 3000);
        } catch (error: any) {
            console.error('Failed to send notification:', error);
            alert('Failed to send email. Please check your SMTP configuration.');
        } finally {
            setSending(false);
        }
    };

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createOrder(newOrder);
            setShowAddModal(false);
            setNewOrder({
                trackingNumber: '',
                orderId: '',
                customerName: '',
                customerEmail: '',
                shippedDate: new Date().toISOString().split('T')[0],
                originCountry: 'Global',
                destinationCountry: '',
                carrier: '',
                customerPhone: '',
                customerAddress: ''
            });
            await fetchData();
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add shipment.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!orderToDelete) return;
        setLoading(true);
        try {
            await deleteOrder(orderToDelete.id);
            setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
            setShowDeleteModal(false);
            setOrderToDelete(null);
        } catch (error: any) {
            alert('Failed to delete order');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderToEdit) return;
        setIsSaving(true);
        try {
            // Sanitize and format data for backend
            const shippedDate = new Date(orderToEdit.shippedDate);
            const daysPassed = Math.floor((new Date().getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));

            const sanitizedData = {
                trackingNumber: orderToEdit.trackingNumber,
                orderId: orderToEdit.orderId,
                customerName: orderToEdit.customerName,
                customerEmail: orderToEdit.customerEmail,
                shippedDate: shippedDate.toISOString(),
                daysPassed: daysPassed >= 0 ? daysPassed : 0,
                originCountry: orderToEdit.originCountry,
                destinationCountry: orderToEdit.destinationCountry,
                carrier: orderToEdit.carrier,
                customerPhone: orderToEdit.customerPhone,
                customerAddress: orderToEdit.customerAddress,
            };

            await updateOrder(orderToEdit.id, sanitizedData);
            setShowEditModal(false);
            await fetchData();
        } catch (error: any) {
            console.error('Update Error:', error);
            alert('Failed to update order: Please check your input.');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500 pt-0">
            {/* Header / Actions - Absolute Top Layout */}
            <div className="flex-none pt-0 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Package size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-foreground">Shipments</h1>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20">
                                    {filteredOrders.length}
                                </span>
                            </div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Manage your logistics chain</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-64 mr-2 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                            <Input
                                placeholder="Search shipments..."
                                className="h-11 pl-9 pr-10 text-xs rounded-2xl bg-white border-border focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-bold text-foreground"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            {searchValue && (
                                <button
                                    onClick={() => setSearchValue('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>



                        {/* Upload Button */}
                        <div className="relative group">
                            <motion.label
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "w-11 h-11 relative overflow-hidden flex items-center justify-center rounded-2xl cursor-pointer smooth-transition bg-white border border-border text-foreground hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white",
                                    uploading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {uploading ? <RotateCw className="animate-spin relative z-10" size={18} /> : <Upload size={18} className="relative z-10" />}
                                <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={uploading} />
                            </motion.label>
                            <div className="absolute top-full right-0 mt-3 px-2 py-1 bg-black/90 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                {uploading ? 'Processing...' : 'Upload CSV'}
                            </div>
                        </div>

                        {/* Add Shipment Button */}
                        <div className="relative group">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddModal(true)}
                                className="w-11 h-11 relative overflow-hidden bg-white text-foreground rounded-2xl flex items-center justify-center border border-border/50 smooth-transition shadow-sm hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white"
                            >
                                <Plus size={20} className="relative z-10" />
                            </motion.button>
                            <div className="absolute top-full right-0 mt-3 px-2 py-1 bg-black/90 backdrop-blur-md border border-border text-[9px] font-black uppercase tracking-widest text-white rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                Add Shipment
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipments Table Card - Flexible and Scrollable */}
            <Card className="flex-1 min-h-0 border-border overflow-hidden bg-card shadow-sm flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 z-20 bg-muted/40 backdrop-blur-md">
                            <tr className="border-b-2 border-border/70 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                                <th className="px-5 py-4">Tracking #</th>
                                <th className="px-5 py-4">Date</th>
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4">Origin</th>
                                <th className="px-5 py-4">Dest.</th>
                                <th className="px-5 py-4">Carrier</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && orders.length === 0 ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={9} className="px-6 py-8"><div className="h-10 bg-white/5 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center text-white/20 text-sm">No parcels found.</td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors border-b border-border/10 last:border-0 text-sm">
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-mono font-bold text-primary select-all tracking-tight uppercase whitespace-nowrap">{order.trackingNumber}</p>
                                            {order.orderId !== order.trackingNumber && (
                                                <p className="text-[9px] text-muted-foreground font-black tracking-widest mt-0.5">#{order.orderId}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-[11px] font-bold text-foreground/70 whitespace-nowrap">
                                            {new Date(order.shippedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-black text-foreground whitespace-nowrap">{order.customerName || 'N/A'}</p>
                                            <p className="text-[9px] font-medium text-muted-foreground truncate max-w-[120px]" title={order.customerEmail}>{order.customerEmail || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-tight">{order.originCountry || 'GLO'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{order.destinationCountry || 'GLO'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden max-w-[100px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate" title={order.carrier}>
                                                {order.carrier && order.carrier.length > 7
                                                    ? order.carrier.substring(0, 7) + '...'
                                                    : order.carrier || 'Detected'}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-5 py-5">
                                        <div className="flex flex-col items-start gap-1">
                                            <StatusBadge status={order.status} />
                                            {order.aftershipStatus && <LiveBadge status={order.aftershipStatus} />}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <div className="relative group/btn">
                                                <motion.button
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        setOrderToEdit({
                                                            ...order,
                                                            shippedDate: new Date(order.shippedDate).toISOString().split('T')[0]
                                                        });
                                                        setShowEditModal(true);
                                                    }}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted text-foreground hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white smooth-transition overflow-hidden relative"
                                                >
                                                    <Edit size={14} className="relative z-10" />
                                                </motion.button>
                                                <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-black/90 backdrop-blur-md border border-border text-[7px] font-black uppercase tracking-widest text-white rounded-md opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                                    Edit Record
                                                </div>
                                            </div>

                                            <div className="relative group/btn">
                                                <motion.button
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleNotifyClick(order)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted text-foreground hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white smooth-transition overflow-hidden relative"
                                                >
                                                    <Bell size={14} className="relative z-10" />
                                                </motion.button>
                                                <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-black/90 backdrop-blur-md border border-border text-[7px] font-black uppercase tracking-widest text-white rounded-md opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                                    Notify Customer
                                                </div>
                                            </div>

                                            <div className="relative group/btn">
                                                <motion.button
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        setOrderToDelete(order);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted text-red-500 hover:text-white hover:bg-red-500 smooth-transition overflow-hidden relative"
                                                >
                                                    <Trash2 size={14} className="relative z-10" />
                                                </motion.button>
                                                <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-black/90 border border-white/10 text-[7px] font-black uppercase tracking-widest text-white rounded-md opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                                    Delete Record
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Notification Modal */}
            {showNotifyModal && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl border-primary/20 animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <CardTitle className="text-lg">Notify Customer</CardTitle>
                                <CardDescription className="text-[10px]">Manual alert for #{selectedOrder.orderId}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowNotifyModal(false)}><X size={18} /></Button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recipient</label>
                                <p className="text-xs font-black">{selectedOrder.customerName} &lt;{selectedOrder.customerEmail}&gt;</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                                <textarea
                                    className="w-full h-32 bg-secondary/50 border border-border rounded-xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    value={messageBody}
                                    onChange={(e) => setMessageBody(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <div className="flex items-center justify-end p-6 pt-0 gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
                            <Button variant="accent" size="sm" className="gap-2" onClick={handleSendMessage} disabled={sending}>
                                {sending ? <RotateCw className="animate-spin" size={14} /> : <Send size={14} />}
                                {sending ? 'SENDING...' : 'SEND ALERT'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Confirm Upload Modal */}
            {showConfirmModal && selectedFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm shadow-2xl border-primary/20">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Upload size={32} />
                            </div>
                            <CardTitle>Confirm Upload</CardTitle>
                            <CardDescription>Are you sure you want to process <b>{selectedFile.name}</b>?</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                            <Button variant="accent" onClick={confirmUpload}>YES, PROCESS FILE</Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Success Toast (Simulated) */}
            {showSuccess && (
                <div className="fixed bottom-10 right-10 z-[110] animate-in slide-in-from-right-10 fade-in duration-500">
                    <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 border border-emerald-400">
                        <CheckCircle2 size={20} />
                        <div>
                            <p className="font-black text-sm">Upload Successful</p>
                            <p className="text-[10px] uppercase font-bold opacity-90">Shipments synchronized.</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Manual Entry Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-foreground">Manual Entry</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Inject real-time tracking data into the system</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="w-9 h-9 rounded-2xl flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddManual} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tracking Number *</label>
                                        <div className="relative group">
                                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                            <Input required placeholder="e.g. 1Z99..." value={newOrder.trackingNumber} onChange={e => setNewOrder({ ...newOrder, trackingNumber: e.target.value })} className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Order ID</label>
                                        <div className="relative group">
                                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                            <Input placeholder="#ORD-1001" value={newOrder.orderId} onChange={e => setNewOrder({ ...newOrder, orderId: e.target.value })} className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carrier</label>
                                        <div className="relative group">
                                            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                            <Input placeholder="e.g. FedEx" value={newOrder.carrier} onChange={e => setNewOrder({ ...newOrder, carrier: e.target.value })} className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Customer Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                            <Input placeholder="John Doe" value={newOrder.customerName} onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })} className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email *</label>
                                        <div className="relative group">
                                            <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                            <Input required type="email" placeholder="client@..." value={newOrder.customerEmail} onChange={e => setNewOrder({ ...newOrder, customerEmail: e.target.value })} className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ship Date *</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                            <Input required type="date" value={newOrder.shippedDate} onChange={e => setNewOrder({ ...newOrder, shippedDate: e.target.value })} className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 grid grid-cols-2 gap-6">
                                        <CountryInput label="Origin Point" placeholder="SA" value={newOrder.originCountry} onChange={(v: string) => setNewOrder({ ...newOrder, originCountry: v })} />
                                        <CountryInput label="Destination" placeholder="US" value={newOrder.destinationCountry} onChange={(v: string) => setNewOrder({ ...newOrder, destinationCountry: v })} />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowAddModal(false)}
                                        className="rounded-xl h-12 px-8 text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="accent"
                                        disabled={isSaving}
                                        className="h-12 px-10 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                                    >
                                        {isSaving ? <RotateCw className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={16} />}
                                        Save Shipment
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Shipment Modal */}
            <AnimatePresence>
                {showEditModal && orderToEdit && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-foreground">Edit Shipment</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Modify tracking details for #{orderToEdit.orderId}</p>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="w-9 h-9 rounded-2xl flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tracking Number *</label>
                                        <Input required value={orderToEdit.trackingNumber} onChange={e => setOrderToEdit({ ...orderToEdit, trackingNumber: e.target.value })} className="bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Order ID</label>
                                        <Input value={orderToEdit.orderId} onChange={e => setOrderToEdit({ ...orderToEdit, orderId: e.target.value })} className="bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carrier</label>
                                        <Input value={orderToEdit.carrier || ''} onChange={e => setOrderToEdit({ ...orderToEdit, carrier: e.target.value })} className="bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Customer Name</label>
                                        <Input value={orderToEdit.customerName || ''} onChange={e => setOrderToEdit({ ...orderToEdit, customerName: e.target.value })} className="bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email *</label>
                                        <Input required type="email" value={orderToEdit.customerEmail} onChange={e => setOrderToEdit({ ...orderToEdit, customerEmail: e.target.value })} className="bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ship Date *</label>
                                        <Input required type="date" value={orderToEdit.shippedDate} onChange={e => setOrderToEdit({ ...orderToEdit, shippedDate: e.target.value })} className="bg-muted border-border h-12 text-[12px] rounded-2xl font-bold" />
                                    </div>

                                    <div className="md:col-span-3 grid grid-cols-2 gap-6">
                                        <CountryInput label="Origin Point" placeholder="SA" value={orderToEdit.originCountry} onChange={(v: string) => setOrderToEdit({ ...orderToEdit, originCountry: v })} />
                                        <CountryInput label="Destination" placeholder="US" value={orderToEdit.destinationCountry} onChange={(v: string) => setOrderToEdit({ ...orderToEdit, destinationCountry: v })} />
                                    </div>

                                    <div className="md:col-span-3 grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Status</label>
                                            <div className="h-11 flex items-center px-4 bg-muted/50 border border-border/30 rounded-2xl">
                                                <StatusBadge status={orderToEdit.status} />
                                                <span className="ml-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none invisible md:visible">(System)</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Risk Profile</label>
                                            <div className="h-11 flex items-center px-4 bg-muted/50 border border-border/30 rounded-2xl">
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                                    orderToEdit.riskLevel === 'high' ? "bg-red-500/10 text-red-600" :
                                                        orderToEdit.riskLevel === 'medium' ? "bg-amber-500/10 text-amber-600" :
                                                            "bg-emerald-500/10 text-emerald-600"
                                                )}>
                                                    {orderToEdit.riskLevel || 'Low'}
                                                </div>
                                                <span className="ml-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none invisible md:visible">(Rule)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-4 border-t border-border mt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-xl h-12 px-8 text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted transition-all"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="accent"
                                        disabled={isSaving}
                                        className="h-12 px-10 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                                    >
                                        {isSaving ? <RotateCw className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={16} />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && orderToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-card border border-red-500/20 rounded-[2rem] shadow-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-2 text-foreground">Delete Shipment?</h3>
                            <p className="text-xs text-muted-foreground mb-8">This action is irreversible. It will remove #{orderToDelete.orderId} permanently.</p>
                            <div className="flex gap-3">
                                <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                                <Button variant="destructive" className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleDelete}>Delete Now</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
