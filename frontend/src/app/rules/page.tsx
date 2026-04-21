'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Trash2,
  Edit2,
  Plane,
  Clock,
  MessageSquare,
  Loader2,
  X,
  Globe,
  Database,
} from 'lucide-react';
import { getRules, createRule, updateRule, deleteRule } from '@/lib/api';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import CountrySelect from '@/components/CountrySelect';
import { COUNTRIES } from '@/lib/countries';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RulesPage() {
  const { user, loading: authLoading } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const getCountryName = (code: string) => {
    if (!code) return 'Any';
    if (code === 'Global') return 'Global';
    return COUNTRIES.find(c => c.code === code || c.name === code)?.name || code;
  };

  const [formData, setFormData] = useState({
    originCountry: '',
    destinationCountry: '',
    carrier: '',
    shippingType: '',
    minDays: 7,
    stuckDays: 3,
    maxDays: 14,
    customMessage: ''
  });

  const fetchRules = async () => {
    try {
      const res = await getRules();
      setRules(res.data);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRules();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await updateRule(editingRule.id, formData);
      } else {
        await createRule(formData);
      }
      setShowModal(false);
      setEditingRule(null);
      setFormData({
        originCountry: '',
        destinationCountry: '',
        carrier: '',
        shippingType: '',
        minDays: 7,
        stuckDays: 3,
        maxDays: 14,
        customMessage: ''
      });
      fetchRules();
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await deleteRule(id);
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      originCountry: rule.originCountry,
      destinationCountry: rule.destinationCountry,
      carrier: rule.carrier || '',
      shippingType: rule.shippingType || '',
      minDays: rule.minDays,
      stuckDays: rule.stuckDays || 3,
      maxDays: rule.maxDays,
      customMessage: rule.customMessage || ''
    });
    setShowModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pt-0">
      {/* Header / Actions - Absolute Top Layout (Synced with Shipments) */}
      <div className="flex-none pt-0 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground">Analysis Rules</h1>
                <Badge variant="outline" className="h-5 px-2 text-[10px] bg-primary/5 text-primary border-primary/10 rounded-lg font-black">
                  {rules.length}
                </Badge>
              </div>
              <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Configure automated shipment monitoring logic</p>
            </div>
          </div>

          <div className="relative group">
            <Button
              onClick={() => { setEditingRule(null); setShowModal(true); }}
              variant="accent"
              className="h-12 px-8 rounded-xl font-black text-[11px] tracking-widest flex items-center gap-3 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus size={18} strokeWidth={3} />
              <span>ADD NEW RULE</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar px-2 pb-12">
        <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto py-6">
          {rules.map((rule, idx) => {
            const isGlobal = rule.originCountry === 'Global' && rule.destinationCountry === 'Global';
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-card border border-border overflow-hidden shadow-sm group hover:border-primary/30 transition-all">
                  <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-border bg-muted text-primary transition-transform group-hover:scale-110">
                        <Plane size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h4 className="text-lg font-black tracking-tight text-foreground">
                            {isGlobal ? 'System Global Default' : `${rule.originCountry} → ${rule.destinationCountry}`}
                          </h4>
                          {isGlobal && <Badge className="bg-primary/10 text-primary border-0 text-[10px] h-5 px-3 font-black">FALLBACK</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{rule.carrier || 'ANY CARRIER'} • {rule.shippingType || 'ANY TYPE'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Delayed At</p>
                        <p className="text-base font-black text-primary">&gt; {rule.minDays}d</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Stucked At</p>
                        <p className="text-base font-black text-warning">&gt; {rule.stuckDays || 3}d</p>
                      </div>
                      <div className="flex items-center gap-3 ml-6">
                        <div className="relative group/btn">
                          <motion.button
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(rule)}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-muted text-[#000000] hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white smooth-transition border border-border/50 shadow-sm"
                          >
                            <Edit2 size={18} />
                          </motion.button>
                        </div>
                        {!isGlobal && (
                          <div className="relative group/btn">
                            <motion.button
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(rule.id)}
                              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/5 text-red-500 hover:text-white hover:bg-red-500 active:bg-red-600 smooth-transition border border-red-500/10 shadow-sm"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 animate-in fade-in duration-300">
            <Card className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-[24px] overflow-hidden">
              <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-foreground">Rule Configuration</CardTitle>
                  <CardDescription className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Define delivery thresholds</CardDescription>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted text-[#000000] hover:text-primary hover:bg-primary/10 smooth-transition border border-border/50"
                >
                  <X size={16} />
                </motion.button>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Origin</label>
                      <CountrySelect
                        value={formData.originCountry}
                        onChange={(val) => setFormData({ ...formData, originCountry: val })}
                        placeholder="e.g. China"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Destination</label>
                      <CountrySelect
                        value={formData.destinationCountry}
                        onChange={(val) => setFormData({ ...formData, destinationCountry: val })}
                        placeholder="e.g. Saudi Arabia"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Carrier</label>
                      <Input
                        value={formData.carrier}
                        onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                        placeholder="e.g. DHL"
                        className="h-9 border-border/40 bg-muted/20 font-bold rounded-xl text-[11px] focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Shipping Type</label>
                      <Input
                        value={formData.shippingType}
                        onChange={(e) => setFormData({ ...formData, shippingType: e.target.value })}
                        placeholder="e.g. Express"
                        className="h-9 border-border/40 bg-muted/20 font-bold rounded-xl text-[11px] focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Delayed (Days)</label>
                      <div className="relative group">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={12} />
                        <Input
                          type="number"
                          value={formData.minDays}
                          onChange={(e) => setFormData({ ...formData, minDays: parseInt(e.target.value) })}
                          className="h-9 pl-9 border-primary/20 bg-primary/5 text-primary font-black rounded-xl text-xs focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Stucked (Days)</label>
                      <div className="relative group">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-warning" size={12} />
                        <Input
                          type="number"
                          value={formData.stuckDays}
                          onChange={(e) => setFormData({ ...formData, stuckDays: parseInt(e.target.value) })}
                          className="h-9 pl-9 border-warning/20 bg-warning/5 text-warning font-black rounded-xl text-xs focus-visible:ring-warning/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Alert Message</label>
                    <div className="relative group">
                      <MessageSquare className="absolute left-3 top-2.5 text-muted-foreground/30" size={12} />
                      <textarea
                        className="w-full h-16 bg-muted border border-border rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none text-foreground"
                        value={formData.customMessage}
                        onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                        placeholder="Template..."
                      />
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 border-t border-border flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl h-11 px-6 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted transition-all"
                  >
                    CANCEL
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    className="h-11 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                  >
                    SAVE CONFIGURATION
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
