import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, FileCheck } from 'lucide-react';
import { PersonalDocument, ExpirationStatus } from '../types';
import { calculateDaysRemaining } from '../utils/dateUtils';

interface StatsOverviewProps {
  documents: PersonalDocument[];
  activeStatusFilter: ExpirationStatus | 'all';
  onSelectStatusFilter: (status: ExpirationStatus | 'all') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  documents,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  let expiredCount = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let goodCount = 0;
  let lifetimeCount = 0;

  documents.forEach((doc) => {
    if (doc.isLifetime || !doc.expiryDate) {
      lifetimeCount++;
      return;
    }
    const days = calculateDaysRemaining(doc.expiryDate);
    if (days === null) {
      lifetimeCount++;
    } else if (days < 0) {
      expiredCount++;
    } else if (days <= 30) {
      criticalCount++;
    } else if (days <= 90) {
      warningCount++;
    } else {
      goodCount++;
    }
  });

  const total = documents.length;
  const expiringSoonTotal = criticalCount + warningCount;

  const statItems = [
    {
      id: 'stat-total',
      filterKey: 'all' as const,
      label: 'All Documents',
      count: total,
      subtext: 'Cataloged in vault',
      icon: FileCheck,
      iconBg: 'bg-indigo-100 text-indigo-600',
      activeBorder: 'border-indigo-600 ring-1 ring-indigo-600',
    },
    {
      id: 'stat-good',
      filterKey: 'good' as const,
      label: 'Valid & Active',
      count: goodCount,
      subtext: '> 90 days validity',
      icon: ShieldCheck,
      iconBg: 'bg-green-100 text-green-600',
      activeBorder: 'border-green-600 ring-1 ring-green-600',
    },
    {
      id: 'stat-expiring',
      filterKey: 'warning' as const,
      label: 'Expiring Soon',
      count: expiringSoonTotal,
      subtext: `${criticalCount} urgent (<30d)`,
      icon: Clock,
      iconBg: 'bg-amber-100 text-amber-600',
      activeBorder: 'border-amber-600 ring-1 ring-amber-600',
      badge: criticalCount > 0 ? `${criticalCount} Urgent` : undefined,
    },
    {
      id: 'stat-expired',
      filterKey: 'expired' as const,
      label: 'Expired',
      count: expiredCount,
      subtext: expiredCount > 0 ? 'Requires renewal' : 'Zero overdue',
      icon: AlertTriangle,
      iconBg: 'bg-rose-100 text-rose-600',
      activeBorder: 'border-rose-600 ring-1 ring-rose-600',
      badge: expiredCount > 0 ? `${expiredCount} Overdue` : undefined,
    },
  ];

  return (
    <section aria-label="Document Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((item) => {
        const isActive = activeStatusFilter === item.filterKey;
        return (
          <button
            key={item.id}
            id={item.id}
            type="button"
            onClick={() => onSelectStatusFilter(isActive ? 'all' : item.filterKey)}
            className={`text-left p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:border-slate-300 hover:shadow-sm ${
              isActive ? item.activeBorder : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                <item.icon className="w-5 h-5" />
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                  {item.badge}
                </span>
              )}
            </div>

            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {item.count}
            </div>

            <div className="text-xs font-semibold text-slate-700 mt-0.5">
              {item.label}
            </div>

            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {item.subtext}
            </div>
          </button>
        );
      })}
    </section>
  );
};
