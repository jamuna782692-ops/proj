import React from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { PersonalDocument, ExpirationStatus } from '../types';
import { calculateDaysRemaining } from '../utils/dateUtils';

interface ExpirationBannerProps {
  documents: PersonalDocument[];
  onFilterByStatus: (status: ExpirationStatus | 'all') => void;
  activeStatusFilter: ExpirationStatus | 'all';
}

export const ExpirationBanner: React.FC<ExpirationBannerProps> = ({
  documents,
  onFilterByStatus,
  activeStatusFilter,
}) => {
  const expiredDocs = documents.filter((d) => {
    if (d.isLifetime || !d.expiryDate) return false;
    const days = calculateDaysRemaining(d.expiryDate);
    return days !== null && days < 0;
  });

  const criticalDocs = documents.filter((d) => {
    if (d.isLifetime || !d.expiryDate) return false;
    const days = calculateDaysRemaining(d.expiryDate);
    return days !== null && days >= 0 && days <= 30;
  });

  if (expiredDocs.length === 0 && criticalDocs.length === 0) {
    return null;
  }

  return (
    <section id="expiration-alert-banner" className="mb-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
            {expiredDocs.length > 0 ? (
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <span>Expiring Soon & Renewals</span>
              {expiredDocs.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-md">
                  {expiredDocs.length} Overdue
                </span>
              )}
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              {expiredDocs.length > 0 && (
                <span className="font-semibold text-rose-700">
                  {expiredDocs.length} document{expiredDocs.length === 1 ? '' : 's'} expired.{' '}
                </span>
              )}
              {criticalDocs.length > 0 && (
                <span>
                  {criticalDocs.map((d) => d.title).slice(0, 2).join(' and ')}
                  {criticalDocs.length > 2 ? ` (+${criticalDocs.length - 2} more)` : ''} expire within the next 30 days.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {expiredDocs.length > 0 && (
            <button
              id="filter-expired-banner-btn"
              onClick={() => onFilterByStatus(activeStatusFilter === 'expired' ? 'all' : 'expired')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                activeStatusFilter === 'expired'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
              }`}
            >
              View {expiredDocs.length} Expired
            </button>
          )}

          {criticalDocs.length > 0 && (
            <button
              id="filter-critical-banner-btn"
              onClick={() => onFilterByStatus(activeStatusFilter === 'critical' ? 'all' : 'critical')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                activeStatusFilter === 'critical'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'text-amber-900 bg-white border-amber-200 hover:bg-amber-100/60'
              }`}
            >
              View Alerts
            </button>
          )}
        </div>

      </div>
    </section>
  );
};
