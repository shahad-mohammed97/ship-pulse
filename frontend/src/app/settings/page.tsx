'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronRight,
    Loader2,
    Lock,
    User,
    Mail,
    Save,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { updateProfile } from '@/lib/api';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('account');
    const [profileFormData, setProfileFormData] = useState({
        name: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [profileError, setProfileError] = useState('');

    useEffect(() => {
        if (user) {
            setProfileFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileStatus('loading');
        setProfileError('');

        if (profileFormData.newPassword && profileFormData.newPassword !== profileFormData.confirmPassword) {
            setProfileStatus('error');
            setProfileError('New passwords do not match');
            return;
        }

        try {
            const payload: any = {
                name: profileFormData.name,
                email: profileFormData.email,
            };

            if (profileFormData.newPassword) {
                payload.password = profileFormData.newPassword;
            }

            await updateProfile(payload);
            setProfileStatus('success');
            setTimeout(() => setProfileStatus('idle'), 3000);
        } catch (error: any) {
            setProfileStatus('error');
            setProfileError(error.response?.data?.message || 'Failed to update profile');
        }
    };

    if (authLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const navItems = [
        { id: 'account', label: 'Account Settings', icon: User },
        { id: 'security', label: 'Security & API', icon: Lock },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <aside className="w-64 flex flex-col gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground px-4 mb-4">Configuration</h3>
                    {navItems.map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 5 }}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest smooth-transition group relative overflow-hidden",
                                activeTab === item.id
                                    ? "bg-white text-primary border border-primary/20 shadow-lg shadow-primary/10"
                                    : "text-[#000000] hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white"
                            )}
                        >
                            <item.icon size={18} className="relative z-10 smooth-transition" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="relative z-10">{item.label}</span>
                            {activeTab === item.id && <ChevronRight size={14} className="ml-auto relative z-10 text-primary" />}
                        </motion.button>
                    ))}
                </aside>

                {/* Main Settings Area */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{navItems.find(i => i.id === activeTab)?.label}</h2>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-tight">
                                {activeTab === 'account' ? 'Update your personal information and security credentials.' : `Manage your ${activeTab} preference and system logic.`}
                            </p>
                        </div>
                    </div>

                    {activeTab === 'account' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <Card className="bg-card border border-border overflow-hidden shadow-sm">
                                <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-black tracking-tight">Personal Identity</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Basic details about your account</CardDescription>
                                    </div>
                                    <AnimatePresence>
                                        {profileStatus === 'success' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 flex items-center gap-2 font-black">
                                                    <CheckCircle2 size={12} />
                                                    Changes Applied
                                                </Badge>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Display Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                                    <Input
                                                        value={profileFormData.name}
                                                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                                        className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                                                    <Input
                                                        value={profileFormData.email}
                                                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                                                        className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border">
                                            <div className="flex items-center gap-2 mb-6">
                                                <Lock size={14} className="text-primary" />
                                                <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">Security Credentials</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={profileFormData.newPassword}
                                                        onChange={(e) => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                                                        className="bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={profileFormData.confirmPassword}
                                                        onChange={(e) => setProfileFormData({ ...profileFormData, confirmPassword: e.target.value })}
                                                        className="bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6">
                                            {profileStatus === 'error' && (
                                                <p className="text-[10px] font-black uppercase tracking-tight text-destructive flex items-center gap-2">
                                                    <AlertCircle size={14} />
                                                    {profileError}
                                                </p>
                                            )}
                                            <div className="ml-auto w-full md:w-auto">
                                                <Button
                                                    disabled={profileStatus === 'loading'}
                                                    type="submit"
                                                    variant="accent"
                                                    className="w-full md:w-auto h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 smooth-transition flex items-center justify-center gap-3"
                                                >
                                                    {profileStatus === 'loading' ? (
                                                        <Loader2 className="animate-spin" size={16} />
                                                    ) : (
                                                        <Save size={16} />
                                                    )}
                                                    <span>Commit Changes</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[2rem] border border-dashed border-border shadow-sm">
                            <Lock size={48} className="text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-black text-muted-foreground/40 italic text-center px-8">Advanced Security & API configuration module coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
