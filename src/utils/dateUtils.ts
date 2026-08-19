import { ExpirationStatus, PersonalDocument } from '../types';

export function calculateDaysRemaining(expiryDateStr?: string): number | null {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr + 'T23:59:59');
  const now = new Date();
  // Normalize to date difference
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDocumentExpirationStatus(doc: PersonalDocument): {
  status: ExpirationStatus;
  daysRemaining: number | null;
  label: string;
  subLabel: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
} {
  if (doc.isLifetime || !doc.expiryDate) {
    return {
      status: 'lifetime',
      daysRemaining: null,
      label: 'No Expiry',
      subLabel: 'Permanent record',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/50 dark:bg-slate-900/30',
      textClass: 'text-slate-600 dark:text-slate-400',
    };
  }

  const days = calculateDaysRemaining(doc.expiryDate);
  if (days === null) {
    return {
      status: 'lifetime',
      daysRemaining: null,
      label: 'No Expiry',
      subLabel: 'Lifetime document',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/50 dark:bg-slate-900/30',
      textClass: 'text-slate-600 dark:text-slate-400',
    };
  }

  if (days < 0) {
    const expiredDaysAgo = Math.abs(days);
    return {
      status: 'expired',
      daysRemaining: days,
      label: 'Expired',
      subLabel: `Expired ${expiredDaysAgo} day${expiredDaysAgo === 1 ? '' : 's'} ago`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-semibold',
      borderClass: 'border-rose-300 dark:border-rose-900',
      bgClass: 'bg-rose-50/30 dark:bg-rose-950/20',
      textClass: 'text-rose-600 dark:text-rose-400 font-medium',
    };
  }

  if (days <= 30) {
    return {
      status: 'critical',
      daysRemaining: days,
      label: days === 0 ? 'Expires Today!' : `Expires in ${days}d`,
      subLabel: `Action required (${days} day${days === 1 ? '' : 's'} left)`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 font-semibold animate-pulse',
      borderClass: 'border-amber-300 dark:border-amber-800',
      bgClass: 'bg-amber-50/40 dark:bg-amber-950/20',
      textClass: 'text-amber-700 dark:text-amber-400 font-medium',
    };
  }

  if (days <= 90) {
    return {
      status: 'warning',
      daysRemaining: days,
      label: `Expires in ${days}d`,
      subLabel: `Renewal window open (~${Math.ceil(days / 30)} mos)`,
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
      borderClass: 'border-yellow-200 dark:border-yellow-800',
      bgClass: 'bg-yellow-50/20 dark:bg-yellow-950/10',
      textClass: 'text-yellow-700 dark:text-yellow-400',
    };
  }

  const months = Math.round(days / 30);
  const years = (days / 365).toFixed(1);
  return {
    status: 'good',
    daysRemaining: days,
    label: 'Valid',
    subLabel: days > 365 ? `${years} years remaining` : `${months} months remaining`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    borderClass: 'border-emerald-100 dark:border-emerald-900',
    bgClass: 'bg-white dark:bg-zinc-900',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  };
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Generate iCalendar (.ics) content for document renewals
 */
export function generateICalendarForDocument(doc: PersonalDocument): string {
  if (!doc.expiryDate) return '';

  const expiryClean = doc.expiryDate.replace(/-/g, '');
  const nowClean = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `docvault-${doc.id}-${expiryClean}@docvault.local`;
  
  const summary = `Renew: ${doc.title} (${doc.holderName})`;
  const description = [
    `Document: ${doc.title}`,
    `Category: ${doc.category.toUpperCase()}`,
    `Holder: ${doc.holderName}`,
    `Issuer: ${doc.issuer || 'N/A'}`,
    doc.documentNumber ? `ID/Policy #: ${doc.documentNumber}` : '',
    doc.renewalInstructions ? `Instructions: ${doc.renewalInstructions}` : '',
    doc.renewalUrl ? `Renewal Link: ${doc.renewalUrl}` : '',
    `Notes: ${doc.notes || 'No extra notes'}`,
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Personal Document Manager//DocVault//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowClean}`,
    `DTSTART;VALUE=DATE:${expiryClean}`,
    `DTEND;VALUE=DATE:${expiryClean}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${doc.issuer || 'Online / Issuing Authority'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P30D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${doc.title} expires in 30 days!`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Urgent: ${doc.title} expires in 7 days!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Download generated iCal file to user machine
 */
export function downloadICalendarFile(doc: PersonalDocument) {
  const icsContent = generateICalendarForDocument(doc);
  if (!icsContent) return;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_renewal.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Mask a document ID for privacy (e.g. "AB1234567" -> "•••• 4567")
 */
export function maskDocumentNumber(num?: string): string {
  if (!num) return '—';
  if (num.length <= 4) return '•••• ' + num;
  const last4 = num.slice(-4);
  return '•••• ' + last4;
}
