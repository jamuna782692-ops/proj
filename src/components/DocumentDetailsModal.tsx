import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  Paperclip, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  AlertTriangle,
  Printer,
  Share2,
  Shield,
  Award,
  HeartPulse,
  Car,
  Folder,
  BellRing
} from 'lucide-react';
import { PersonalDocument, Profile, DocumentCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { getDocumentExpirationStatus, formatDate, downloadICalendarFile, maskDocumentNumber } from '../utils/dateUtils';

interface DocumentDetailsModalProps {
  document: PersonalDocument;
  profiles: Profile[];
  onClose: () => void;
  onEdit: (doc: PersonalDocument) => void;
  onDelete: (id: string) => void;
  onToggleMask: (id: string) => void;
}

const CATEGORY_ICONS: Record<DocumentCategory, React.ComponentType<{ className?: string }>> = {
  identification: Shield,
  certificates: Award,
  insurance: ShieldCheck,
  warranties: Sparkles,
  medical: HeartPulse,
  financial: FileText,
  vehicles: Car,
  other: Folder,
};

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  document: doc,
  profiles,
  onClose,
  onEdit,
  onDelete,
  onToggleMask,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(
    doc.attachments.length > 0 ? doc.attachments[0].dataUrl : null
  );

  const catMeta = CATEGORIES[doc.category] || CATEGORIES.other;
  const CategoryIcon = CATEGORY_ICONS[doc.category] || Folder;
  const expStatus = getDocumentExpirationStatus(doc);
  const profile = profiles.find((p) => p.id === doc.profileId);

  const handleCopyDocNumber = () => {
    if (!doc.documentNumber) return;
    navigator.clipboard.writeText(doc.documentNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleShareSummary = () => {
    const text = [
      `📋 Document: ${doc.title}`,
      `Category: ${catMeta.label}`,
      `Holder: ${doc.holderName}`,
      doc.documentNumber ? `ID/Policy #: ${doc.documentNumber}` : '',
      `Issuer: ${doc.issuer || 'N/A'}`,
      doc.expiryDate ? `Expiration: ${formatDate(doc.expiryDate)} (${expStatus.subLabel})` : 'Status: Permanent Record',
      doc.renewalUrl ? `Renewal Link: ${doc.renewalUrl}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        id="doc-details-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${catMeta.iconBg} rounded-xl flex items-center justify-center ${catMeta.iconColor} shadow-2xs`}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {catMeta.label}
                </span>
                {profile && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-700">
                    {profile.name}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {doc.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="details-share-btn"
              onClick={handleShareSummary}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Copy Summary"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              id="details-print-btn"
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              id="details-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          
          {/* Expiration Status Card */}
          <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  Expiration & Renewal Status
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {expStatus.subLabel}
                </span>
              </div>
            </div>

            {!doc.isLifetime && doc.expiryDate && (
              <button
                id="details-add-calendar-btn"
                onClick={() => downloadICalendarFile(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export to Calendar (.ics)</span>
              </button>
            )}
          </div>

          {/* Primary Metadata 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
            
            {/* Document ID Number */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Document / Policy #
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {doc.documentNumber 
                    ? (doc.isMasked ? maskDocumentNumber(doc.documentNumber) : doc.documentNumber)
                    : 'Not Specified'}
                </span>
                {doc.documentNumber && (
                  <>
                    <button
                      onClick={() => onToggleMask(doc.id)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title={doc.isMasked ? 'Reveal Number' : 'Mask Number'}
                    >
                      {doc.isMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleCopyDocNumber}
                      className="text-slate-400 hover:text-indigo-600 p-1"
                      title="Copy Number"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Holder Name */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Document Holder
              </label>
              <span className="text-sm font-semibold text-slate-900">
                {doc.holderName}
              </span>
            </div>

            {/* Issuing Authority */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Issuing Entity / Authority
              </label>
              <span className="text-sm font-semibold text-slate-900">
                {doc.issuer || 'N/A'}
              </span>
            </div>

            {/* Issue & Expiration Dates */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Validity Period
              </label>
              <span className="text-sm font-semibold text-slate-900">
                {doc.issueDate ? formatDate(doc.issueDate) : 'Unknown'} →{' '}
                {doc.isLifetime ? 'Lifetime / Never Expires' : doc.expiryDate ? formatDate(doc.expiryDate) : 'Permanent'}
              </span>
            </div>
          </div>

          {/* Renewal Guidance & Links */}
          {(doc.renewalInstructions || doc.renewalUrl) && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Renewal & Action Guidance</span>
              </h4>
              {doc.renewalInstructions && (
                <p className="text-xs text-indigo-950 leading-relaxed">
                  {doc.renewalInstructions}
                </p>
              )}
              {doc.renewalUrl && (
                <a
                  href={doc.renewalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
                >
                  <span>Official Renewal Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Custom Specification Fields */}
          {doc.customFields && doc.customFields.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Custom Specifications & Fields
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {doc.customFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80"
                  >
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
                      {cf.label}
                    </span>
                    <span className="text-xs font-bold text-slate-800 font-mono truncate block mt-0.5">
                      {cf.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tags & Labels
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {doc.notes && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Notes & Backup Instructions
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {doc.notes}
              </div>
            </div>
          )}

          {/* Scanned Attachments */}
          {doc.attachments && doc.attachments.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Scanned Attachments ({doc.attachments.length})</span>
                <span className="text-[10px] text-slate-400 normal-case">Stored in local vault</span>
              </h4>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {doc.attachments.map((att) => (
                    <button
                      key={att.id}
                      onClick={() => setSelectedAttachment(att.dataUrl)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        selectedAttachment === att.dataUrl
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px]">{att.name}</span>
                    </button>
                  ))}
                </div>

                {selectedAttachment && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-2 flex items-center justify-center">
                    <img
                      src={selectedAttachment}
                      alt="Attachment Preview"
                      referrerPolicy="no-referrer"
                      className="max-h-72 w-auto object-contain rounded-lg shadow-2xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            id="details-delete-btn"
            onClick={() => {
              if (confirm('Are you sure you want to delete this document from the vault?')) {
                onDelete(doc.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Close
            </button>
            <button
              id="details-edit-btn"
              onClick={() => {
                onClose();
                onEdit(doc);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Document</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
