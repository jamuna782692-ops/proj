import React, { useState } from 'react';
import { Lock, AlertCircle, Unlock } from 'lucide-react';
import { VaultSettings } from '../types';

interface VaultUnlockModalProps {
  settings: VaultSettings;
  onUnlockSuccess: () => void;
  onCancel: () => void;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  settings,
  onUnlockSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputHash = btoa(pin);
    if (inputHash === settings.pinHash) {
      onUnlockSuccess();
    } else {
      setError('Incorrect passcode. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        id="vault-unlock-modal"
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-2xs">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          Vault is Locked
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Enter your 4-digit passcode to access certificates, insurance policies, and sensitive files.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              id="unlock-pin-input"
              type="password"
              autoFocus
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              className="w-48 mx-auto text-center px-4 py-2.5 text-2xl font-mono tracking-widest bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-2 bg-rose-50 rounded-xl text-xs text-rose-700 flex items-center justify-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-unlock-btn"
              disabled={pin.length < 4}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
