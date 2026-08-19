import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Camera, 
  Plus, 
  Trash2, 
  Paperclip, 
  Check, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Clock, 
  RefreshCw,
  Eye,
  Shield,
  Award,
  ShieldCheck,
  HeartPulse,
  Car,
  Folder
} from 'lucide-react';
import { PersonalDocument, DocumentCategory, Profile, CustomField, DocumentAttachment } from '../types';
import { CATEGORIES } from '../data/categories';

interface DocumentFormModalProps {
  initialDocument?: PersonalDocument | null;
  profiles: Profile[];
  onClose: () => void;
  onSave: (doc: PersonalDocument) => void;
}

const CATEGORY_LIST: DocumentCategory[] = [
  'identification',
  'insurance',
  'certificates',
  'warranties',
  'medical',
  'financial',
  'vehicles',
  'other',
];

const REMINDER_PRESETS = [
  { days: 90, label: '90 days before' },
  { days: 60, label: '60 days before' },
  { days: 30, label: '30 days before' },
  { days: 14, label: '14 days before' },
  { days: 7, label: '7 days before' },
  { days: 1, label: '1 day before' },
];

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  initialDocument,
  profiles,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialDocument);

  // Form states
  const [title, setTitle] = useState(initialDocument?.title || '');
  const [category, setCategory] = useState<DocumentCategory>(initialDocument?.category || 'identification');
  const [documentNumber, setDocumentNumber] = useState(initialDocument?.documentNumber || '');
  const [holderName, setHolderName] = useState(initialDocument?.holderName || (profiles[0]?.name || ''));
  const [profileId, setProfileId] = useState<string>(initialDocument?.profileId || (profiles[0]?.id || ''));
  const [issuer, setIssuer] = useState(initialDocument?.issuer || '');
  const [issueDate, setIssueDate] = useState(initialDocument?.issueDate || '');
  const [expiryDate, setExpiryDate] = useState(initialDocument?.expiryDate || '');
  const [isLifetime, setIsLifetime] = useState(initialDocument?.isLifetime || false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number[]>(
    initialDocument?.reminderDaysBefore || [90, 30, 7]
  );
  const [notes, setNotes] = useState(initialDocument?.notes || '');
  const [renewalInstructions, setRenewalInstructions] = useState(initialDocument?.renewalInstructions || '');
  const [renewalUrl, setRenewalUrl] = useState(initialDocument?.renewalUrl || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialDocument?.tags || []);
  const [customFields, setCustomFields] = useState<CustomField[]>(
    initialDocument?.customFields || []
  );
  const [attachments, setAttachments] = useState<DocumentAttachment[]>(
    initialDocument?.attachments || []
  );

  // AI OCR & Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera capture states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Tag Addition
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Handle Custom Fields
  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: 'cf-' + Date.now(),
      label: '',
      value: '',
    };
    setCustomFields([...customFields, newField]);
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    setCustomFields(
      customFields.map((cf) => (cf.id === id ? { ...cf, [key]: val } : cf))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((cf) => cf.id !== id));
  };

  // Handle Reminder toggle
  const toggleReminderPreset = (days: number) => {
    if (reminderDaysBefore.includes(days)) {
      setReminderDaysBefore(reminderDaysBefore.filter((d) => d !== days));
    } else {
      setReminderDaysBefore([...reminderDaysBefore, days].sort((a, b) => b - a));
    }
  };

  // Handle File Upload & AI Auto-Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Data = reader.result as string;
      const newAtt: DocumentAttachment = {
        id: 'att-' + Date.now(),
        name: file.name,
        mimeType: file.type || 'image/jpeg',
        dataUrl: base64Data,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      setAttachments((prev) => [...prev, newAtt]);

      // Trigger AI Analysis
      await triggerAiAnalysis(base64Data, file.type, file.name);
    };

    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger AI Auto-Scan analysis via /api/documents/analyze
  const triggerAiAnalysis = async (imageBase64?: string, mimeType?: string, fileName?: string) => {
    setIsScanning(true);
    setScanMessage('AI is reading document text and detecting expiration dates...');
    setScanError(null);

    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || (attachments[0]?.dataUrl || ''),
          mimeType: mimeType || (attachments[0]?.mimeType || 'image/jpeg'),
          fileName: fileName || (attachments[0]?.name || 'Document'),
          documentText: notes,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.title && (!title || title === '')) setTitle(d.title);
        if (d.category && CATEGORY_LIST.includes(d.category)) setCategory(d.category);
        if (d.documentNumber && (!documentNumber || documentNumber === '')) setDocumentNumber(d.documentNumber);
        if (d.holderName && (!holderName || holderName === '')) setHolderName(d.holderName);
        if (d.issuer && (!issuer || issuer === '')) setIssuer(d.issuer);
        if (d.issueDate) setIssueDate(d.issueDate);
        if (d.expiryDate) {
          setExpiryDate(d.expiryDate);
          setIsLifetime(false);
        } else if (d.isLifetime) {
          setIsLifetime(true);
          setExpiryDate('');
        }
        if (d.renewalInstructions) setRenewalInstructions(d.renewalInstructions);
        if (d.tags && Array.isArray(d.tags)) {
          const combined = Array.from(new Set([...tags, ...d.tags]));
          setTags(combined);
        }
        if (d.customFields && Array.isArray(d.customFields)) {
          const formattedFields: CustomField[] = d.customFields.map((cf: any, i: number) => ({
            id: 'cf-ai-' + Date.now() + '-' + i,
            label: cf.label,
            value: cf.value,
          }));
          setCustomFields((prev) => [...prev, ...formattedFields]);
        }
        if (d.summary && !notes) {
          setNotes(d.summary);
        }
        setScanMessage('AI auto-filled all detected document fields!');
        setTimeout(() => setScanMessage(null), 4000);
      } else {
        throw new Error(json.error || 'Failed to auto-scan');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError('Could not auto-extract fields. Please fill manually.');
      setTimeout(() => setScanError(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  // Webcam Camera Capture
  const startCamera = async () => {
    setShowCamera(true);
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setScanError('Camera permission denied or camera unavailable.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const newAtt: DocumentAttachment = {
        id: 'att-cam-' + Date.now(),
        name: `camera_scan_${new Date().toISOString().slice(0, 10)}.jpg`,
        mimeType: 'image/jpeg',
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      setAttachments((prev) => [...prev, newAtt]);
      stopCamera();
      triggerAiAnalysis(dataUrl, 'image/jpeg', newAtt.name);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a document title.');
      return;
    }

    const docToSave: PersonalDocument = {
      id: initialDocument?.id || 'doc-' + Date.now(),
      title: title.trim(),
      category,
      documentNumber: documentNumber.trim() || undefined,
      holderName: holderName.trim() || 'Personal',
      profileId: profileId || undefined,
      issuer: issuer.trim(),
      issueDate: issueDate || undefined,
      expiryDate: isLifetime ? '' : (expiryDate || undefined),
      isLifetime,
      reminderDaysBefore: isLifetime ? [] : reminderDaysBefore,
      notes: notes.trim() || undefined,
      renewalInstructions: renewalInstructions.trim() || undefined,
      renewalUrl: renewalUrl.trim() || undefined,
      tags,
      customFields: customFields.filter((cf) => cf.label.trim() && cf.value.trim()),
      attachments,
      isMasked: initialDocument?.isMasked !== undefined ? initialDocument.isMasked : true,
      createdAt: initialDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(docToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        id="doc-form-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Document' : 'Add New Document'}
            </h2>
            <p className="text-xs text-slate-500">
              Track certificates, IDs, warranties, policies and expiration reminders.
            </p>
          </div>
          <button
            id="form-close-btn"
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Scanner Bar */}
        <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Smart Document Scan (AI Auto-Fill)</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                className="hidden"
              />

              <button
                type="button"
                id="upload-doc-file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-medium rounded-lg border border-indigo-200 shadow-2xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Scan</span>
              </button>

              <button
                type="button"
                id="camera-scan-btn"
                onClick={startCamera}
                disabled={isScanning}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-medium rounded-lg border border-indigo-200 shadow-2xs transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Use Camera</span>
              </button>
            </div>
          </div>

          {/* AI Progress / Notification */}
          {isScanning && (
            <div className="mt-2.5 p-2 bg-indigo-100 rounded-lg flex items-center gap-2 text-xs text-indigo-900 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>{scanMessage}</span>
            </div>
          )}

          {scanMessage && !isScanning && (
            <div className="mt-2.5 p-2 bg-emerald-100 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{scanMessage}</span>
            </div>
          )}

          {scanError && (
            <div className="mt-2.5 p-2 bg-rose-100 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{scanError}</span>
            </div>
          )}
        </div>

        {/* Live Camera Viewfinder */}
        {showCamera && (
          <div className="p-4 bg-slate-950 text-white flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border-2 border-dashed border-indigo-500 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-4 inset-y-4 border border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
                <span className="text-[11px] bg-black/60 px-2 py-1 rounded text-white/80">
                  Align document within frame
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                id="capture-photo-btn"
                onClick={capturePhoto}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture & Scan</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          
          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-doc-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. US Passport, GEICO Auto Insurance, MacBook Pro Warranty"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_LIST.map((catKey) => {
                const cat = CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    id={`form-cat-${catKey}`}
                    onClick={() => setCategory(catKey)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border text-left transition ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    <span className="truncate">{cat.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Holder & Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Document Holder Name
              </label>
              <input
                id="form-holder-name"
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="e.g. Alex Vance"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Household Member / Profile
              </label>
              <select
                id="form-profile-select"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.relation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ID Number & Issuer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Document / Policy / Serial ID #
              </label>
              <input
                id="form-doc-number"
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. P9482012, POL-77402, SN-C02XL89"
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Issuing Entity / Organization
              </label>
              <input
                id="form-issuer"
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. U.S. State Dept, GEICO, Apple Inc."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Dates & Expiration Settings */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Validity & Expiration Dates
              </span>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  id="form-is-lifetime"
                  type="checkbox"
                  checked={isLifetime}
                  onChange={(e) => setIsLifetime(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Permanent / Never Expires (e.g. Birth Cert, Diploma)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Issue Date (Optional)
                </label>
                <input
                  id="form-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Expiration Date {!isLifetime && <span className="text-rose-500">*</span>}
                </label>
                <input
                  id="form-expiry-date"
                  type="date"
                  disabled={isLifetime}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    isLifetime ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Reminder Alerts Schedule */}
            {!isLifetime && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Renewal Reminders (Notification triggers before expiry)
                </label>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_PRESETS.map((preset) => {
                    const isChecked = reminderDaysBefore.includes(preset.days);
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => toggleReminderPreset(preset.days)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Renewal Link & Guidance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Renewal Link / Portal URL
              </label>
              <input
                id="form-renewal-url"
                type="url"
                value={renewalUrl}
                onChange={(e) => setRenewalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Renewal / Claim Instructions
              </label>
              <input
                id="form-renewal-instructions"
                type="text"
                value={renewalInstructions}
                onChange={(e) => setRenewalInstructions(e.target.value)}
                placeholder="e.g. Submit form DS-82 with updated passport photo"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Custom Specifications (e.g. Deductible, Support Hotline, VIN)
              </label>
              <button
                type="button"
                id="add-custom-field-btn"
                onClick={handleAddCustomField}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-2">
                {customFields.map((cf) => (
                  <div key={cf.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Deductible)"
                      value={cf.label}
                      onChange={(e) => handleUpdateCustomField(cf.id, 'label', e.target.value)}
                      className="w-1/3 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. $500)"
                      value={cf.value}
                      onChange={(e) => handleUpdateCustomField(cf.id, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tags & Labels
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press Enter (e.g. Travel, Primary ID, Urgent)"
                className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Notes & Details
            </label>
            <textarea
              id="form-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Storage location, claim details, policy clauses..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Attached Files */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Attached Scans & Files ({attachments.length})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{att.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            id="form-submit-btn"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs active:scale-[0.98] transition cursor-pointer"
          >
            {isEditing ? 'Save Changes' : 'Save to Vault'}
          </button>
        </div>

      </div>
    </div>
  );
};
