'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    if (formData.currentPassword && !formData.newPassword) {
        setStatus('error');
        setErrorMsg('Please enter a new password');
        return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setStatus('error');
      setErrorMsg('New passwords do not match');
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
      };
      
      if (formData.newPassword) {
        payload.password = formData.newPassword;
      }

      await updateProfile(payload);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-xl border border-border/50 bg-white text-[#000000] hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white font-bold shadow-sm smooth-transition"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Account Settings</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Manage your identity and security</p>
          </div>
        </div>
        
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full flex items-center gap-2 font-black">
                <CheckCircle2 size={14} />
                Changes saved successfully
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Summary */}
        <div className="space-y-6">
          <Card className="bg-card border border-border p-6 shadow-sm text-center">
            <div className="relative inline-block mt-4">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary relative overflow-hidden group shadow-sm">
                <User size={40} strokeWidth={1.5} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                <Shield size={10} className="text-background" />
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-black text-foreground">{user.name}</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{user.email}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs font-black text-foreground">Active</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-foreground">Admin</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-card border border-border p-5 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Security Level</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary rounded-full" />
              </div>
              <span className="text-[10px] font-black text-primary">High</span>
            </div>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Your account is protected with strong credentials. Enable 2FA for maximum security.
            </p>
          </Card>
        </div>

        {/* Right Column - Edit Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card border border-border overflow-hidden shadow-sm">
            <CardHeader className="p-6 border-b border-border">
              <CardTitle className="text-lg font-black tracking-tight text-foreground">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                    <Input 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-11 bg-muted border-border h-12 text-[12px] rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-6">
                  <div className="p-6 rounded-[2rem] bg-muted border border-border mb-6">
                    <h5 className="text-[11px] font-black text-primary mb-1 flex items-center gap-2 uppercase tracking-widest">
                      <Lock size={14} />
                      Security Credentials
                    </h5>
                    <p className="text-[10px] text-muted-foreground font-medium mb-6">Leave blank if you don't want to change it</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input 
                          type="password"
                          placeholder="New Password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          className="bg-card border-border h-10 text-[11px] rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input 
                          type="password"
                          placeholder="Confirm New Password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className="bg-card border-border h-10 text-[11px] rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-border">
                  {status === 'error' && (
                    <p className="text-[10px] font-bold text-destructive flex items-center gap-2">
                      <AlertCircle size={14} />
                      {errorMsg}
                    </p>
                  )}
                  <div className={cn("ml-auto flex items-center gap-4", status === 'idle' && "opacity-100")}>
                    <div className="relative group">
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={status === 'loading'}
                        type="submit"
                        className="bg-white text-[#000000] hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white border border-border/50 h-12 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/5 flex items-center gap-2 relative overflow-hidden smooth-transition"
                      >
                        {status === 'loading' ? (
                          <Loader2 className="animate-spin relative z-10 text-primary" size={16} />
                        ) : (
                          <Save size={16} className="relative z-10 smooth-transition" />
                        )}
                        <span className="relative z-10">Commit Changes</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
