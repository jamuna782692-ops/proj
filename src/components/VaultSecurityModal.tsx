import React, { useState } from 'react';
import { X, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { VaultSettings } from '../types';

interface VaultSecurityModalProps {
  settings: VaultSettings;
  onSaveSettings: (newSettings: VaultSettings) => void;
  onClose: () => void;
  onLockNow: () => void;
}

export const VaultSecurityModal: React.FC<VaultSecurityModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onLockNow,
}) => {
  const [isPinProtected, setIsPinProtected] = useState(settings.isPinProtected);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings.autoLockMinutes || 15);
  const [maskByDefault, setMaskByDefault] = useState(settings.maskSensitiveNumbersByDefault);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let pinHash = settings.pinHash;

    if (isPinProtected) {
      if (!settings.isPinProtected || pin.length > 0) {
        if (pin.length < 4) {
          setError('PIN must be at least 4 digits.');
          return;
        }
        if (pin !== confirmPin) {
          setError('PIN and Confirmation PIN do not match.');
          return;
        }
        pinHash = btoa(pin);
      }
    } else {
      pinHash = undefined;
    }

    const updated: VaultSettings = {
      isPinProtected,
      pinHash,
      autoLockMinutes,
      maskSensitiveNumbersByDefault: maskByDefault,
      lastUnlockedTime: Date.now(),
    };

    onSaveSettings(updated);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        id="vault-security-modal"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Vault Security & Privacy
              </h2>
              <p className="text-xs text-slate-500">Protect sensitive certificates & document numbers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Enable PIN Toggle */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Enable Passcode / PIN Lock
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Require PIN to view document attachments & sensitive files
              </span>
            </div>
            <input
              id="enable-pin-toggle"
              type="checkbox"
              checked={isPinProtected}
              onChange={(e) => setIsPinProtected(e.target.checked)}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          </div>

          {/* PIN Setup Input */}
          {isPinProtected && (
            <div className="space-y-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {settings.isPinProtected ? 'New PIN (Leave blank to keep existing)' : 'Set 4-Digit Passcode'}
                </label>
                <div className="relative">
                  <input
                    id="vault-pin-input"
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full px-3.5 py-2 text-sm font-mono tracking-widest bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {(pin.length > 0 || !settings.isPinProtected) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Passcode
                  </label>
                  <input
                    id="vault-confirm-pin-input"
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Re-enter passcode"
                    className="w-full px-3.5 py-2 text-sm font-mono tracking-widest bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auto-Lock Inactivity Period
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes (Default)</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>
          )}

          {/* Mask Sensitive ID numbers */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Mask ID Numbers by Default
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Shows "•••• 4892" to prevent shoulder surfing
              </span>
            </div>
            <input
              id="mask-by-default-toggle"
              type="checkbox"
              checked={maskByDefault}
              onChange={(e) => setMaskByDefault(e.target.checked)}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Security settings saved successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            {settings.isPinProtected && (
              <button
                type="button"
                id="lock-vault-now-btn"
                onClick={() => { onLockNow(); onClose(); }}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault Now</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-security-btn"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
