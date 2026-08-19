import React from 'react';
import { 
  Folder, 
  Shield, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  HeartPulse, 
  FileText, 
  Car, 
  Layers,
  Lock,
  Unlock,
  Calendar,
  Users,
  X
} from 'lucide-react';
import { DocumentCategory, PersonalDocument, Profile, VaultSettings } from '../types';
import { CATEGORIES } from '../data/categories';

interface SidebarProps {
  selectedCategory: DocumentCategory | 'all';
  onSelectCategory: (cat: DocumentCategory | 'all') => void;
  documents: PersonalDocument[];
  profiles: Profile[];
  selectedProfileId: string | 'all';
  onSelectProfile: (id: string | 'all') => void;
  isVaultLocked: boolean;
  vaultSettings: VaultSettings;
  onOpenAuditModal: () => void;
  onOpenExportModal: () => void;
  onOpenSecurityModal: () => void;
  onUnlockClick: () => void;
  onLockClick: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  documents,
  profiles,
  selectedProfileId,
  onSelectProfile,
  isVaultLocked,
  vaultSettings,
  onOpenAuditModal,
  onOpenExportModal,
  onOpenSecurityModal,
  onUnlockClick,
  onLockClick,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Compute category counts
  const counts: Record<string, number> = {
    all: documents.length,
  };
  documents.forEach((d) => {
    counts[d.category] = (counts[d.category] || 0) + 1;
  });

  const totalAttachments = documents.reduce((acc, d) => acc + (d.attachments?.length || 0), 0);
  const storagePercentage = Math.min(100, Math.max(15, (documents.length * 8) + (totalAttachments * 12)));

  const categoryKeys: DocumentCategory[] = [
    'identification',
    'insurance',
    'certificates',
    'warranties',
    'medical',
    'financial',
    'vehicles',
    'other',
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 p-6 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs">
            V
          </div>
          <div>
            <span className="text-xl font-semibold tracking-tight text-slate-900 block leading-tight">
              Vaultly
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Document Manager</span>
          </div>
        </div>

        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Household Profile Switcher */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>Profile</span>
        </div>
        <select
          id="sidebar-profile-select"
          value={selectedProfileId}
          onChange={(e) => onSelectProfile(e.target.value)}
          className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Household ({documents.length} docs)</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.relation})
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Categories */}
      <nav className="flex-1 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Categories
        </div>

        {/* All Documents */}
        <button
          id="sidebar-cat-all"
          type="button"
          onClick={() => {
            onSelectCategory('all');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors text-left ${
            selectedCategory === 'all'
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>All Documents</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-indigo-200/60 text-indigo-800' : 'text-slate-400'}`}>
            {counts.all || 0}
          </span>
        </button>

        {/* Categories List */}
        {categoryKeys.map((catKey) => {
          const catMeta = CATEGORIES[catKey];
          const Icon = CATEGORY_ICONS[catKey] || Folder;
          const isSelected = selectedCategory === catKey;
          const count = counts[catKey] || 0;

          return (
            <button
              key={catKey}
              id={`sidebar-cat-${catKey}`}
              type="button"
              onClick={() => {
                onSelectCategory(catKey);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors text-left ${
                isSelected
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate">{catMeta.shortLabel}</span>
              </div>
              {count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-indigo-200/60 text-indigo-800' : 'text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Tools */}
      <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Tools
        </div>

        <button
          id="sidebar-ai-audit-btn"
          type="button"
          onClick={onOpenAuditModal}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Health Auditor</span>
        </button>

        <button
          id="sidebar-calendar-sync-btn"
          type="button"
          onClick={onOpenExportModal}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md font-medium transition"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Sync & .ICS Export</span>
        </button>

        <button
          id="sidebar-security-btn"
          type="button"
          onClick={onOpenSecurityModal}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md font-medium transition"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Passcode & Privacy</span>
        </button>
      </div>

      {/* Storage Used Box */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-indigo-700 uppercase">
              Storage Used
            </p>
            {vaultSettings.isPinProtected && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                <Lock className="w-2.5 h-2.5" /> PIN
              </span>
            )}
          </div>
          <div className="w-full bg-indigo-200 h-1.5 rounded-full mb-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-indigo-600 font-medium">
            {documents.length} docs • {totalAttachments} scans stored
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-full h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
