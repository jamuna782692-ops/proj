import React, { useState, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Download, 
  Upload, 
  FileJson, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { PersonalDocument, Profile } from '../types';
import { exportVaultBackup, importVaultBackup } from '../utils/storage';

interface CalendarExportModalProps {
  documents: PersonalDocument[];
  profiles: Profile[];
  onClose: () => void;
  onRestoreBackup: (docs: PersonalDocument[], profiles: Profile[]) => void;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  documents,
  profiles,
  onClose,
  onRestoreBackup,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate combined .ics calendar of all expiring documents
  const handleExportAllCalendar = () => {
    const expiringDocs = documents.filter((d) => !d.isLifetime && d.expiryDate);
    if (expiringDocs.length === 0) {
      alert('No documents with expiration dates found.');
      return;
    }

    const nowClean = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const events: string[] = [];

    expiringDocs.forEach((doc) => {
      if (!doc.expiryDate) return;
      const expiryClean = doc.expiryDate.replace(/-/g, '');
      const uid = `vaultly-${doc.id}-${expiryClean}@vaultly.local`;
      const summary = `Renewal: ${doc.title} (${doc.holderName})`;
      const desc = `Document: ${doc.title}\\nCategory: ${doc.category.toUpperCase()}\\nHolder: ${doc.holderName}\\nIssuer: ${doc.issuer || 'N/A'}`;

      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowClean}`,
          `DTSTART;VALUE=DATE:${expiryClean}`,
          `DTEND;VALUE=DATE:${expiryClean}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${desc}`,
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
        ].join('\r\n')
      );
    });

    const fullCalendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Personal Document Manager//Vaultly//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([fullCalendar], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vaultly_all_renewals_${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackupExport = () => {
    exportVaultBackup(documents, profiles);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      const res = importVaultBackup(content);
      if (res.success && res.documents) {
        onRestoreBackup(res.documents, res.profiles || profiles);
        setImportStatus(`Successfully restored ${res.documents.length} documents!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setImportError(res.error || 'Failed to import backup file.');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const docsWithExpirations = documents.filter((d) => !d.isLifetime && d.expiryDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        id="calendar-export-modal"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Export, Sync & Backup
              </h2>
              <p className="text-xs text-slate-500">Google Calendar sync, .ics download & vault backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Calendar Sync Section */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Sync Expirations with Calendar</span>
              </h3>
              <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                Generates an iCalendar (.ics) file with alerts scheduled at 30 days and 7 days prior. Compatible with Google Calendar, Apple Calendar, and Outlook.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-indigo-800">
                {docsWithExpirations.length} Tracked Renewals
              </span>

              <button
                id="download-master-ics-btn"
                onClick={handleExportAllCalendar}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ICS Feed</span>
              </button>
            </div>
          </div>

          {/* Full JSON Vault Backup Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-purple-600" />
                <span>Vault Data Backup (Offline Archive)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export all {documents.length} cataloged certificates, IDs, warranties, policies, custom tags, and attached scans to a portable JSON backup file.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                id="export-json-backup-btn"
                onClick={handleBackupExport}
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export Backup</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json,application/json"
                className="hidden"
              />

              <button
                id="import-json-backup-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Restore Backup</span>
              </button>
            </div>
          </div>

          {importStatus && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xs hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
