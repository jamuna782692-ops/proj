import { DocumentCategory } from '../types';

export interface CategoryMeta {
  id: DocumentCategory;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
}

export const CATEGORIES: Record<DocumentCategory, CategoryMeta> = {
  identification: {
    id: 'identification',
    label: 'IDs & Passports',
    shortLabel: 'Identity & IDs',
    description: "Passports, Driver's Licenses, Visas, National ID Cards",
    iconName: 'Shield',
    themeColor: 'blue',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  certificates: {
    id: 'certificates',
    label: 'Certificates & Degrees',
    shortLabel: 'Certificates',
    description: 'Diplomas, Certifications, Birth & Marriage Certificates',
    iconName: 'Award',
    themeColor: 'amber',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  insurance: {
    id: 'insurance',
    label: 'Insurance Policies',
    shortLabel: 'Insurance',
    description: 'Health, Auto, Homeowners, Renters, Dental, Life Insurance',
    iconName: 'ShieldCheck',
    themeColor: 'green',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-700',
    badgeBorder: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  warranties: {
    id: 'warranties',
    label: 'Warranties & Receipts',
    shortLabel: 'Warranties',
    description: 'Electronics, Appliances, Hardware, Extended Service Plans',
    iconName: 'Sparkles',
    themeColor: 'purple',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  medical: {
    id: 'medical',
    label: 'Medical & Health',
    shortLabel: 'Medical Records',
    description: 'Immunization Records, Prescriptions, Medical Directives',
    iconName: 'HeartPulse',
    themeColor: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  financial: {
    id: 'financial',
    label: 'Financial & Tax',
    shortLabel: 'Financial & Tax',
    description: 'Tax Returns, Deeds, Leases, Loan Agreements, Titles',
    iconName: 'FileText',
    themeColor: 'rose',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  vehicles: {
    id: 'vehicles',
    label: 'Vehicle Registrations',
    shortLabel: 'Vehicles',
    description: 'Vehicle Titles, Smog Checks, Registration Cards, Toll Passes',
    iconName: 'Car',
    themeColor: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  other: {
    id: 'other',
    label: 'General & Other',
    shortLabel: 'Other Docs',
    description: 'Memberships, Subscriptions, Contracts, Pet Licenses',
    iconName: 'Folder',
    themeColor: 'slate',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
};
