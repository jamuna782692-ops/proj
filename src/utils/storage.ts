import { PersonalDocument, Profile, VaultSettings } from '../types';
import { INITIAL_DOCUMENTS, DEFAULT_PROFILES } from '../data/defaultDocuments';

const STORAGE_KEYS = {
  DOCUMENTS: 'docvault_documents_v1',
  PROFILES: 'docvault_profiles_v1',
  SETTINGS: 'docvault_settings_v1',
  THEME: 'docvault_theme_v1',
};

export function loadDocumentsFromStorage(): PersonalDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!raw) {
      saveDocumentsToStorage(INITIAL_DOCUMENTS);
      return INITIAL_DOCUMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DOCUMENTS;
  } catch (err) {
    console.error('Failed to load documents from localStorage:', err);
    return INITIAL_DOCUMENTS;
  }
}

export function saveDocumentsToStorage(docs: PersonalDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save documents to localStorage:', err);
  }
}

export function loadProfilesFromStorage(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      saveProfilesToStorage(DEFAULT_PROFILES);
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
  } catch (err) {
    console.error('Failed to load profiles:', err);
    return DEFAULT_PROFILES;
  }
}

export function saveProfilesToStorage(profiles: Profile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save profiles:', err);
  }
}

export function loadVaultSettings(): VaultSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const defaultSettings: VaultSettings = {
        isPinProtected: false,
        autoLockMinutes: 15,
        maskSensitiveNumbersByDefault: true,
      };
      saveVaultSettings(defaultSettings);
      return defaultSettings;
    }
    return JSON.parse(raw);
  } catch {
    return {
      isPinProtected: false,
      autoLockMinutes: 15,
      maskSensitiveNumbersByDefault: true,
    };
  }
}

export function saveVaultSettings(settings: VaultSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save vault settings:', err);
  }
}

export function exportVaultBackup(documents: PersonalDocument[], profiles: Profile[]) {
  const payload = {
    app: 'DocVault Personal Document Manager',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    documentCount: documents.length,
    documents,
    profiles,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `docvault_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importVaultBackup(
  jsonString: string
): { success: boolean; documents?: PersonalDocument[]; profiles?: Profile[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.documents)) {
      return { success: false, error: 'Invalid backup file format. Expected a documents list.' };
    }

    const importedDocs: PersonalDocument[] = parsed.documents;
    const importedProfiles: Profile[] = Array.isArray(parsed.profiles) && parsed.profiles.length > 0
      ? parsed.profiles
      : DEFAULT_PROFILES;

    return {
      success: true,
      documents: importedDocs,
      profiles: importedProfiles,
    };
  } catch (err: any) {
    return { success: false, error: `Failed to parse backup JSON: ${err.message}` };
  }
}
