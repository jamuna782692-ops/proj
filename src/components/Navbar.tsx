import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Lock, 
  Unlock, 
  Download, 
  Upload, 
  Calendar, 
  Users, 
  Search, 
  X,
  RotateCcw
} from 'lucide-react';
import { Profile, VaultSettings } from '../types';

interface NavbarProps {
  profiles: Profile[];
  selectedProfileId: string | 'all';
  onSelectProfile: (id: string | 'all') => void;
  vaultSettings: VaultSettings;
  isVaultLocked: boolean;
  onUnlockClick: () => void;
  onLockClick: () => void;
  onOpenAddModal: () => void;
  onOpenAuditModal: () => void;
  onOpenExportModal: () => void;
  onOpenSecurityModal: () => void;
  onResetDefaults: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  vaultSettings,
  isVaultLocked,
  onUnlockClick,
  onLockClick,
  onOpenAddModal,
  onOpenAuditModal,
  onOpenExportModal,
  onOpenSecurityModal,
  onResetDefaults,
  searchQuery,
  onSearchChange,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const currentProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold tracking-tight">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  DocVault
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full border border-blue-200/60 dark:border-blue-800">
                  Manager
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Certificates, IDs & Expiration Reminders
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="doc-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search certificates, policies, tags, ID #..."
                className="w-full pl-9.5 pr-8 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Family Profile Switcher */}
            <div className="relative hidden md:block">
              <button
                id="profile-dropdown-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition"
              >
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span>{selectedProfileId === 'all' ? 'All Profiles' : currentProfile?.name || 'Profile'}</span>
              </button>

              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Filter by Person
                  </div>
                  <button
                    id="profile-filter-all"
                    onClick={() => { onSelectProfile('all'); setShowProfileMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                      selectedProfileId === 'all' 
                        ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300' 
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>All Household Members</span>
                    {selectedProfileId === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      id={`profile-filter-${p.id}`}
                      onClick={() => { onSelectProfile(p.id); setShowProfileMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                        selectedProfileId === p.id 
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300' 
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                        <span className="text-[10px] text-zinc-400">({p.relation})</span>
                      </div>
                      {selectedProfileId === p.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Advisor Button */}
            <button
              id="ai-audit-advisor-btn"
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-lg transition"
              title="AI Expiration & Coverage Audit"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">AI Smart Audit</span>
            </button>

            {/* Security Vault Lock Button */}
            {vaultSettings.isPinProtected ? (
              <button
                id="vault-lock-toggle-btn"
                onClick={isVaultLocked ? onUnlockClick : onLockClick}
                className={`p-2 rounded-lg text-xs font-medium border transition ${
                  isVaultLocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                }`}
                title={isVaultLocked ? 'Vault is Locked (Click to Unlock)' : 'Vault Unlocked (Click to Lock)'}
              >
                {isVaultLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            ) : (
              <button
                id="vault-security-settings-btn"
                onClick={onOpenSecurityModal}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition"
                title="Vault Security & Privacy Settings"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Backup & Tools Dropdown */}
            <div className="relative">
              <button
                id="vault-tools-btn"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition"
                title="Backup, Sync & Options"
              >
                <Download className="w-4 h-4" />
              </button>

              {showActionsMenu && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 z-50"
                  onMouseLeave={() => setShowActionsMenu(false)}
                >
                  <button
                    id="menu-export-backup"
                    onClick={() => { onOpenExportModal(); setShowActionsMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    <span>Export / Calendar Sync</span>
                  </button>
                  <button
                    id="menu-security-settings"
                    onClick={() => { onOpenSecurityModal(); setShowActionsMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>PIN & Security Settings</span>
                  </button>
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-700" />
                  <button
                    id="menu-reset-samples"
                    onClick={() => {
                      if (confirm('Reset documents to sample test documents?')) {
                        onResetDefaults();
                      }
                      setShowActionsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-zinc-400" />
                    <span>Load Sample Documents</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Add Document Button */}
            <button
              id="add-document-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="font-medium">Add Document</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
