'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES as BASE_COUNTRIES } from '@/lib/countries';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const COUNTRIES = [{ name: "Global", code: "Global" }, ...BASE_COUNTRIES];

export default function CountrySelect({ value, onChange, placeholder = "Select...", disabled }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the selected country based on either name or code (supporting legacy name storage)
  const selectedCountry = COUNTRIES.find(c => c.name === value || c.code === value);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When opening, reset search to empty to show all options
  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm('');
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative group" ref={containerRef}>
      <div
        onClick={handleTriggerClick}
        className={cn(
          "h-12 w-full bg-muted border border-border rounded-2xl px-4 flex items-center justify-between cursor-pointer transition-all hover:border-border/80",
          isOpen && "border-primary ring-2 ring-primary/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex-1 overflow-hidden">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={selectedCountry ? selectedCountry.code : placeholder}
              className="w-full bg-transparent border-none outline-none text-[12px] font-bold text-foreground placeholder:text-muted-foreground/40"
            />
          ) : (
            <span className={cn(
              "text-[12px] font-black tracking-widest truncate",
              selectedCountry ? (selectedCountry.code === 'Global' ? "text-primary" : "text-foreground") : "text-muted-foreground/40"
            )}>
              {selectedCountry ? selectedCountry.code : placeholder}
            </span>
          )}
        </div>
        {!isOpen && (
            <ChevronDown 
                size={16} 
                className={cn(
                    "text-muted-foreground/40 transition-transform duration-300 ml-2 shrink-0",
                    isOpen && "rotate-180 text-primary"
                )} 
            />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[110] w-full mt-3 bg-card border border-border rounded-[28px] shadow-xl overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => {
                  const isGlobal = country.code === 'Global';
                  return (
                    <motion.div
                      key={country.code}
                      whileHover={{ x: 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(country.code); // Storing code (ISO) to match Order data (CN, AE, etc)
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all group mb-1 last:mb-0",
                        (value === country.name || value === country.code) 
                          ? "bg-primary/10 text-primary font-black shadow-sm" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                          <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all",
                              isGlobal 
                                ? "bg-primary text-background border-primary/20 shadow-sm" 
                                : "bg-muted border-border group-hover:border-primary/30 group-hover:text-primary"
                          )}>
                              {isGlobal ? <Globe size={14} /> : country.code}
                          </div>
                          <div>
                            <span className="text-[11px] font-black tracking-tight block">{country.name}</span>
                          </div>
                      </div>
                      {(value === country.name || value === country.code) && <Check size={14} className="text-primary" />}
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground/20">
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching countries</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
