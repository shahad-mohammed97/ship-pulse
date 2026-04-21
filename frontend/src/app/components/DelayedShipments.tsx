'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DelayedShipmentsProps {
  data: { name: string; count: number }[];
  total: string | number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{ marginLeft: '-50%' }}
        className="relative mb-4"
      >
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-2xl shadow-black/20 flex flex-col items-center min-w-[60px]">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Today</span>
          <span className="text-sm font-black text-zinc-900 dark:text-white">{payload[0].value}</span>
        </div>
        {/* Connection Line & Anchor */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full h-8 border-l border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+32px)] w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
      </motion.div>
    );
  }
  return null;
};

export function DelayedShipments({ data, total }: DelayedShipmentsProps) {
  // Find current day to highlight (simplified for demo)
  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const mappedIndex = currentDayIndex; // Our data starts at Sun (0)

  return (
    <div className="w-full h-full bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-[16px] p-8 shadow-sm flex flex-col transition-colors duration-300">
      {/* Header Section - Symmetrical alignment */}
      <div className="flex flex-col mb-10">
        <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Delayed Analysis</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
            {typeof total === 'number' ? (total / 1000).toFixed(1) + 'k' : total}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total units</span>
        </div>
      </div>

      {/* Chart Section - Centered and Precisely Padded */}
      <div className="flex-1 w-full min-h-[160px] flex items-center justify-center">
        <div className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 30, right: 0, left: 40, bottom: 0 }}
            >
            <CartesianGrid 
              strokeDasharray="4 4" 
              vertical={false} 
              stroke="#E2E8F0" 
              className="dark:stroke-zinc-800/50"
            />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={1}
              tick={(props) => (
                <text 
                  x={0} 
                  y={props.y} 
                  fill="#A1A1AA" 
                  fontSize={10} 
                  fontWeight={700} 
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  {props.payload.value}
                </text>
              )}
              ticks={[50, 100, 150, 200, 250, 300, 350, 400, 450]}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={false}
              wrapperStyle={{ outline: 'none' }}
            />
            <Bar 
              dataKey="count" 
              radius={[100, 100, 100, 100]} 
              barSize={12}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === mappedIndex ? '#F43F5E' : undefined} 
                  className={cn(
                    "transition-colors duration-500",
                    index !== mappedIndex && "fill-zinc-900 dark:fill-zinc-800"
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
