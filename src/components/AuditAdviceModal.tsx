import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Lightbulb, 
  Plus, 
  RefreshCw, 
  ShieldCheck
} from 'lucide-react';
import { PersonalDocument, AuditRecommendation } from '../types';

interface AuditAdviceModalProps {
  documents: PersonalDocument[];
  onClose: () => void;
  onQuickAddMissing: (title: string, category: string) => void;
}

export const AuditAdviceModal: React.FC<AuditAdviceModalProps> = ({
  documents,
  onClose,
  onQuickAddMissing,
}) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AuditRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents/audit-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
      } else {
        throw new Error('Failed to generate audit insights');
      }
    } catch (err: any) {
      console.error('Audit error:', err);
      setError('Could not run AI audit analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        id="audit-advice-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI Vault Health & Expiration Auditor
              </h2>
              <p className="text-xs text-slate-500">
                Automated risk audit, coverage gaps & renewal readiness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchAudit}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Audit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-audit-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Auditing {documents.length} Personal Documents...
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Evaluating passport validity rules, insurance renewal dates, and essential document checklists.
              </p>
            </div>
          ) : error || !insights ? (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs">
              {error || 'Unable to load audit.'}
            </div>
          ) : (
            <>
              {/* Urgency Score */}
              <div className="p-4 rounded-xl border flex items-center justify-between bg-slate-50 border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Overall Vault Expiration Risk
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-slate-900">
                      {insights.urgencyScore} Urgency
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        insights.urgencyScore === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : insights.urgencyScore === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {insights.urgencyScore === 'High' ? 'Action Overdue' : 'Manageable'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  {insights.urgencyScore === 'High' ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                  ) : insights.urgencyScore === 'Moderate' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Immediate Warnings */}
              {insights.urgentWarnings && insights.urgentWarnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Immediate Attention Required ({insights.urgentWarnings.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {insights.urgentWarnings.map((warn, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Missing Documents */}
              {insights.recommendedMissingDocs && insights.recommendedMissingDocs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recommended Essential Documents</span>
                  </h4>
                  <div className="space-y-2">
                    {insights.recommendedMissingDocs.map((docItem, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {docItem.title}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-slate-200 text-slate-700 rounded-md">
                              {docItem.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {docItem.reason}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onQuickAddMissing(docItem.title, docItem.category);
                            onClose();
                          }}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                          title="Create this document"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Organization Advice */}
              {insights.generalAdvice && insights.generalAdvice.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Security & Organization Best Practices</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {insights.generalAdvice.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xs hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
