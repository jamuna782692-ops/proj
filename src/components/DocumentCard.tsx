import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Calendar, 
  Download, 
  Paperclip, 
  Clock, 
  MoreVertical, 
  Copy, 
  Check, 
  Shield, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  HeartPulse, 
  FileText, 
  Car, 
  Folder,
  Trash2,
  Edit2
} from 'lucide-react';
import { PersonalDocument, DocumentCategory, Profile } from '../types';
import { CATEGORIES } from '../data/categories';
import { getDocumentExpirationStatus, formatDate, downloadICalendarFile, maskDocumentNumber } from '../utils/dateUtils';

interface DocumentCardProps {
  document: PersonalDocument;
  profiles: Profile[];
  onView: (doc: PersonalDocument) => void;
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

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  profiles,
  onView,
  onEdit,
  onDelete,
  onToggleMask,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const catMeta = CATEGORIES[doc.category] || CATEGORIES.other;
  const CategoryIcon = CATEGORY_ICONS[doc.category] || Folder;
  const expStatus = getDocumentExpirationStatus(doc);
  const profile = profiles.find((p) => p.id === doc.profileId);

  const handleCopyDocNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doc.documentNumber) return;
    navigator.clipboard.writeText(doc.documentNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICalendarFile(doc);
  };

  // Status badge styling according to Clean Minimalism guidelines
  let statusBadgeClass = 'bg-slate-100 text-slate-500';
  if (expStatus.status === 'expired') {
    statusBadgeClass = 'bg-red-100 text-red-600';
  } else if (expStatus.status === 'critical') {
    statusBadgeClass = 'bg-red-100 text-red-600';
  } else if (expStatus.status === 'warning') {
    statusBadgeClass = 'bg-amber-100 text-amber-600';
  } else if (doc.isLifetime) {
    statusBadgeClass = 'bg-indigo-50 text-indigo-600';
  }

  return (
    <div
      id={`doc-card-${doc.id}`}
      onClick={() => onView(doc)}
      className="group relative bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col cursor-pointer min-h-[220px]"
    >
      {/* Top Row: Category Icon Box + Expiration Tag + Menu */}
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${catMeta.iconBg} rounded-xl flex items-center justify-center ${catMeta.iconColor} shadow-2xs`}>
          <CategoryIcon className="w-6 h-6" />
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-1 ${statusBadgeClass} text-[10px] font-bold rounded uppercase tracking-wider`}>
            {expStatus.label}
          </span>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              id={`doc-menu-btn-${doc.id}`}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => { onView(doc); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => { onEdit(doc); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
                {!doc.isLifetime && doc.expiryDate && (
                  <button
                    onClick={(e) => { handleCalendarClick(e); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Add to Calendar</span>
                  </button>
                )}
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => { onDelete(doc.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <h4 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
        {doc.title}
      </h4>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        {doc.documentNumber ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span>
              ID: {doc.isMasked ? maskDocumentNumber(doc.documentNumber) : doc.documentNumber}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMask(doc.id);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title={doc.isMasked ? 'Reveal number' : 'Mask number'}
            >
              {doc.isMasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={handleCopyDocNumber}
              className="text-slate-400 hover:text-indigo-600 p-0.5"
              title="Copy ID number"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <span className="italic">{doc.issuer || 'Personal Record'}</span>
        )}
      </div>

      {/* Tags or summary snippet */}
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {doc.tags.slice(0, 3).map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
            >
              #{t}
            </span>
          ))}
          {doc.attachments && doc.attachments.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-md">
              <Paperclip className="w-2.5 h-2.5" />
              <span>{doc.attachments.length}</span>
            </span>
          )}
        </div>
      )}

      {/* Card Bottom Footer */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
        <span className="text-slate-500 font-semibold">{catMeta.shortLabel}</span>
        <span>
          {profile ? `${profile.name} • ` : ''}
          {doc.expiryDate ? `Expires ${formatDate(doc.expiryDate)}` : 'Permanent'}
        </span>
      </div>
    </div>
  );
};
