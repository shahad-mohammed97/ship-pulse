'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { register as registerApi } from '@/lib/api';
import { Package, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await registerApi({ name, email, password });
      if (res.data.access_token) {
        login(res.data.access_token, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="mb-10 text-center animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-6 shadow-sm border border-primary/20">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground">Create account</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Global Logistics Network</p>
        </div>

        <div className="w-full bg-card rounded-[2.5rem] border border-border p-10 shadow-xl animate-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-destructive/20 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full pl-12 pr-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="w-full pl-12 pr-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  className="w-full pl-12 pr-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/40"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-6 items-center pt-4">
              <div className="w-full relative group">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-white text-[#000000] rounded-full font-black text-xs uppercase tracking-widest hover:text-primary hover:bg-muted/50 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden smooth-transition shadow-lg border border-border/50"
                >
                  {loading ? <Loader2 className="animate-spin relative z-10" size={20} /> : (
                    <>
                      <span className="relative z-10">Create Account</span>
                      <ArrowRight size={18} className="relative z-10 smooth-transition" />
                    </>
                  )}
                </motion.button>
              </div>
              
              <Link href="/login" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:text-foreground transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
        
        <p className="mt-12 text-muted-foreground/20 text-[9px] font-black uppercase tracking-[0.4em]">
          ShipPulse Control • System 4.0
        </p>
      </div>
    </div>
  );
}
