/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpDown, 
  FileText, 
  Menu,
  X,
  Lock,
  RotateCcw
} from 'lucide-react';
import { 
  PersonalDocument, 
  Profile, 
  VaultSettings, 
  DocumentCategory, 
  ExpirationStatus 
} from './types';
import { 
  loadDocumentsFromStorage, 
  saveDocumentsToStorage, 
  loadProfilesFromStorage, 
  saveProfilesToStorage,
  loadVaultSettings,
  saveVaultSettings
} from './utils/storage';
import { INITIAL_DOCUMENTS, DEFAULT_PROFILES } from './data/defaultDocuments';
import { calculateDaysRemaining } from './utils/dateUtils';
import { CATEGORIES } from './data/categories';

// Components
import { Sidebar } from './components/Sidebar';
import { ExpirationBanner } from './components/ExpirationBanner';
import { StatsOverview } from './components/StatsOverview';
import { DocumentCard } from './components/DocumentCard';
import { DocumentDetailsModal } from './components/DocumentDetailsModal';
import { DocumentFormModal } from './components/DocumentFormModal';
import { AuditAdviceModal } from './components/AuditAdviceModal';
import { VaultSecurityModal } from './components/VaultSecurityModal';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { CalendarExportModal } from './components/CalendarExportModal';

