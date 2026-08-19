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
  Layers
} from 'lucide-react';
import { DocumentCategory, PersonalDocument } from '../types';
import { CATEGORIES } from '../data/categories';

interface CategoryFilterBarProps {
  selectedCategory: DocumentCategory | 'all';
  onSelectCategory: (cat: DocumentCategory | 'all') => void;
  documents: PersonalDocument[];
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

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  documents,
}) => {
  // Compute counts per category
  const counts: Record<string, number> = {
    all: documents.length,
  };

  documents.forEach((d) => {
    counts[d.category] = (counts[d.category] || 0) + 1;
  });

  const categoryList: (DocumentCategory | 'all')[] = [
    'all',
    'identification',
    'certificates',
    'insurance',
    'warranties',
    'medical',
    'financial',
    'vehicles',
    'other',
  ];

  return (
    <div className="mb-6 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {categoryList.map((catKey) => {
          const isSelected = selectedCategory === catKey;
          const count = counts[catKey] || 0;

          if (catKey === 'all') {
            return (
              <button
                key="cat-all"
                id="cat-tab-all"
                onClick={() => onSelectCategory('all')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Documents</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }

          const catMeta = CATEGORIES[catKey];
          const Icon = CATEGORY_ICONS[catKey] || Folder;

          return (
            <button
              key={`cat-${catKey}`}
              id={`cat-tab-${catKey}`}
              onClick={() => onSelectCategory(catKey)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
              <span>{catMeta.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
