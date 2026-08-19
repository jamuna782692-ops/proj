export type DocumentCategory = 
  | 'identification'
  | 'certificates'
  | 'insurance'
  | 'warranties'
  | 'medical'
  | 'financial'
  | 'vehicles'
  | 'other';

export type ExpirationStatus = 
  | 'expired'          // Past expiration date
  | 'critical'         // Expiring within 30 days
  | 'warning'          // Expiring within 90 days
  | 'good'             // Expiring > 90 days
  | 'lifetime';        // Does not expire

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string; // Base64 data url or preview link
  size?: number;
  uploadedAt: string;
}

export interface PersonalDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  documentNumber?: string;
  holderName: string;
  profileId?: string; // Links to a family member / profile
  issuer: string;
  issueDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD (null/empty if lifetime)
  isLifetime: boolean;
  reminderDaysBefore: number[]; // e.g. [90, 30, 7]
  notes?: string;
  renewalInstructions?: string;
  renewalUrl?: string;
  tags: string[];
  customFields: CustomField[];
  attachments: DocumentAttachment[];
  isMasked?: boolean; // Protect document number from shoulder surfing
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  relation: string; // 'Self', 'Spouse', 'Child', 'Parent', 'Other'
  color: string;
  avatarIcon?: string;
}

export interface VaultSettings {
  isPinProtected: boolean;
  pinHash?: string;
  autoLockMinutes: number;
  lastUnlockedTime?: number;
  maskSensitiveNumbersByDefault: boolean;
}

export interface DocumentFilterOptions {
  searchQuery: string;
  category: DocumentCategory | 'all';
  expirationStatus: ExpirationStatus | 'all';
  profileId: string | 'all';
  selectedTag?: string;
  sortBy: 'expiryDate' | 'title' | 'updatedAt' | 'category';
  sortOrder: 'asc' | 'desc';
}

export interface AuditRecommendation {
  urgencyScore: 'Low' | 'Moderate' | 'High';
  urgentWarnings: string[];
  recommendedMissingDocs: {
    title: string;
    category: string;
    reason: string;
    priority: string;
  }[];
  generalAdvice: string[];
}