export default function App() {
  // Storage States
  const [documents, setDocuments] = useState<PersonalDocument[]>(loadDocumentsFromStorage);
  const [profiles, setProfiles] = useState<Profile[]>(loadProfilesFromStorage);
  const [vaultSettings, setVaultSettings] = useState<VaultSettings>(loadVaultSettings);

  // Vault Lock State
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(() => {
    const s = loadVaultSettings();
    return s.isPinProtected;
  });

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [selectedProfileId, setSelectedProfileId] = useState<string | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ExpirationStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'expiryDate' | 'title' | 'category' | 'updatedAt'>('expiryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [activeDetailDoc, setActiveDetailDoc] = useState<PersonalDocument | null>(null);
  const [formModalDoc, setFormModalDoc] = useState<PersonalDocument | null | 'new'>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);

  // Persistence Effects
  useEffect(() => {
    saveDocumentsToStorage(documents);
  }, [documents]);

  useEffect(() => {
    saveProfilesToStorage(profiles);
  }, [profiles]);

  // Mask Toggle
  const handleToggleMask = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isMasked: !d.isMasked } : d))
    );
    if (activeDetailDoc && activeDetailDoc.id === id) {
      setActiveDetailDoc((prev) => (prev ? { ...prev, isMasked: !prev.isMasked } : null));
    }
  };

  // Add / Edit Save
  const handleSaveDocument = (savedDoc: PersonalDocument) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === savedDoc.id);
      if (exists) {
        return prev.map((d) => (d.id === savedDoc.id ? savedDoc : d));
      } else {
        return [savedDoc, ...prev];
      }
    });

    if (activeDetailDoc && activeDetailDoc.id === savedDoc.id) {
      setActiveDetailDoc(savedDoc);
    }
  };

  // Delete
  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDetailDoc && activeDetailDoc.id === id) {
      setActiveDetailDoc(null);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm('Reset document database to default starter certificates and IDs?')) {
      setDocuments(INITIAL_DOCUMENTS);
      setProfiles(DEFAULT_PROFILES);
      saveDocumentsToStorage(INITIAL_DOCUMENTS);
      saveProfilesToStorage(DEFAULT_PROFILES);
    }
  };

  // Quick Add from AI Advisor
  const handleQuickAddMissing = (recTitle: string, recCategory: string) => {
    const validCat = (
      ['identification', 'certificates', 'insurance', 'warranties', 'medical', 'financial', 'vehicles', 'other'].includes(recCategory.toLowerCase())
        ? recCategory.toLowerCase()
        : 'other'
    ) as DocumentCategory;

    const draftDoc: PersonalDocument = {
      id: 'doc-quick-' + Date.now(),
      title: recTitle,
      category: validCat,
      holderName: profiles[0]?.name || 'Alex Vance',
      profileId: profiles[0]?.id || 'p-self',
      issuer: '',
      isLifetime: false,
      reminderDaysBefore: [90, 30, 7],
      tags: [validCat.toUpperCase(), 'Essential'],
      customFields: [],
      attachments: [],
      isMasked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFormModalDoc(draftDoc);
  };

  // Filter & Sort computation
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesIssuer = doc.issuer?.toLowerCase().includes(query);
        const matchesHolder = doc.holderName?.toLowerCase().includes(query);
        const matchesNumber = doc.documentNumber?.toLowerCase().includes(query);
        const matchesNotes = doc.notes?.toLowerCase().includes(query);
        const matchesTags = doc.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesCustom = doc.customFields?.some(
          (cf) => cf.label.toLowerCase().includes(query) || cf.value.toLowerCase().includes(query)
        );

        if (!matchesTitle && !matchesIssuer && !matchesHolder && !matchesNumber && !matchesNotes && !matchesTags && !matchesCustom) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }

      // 3. Profile Filter
      if (selectedProfileId !== 'all' && doc.profileId !== selectedProfileId) {
        return false;
      }

      // 4. Status Filter
      if (selectedStatusFilter !== 'all') {
        const isLife = doc.isLifetime || !doc.expiryDate;
        const days = calculateDaysRemaining(doc.expiryDate);

        if (selectedStatusFilter === 'lifetime' && !isLife) return false;
        if (selectedStatusFilter === 'expired' && (isLife || days === null || days >= 0)) return false;
        if (selectedStatusFilter === 'critical' && (isLife || days === null || days < 0 || days > 30)) return false;
        if (selectedStatusFilter === 'warning' && (isLife || days === null || days < 0 || days > 90)) return false;
        if (selectedStatusFilter === 'good' && (isLife || days === null || days <= 90)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortBy === 'category') {
        return sortOrder === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      }
      if (sortBy === 'updatedAt') {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      // Expiration Date default
      if (a.isLifetime && !b.isLifetime) return 1;
      if (!a.isLifetime && b.isLifetime) return -1;
      if (a.isLifetime && b.isLifetime) return 0;
      if (!a.expiryDate && b.expiryDate) return 1;
      if (a.expiryDate && !b.expiryDate) return -1;
      if (!a.expiryDate && !b.expiryDate) return 0;

      const dateA = new Date(a.expiryDate!).getTime();
      const dateB = new Date(b.expiryDate!).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [documents, searchQuery, selectedCategory, selectedProfileId, selectedStatusFilter, sortBy, sortOrder]);

  const activeCategoryMeta = selectedCategory !== 'all' ? CATEGORIES[selectedCategory] : null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Clean Minimalist Left Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        documents={documents}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={setSelectedProfileId}
        isVaultLocked={isVaultLocked}
        vaultSettings={vaultSettings}
        onOpenAuditModal={() => setShowAuditModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenSecurityModal={() => setShowSecurityModal(true)}
        onUnlockClick={() => setShowUnlockModal(true)}
        onLockClick={() => setIsVaultLocked(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-5 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        
        {/* Main Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeCategoryMeta ? activeCategoryMeta.label : 'My Documents'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {documents.length} records organized • Expiration reminders active
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="doc-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs..."
                className="w-full pl-9.5 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lock / Unlock Toggle Button */}
            {vaultSettings.isPinProtected && (
              <button
                onClick={() => {
                  if (isVaultLocked) setShowUnlockModal(true);
                  else setIsVaultLocked(true);
                }}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isVaultLocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={isVaultLocked ? 'Click to unlock' : 'Click to lock'}
              >
                <Lock className="w-4 h-4" />
                <span className="hidden md:inline">{isVaultLocked ? 'Locked' : 'Lock Vault'}</span>
              </button>
            )}

            {/* Primary "+ Add New" Button */}
            <button
              id="add-doc-main-btn"
              onClick={() => setFormModalDoc('new')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>
        </header>

        {/* Expiring Soon Alert Banner */}
        <ExpirationBanner
          documents={documents}
          onFilterByStatus={setSelectedStatusFilter}
          activeStatusFilter={selectedStatusFilter}
        />

        {/* Stats Overview */}
        <StatsOverview
          documents={documents}
          activeStatusFilter={selectedStatusFilter}
          onSelectStatusFilter={setSelectedStatusFilter}
        />

        {/* Filter sub-header with count and sort */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Showing
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-full">
              {filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'}
            </span>

            {selectedStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <span>Filter: {selectedStatusFilter}</span>
                <button
                  onClick={() => setSelectedStatusFilter('all')}
                  className="font-bold hover:text-amber-950 ml-1"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden sm:inline">Sort:</span>
            </div>
            <select
              id="sort-documents-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="expiryDate">Expiration Date (Earliest)</option>
              <option value="title">Document Name (A-Z)</option>
              <option value="category">Category</option>
              <option value="updatedAt">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Locked Vault Screen */}
        {isVaultLocked ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs p-8 max-w-md mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Vault is Locked
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
              Your certificates, warranties, policies and IDs are locked with PIN security.
            </p>
            <button
              id="unlock-vault-center-btn"
              onClick={() => setShowUnlockModal(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Unlock Vault
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 my-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No documents found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No documents matching "${searchQuery}". Clear your search keyword or change filters.`
                : 'No documents in this category. Click "+ Add New" to add a certificate, ID, or policy.'}
            </p>
            <div className="mt-5">
              {searchQuery || selectedCategory !== 'all' || selectedStatusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setFormModalDoc('new')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  Add First Document
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Documents Grid (3-column layout) */
          <div id="documents-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                profiles={profiles}
                onView={(d) => setActiveDetailDoc(d)}
                onEdit={(d) => setFormModalDoc(d)}
                onDelete={handleDeleteDocument}
                onToggleMask={handleToggleMask}
              />
            ))}

            {/* Dashed "+ Add New Document" card tile */}
            <div
              id="add-doc-card-tile"
              onClick={() => setFormModalDoc('new')}
              className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-all min-h-[220px] p-5 bg-white/40 hover:bg-white group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 mb-2 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add New Document</span>
            </div>
          </div>
        )}

        {/* Footer info & Reset option */}
        <footer className="mt-auto pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Vaultly • Personal Document & Expiration Manager</span>
            <span>•</span>
            <button
              onClick={handleResetDefaults}
              className="text-slate-400 hover:text-slate-600 underline flex items-center gap-1"
              title="Reset initial demo data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Encrypted Local Storage</span>
            <span>•</span>
            <span>AI Auto-OCR Enabled</span>
            <span>•</span>
            <span>.ICS Calendar Sync</span>
          </div>
        </footer>

      </main>

      {/* Modals */}
      {activeDetailDoc && (
        <DocumentDetailsModal
          document={activeDetailDoc}
          profiles={profiles}
          onClose={() => setActiveDetailDoc(null)}
          onEdit={(d) => setFormModalDoc(d)}
          onDelete={handleDeleteDocument}
          onToggleMask={handleToggleMask}
        />
      )}

      {formModalDoc && (
        <DocumentFormModal
          initialDocument={formModalDoc === 'new' ? null : formModalDoc}
          profiles={profiles}
          onClose={() => setFormModalDoc(null)}
          onSave={handleSaveDocument}
        />
      )}

      {showAuditModal && (
        <AuditAdviceModal
          documents={documents}
          onClose={() => setShowAuditModal(false)}
          onQuickAddMissing={handleQuickAddMissing}
        />
      )}

      {showSecurityModal && (
        <VaultSecurityModal
          settings={vaultSettings}
          onSaveSettings={(newSettings) => {
            setVaultSettings(newSettings);
            saveVaultSettings(newSettings);
          }}
          onClose={() => setShowSecurityModal(false)}
          onLockNow={() => setIsVaultLocked(true)}
        />
      )}

      {showUnlockModal && (
        <VaultUnlockModal
          settings={vaultSettings}
          onUnlockSuccess={() => {
            setIsVaultLocked(false);
            setShowUnlockModal(false);
          }}
          onCancel={() => setShowUnlockModal(false)}
        />
      )}

      {showExportModal && (
        <CalendarExportModal
          documents={documents}
          profiles={profiles}
          onClose={() => setShowExportModal(false)}
          onRestoreBackup={(restoredDocs, restoredProfiles) => {
            setDocuments(restoredDocs);
            setProfiles(restoredProfiles);
            saveDocumentsToStorage(restoredDocs);
            saveProfilesToStorage(restoredProfiles);
          }}
        />
      )}

    </div>
  );
}
