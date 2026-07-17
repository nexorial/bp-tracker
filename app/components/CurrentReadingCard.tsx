'use client';

import React, { useMemo } from 'react';

export interface BPRecord {
  id: number;
  systolic: number;
  diastolic: number;
  heart_rate: number;
  recorded_at: string;
  notes: string | null;
}

export interface CurrentReadingCardProps {
  record: BPRecord;
}

type BPCategory = 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis';

function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'high2';
  if (systolic >= 130 || diastolic >= 80) return 'high1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  return 'normal';
}

function getBPCategoryConfig(category: BPCategory): { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  switch (category) {
    case 'normal':
      return { 
        label: 'Normal', 
        color: 'text-health-normal', 
        bgColor: 'bg-health-normal/10',
        borderColor: 'border-health-normal/20',
        icon: 'OK'
      };
    case 'elevated':
      return { 
        label: 'Elevated', 
        color: 'text-health-elevated', 
        bgColor: 'bg-health-elevated/10',
        borderColor: 'border-health-elevated/20',
        icon: 'UP'
      };
    case 'high1':
      return { 
        label: 'High Stage 1', 
        color: 'text-health-high-1', 
        bgColor: 'bg-health-high-1/10',
        borderColor: 'border-health-high-1/20',
        icon: '!'
      };
    case 'high2':
      return { 
        label: 'High Stage 2', 
        color: 'text-health-high-2', 
        bgColor: 'bg-health-high-2/10',
        borderColor: 'border-health-high-2/20',
        icon: '!!'
      };
    case 'crisis':
      return { 
        label: 'Crisis', 
        color: 'text-health-crisis', 
        bgColor: 'bg-health-crisis/10',
        borderColor: 'border-health-crisis/20',
        icon: 'SOS'
      };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function HeartPulse({ bpm }: { bpm: number }) {
  const animationDuration = useMemo(() => {
    return `${60 / bpm}s`;
  }, [bpm]);

  return (
    <div className="flex items-center gap-2">
      <svg 
        className="w-5 h-5 text-health-high-2" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        style={{
          animation: `pulse ${animationDuration} ease-in-out infinite`
        }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span className="font-mono text-lg text-text-primary">{bpm}</span>
      <span className="text-sm text-text-tertiary">BPM</span>
    </div>
  );
}

export function CurrentReadingCard({ record }: CurrentReadingCardProps) {
  const category = classifyBP(record.systolic, record.diastolic);
  const config = getBPCategoryConfig(category);

  return (
    <div className={`card-elevated relative overflow-hidden ${config.borderColor} border`}>
      <div className={`absolute inset-0 ${config.bgColor} opacity-30`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-h4 text-text-primary">Current Reading</h2>
              <p className="text-sm text-text-secondary">{formatFullDate(record.recorded_at)}</p>
            </div>
          </div>

          <div className={`badge ${
            category === 'normal' ? 'badge-normal' :
            category === 'elevated' ? 'badge-elevated' :
            category === 'high1' ? 'badge-high-1' :
            category === 'high2' ? 'badge-high-2' : 'badge-crisis'
          }`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <span className="font-mono text-[64px] leading-none font-bold text-text-primary tracking-tight">
            {record.systolic}
          </span>
          <span className="font-mono text-[48px] leading-none font-light text-text-secondary">
            /
          </span>
          <span className="font-mono text-[64px] leading-none font-bold text-text-primary tracking-tight">
            {record.diastolic}
          </span>
          <span className="text-base font-medium text-text-secondary uppercase tracking-wide ml-2">
            mmHg
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
          <HeartPulse bpm={record.heart_rate} />
          
          <div className="text-sm text-text-tertiary">
            Recorded {formatDate(record.recorded_at)}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default CurrentReadingCard;
