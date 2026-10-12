import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { auth, OWNER_USER } from '../../services/auth';
import { CompanySettings } from '../../types';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UYGarmentsLogo } from '../../assets/logo';
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  RotateCcw,
  Shield,
  FileCode,
  Image,
  CheckCircle,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>(db.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Owner Password Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    return db.subscribe(() => {
      setSettings(db.getSettings());
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportDatabase = () => {
    const dataStr = db.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uy-garments-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        try {
          const content = uploadEvent.target?.result as string;
          const success = db.importData(content);
          if (success) {
            setImportStatus('Database successfully restored from JSON backup!');
          } else {
            setImportStatus('Failed to import database file. Invalid format.');
          }
        } catch (err) {
          setImportStatus('Error reading database file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const logoData = uploadEvent.target?.result as string;
        setSettings({ ...settings, customLogoUrl: logoData });
        db.updateSettings({ customLogoUrl: logoData });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    db.resetToDefaults();
    setIsResetConfirmOpen(false);
    alert('Database successfully restored to original factory baseline state!');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword.trim()) {
      setPasswordStatus({
        type: 'error',
        message: 'Please enter your current master password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: 'error',
        message: 'New password must contain at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'New password and confirmation do not match.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await auth.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordStatus({
          type: 'success',
          message: 'Master password successfully updated! Next login will require the new password.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({
          type: 'error',
          message: res.error || 'Failed to update password. Verify current password.',
        });
      }
    } catch {
      setPasswordStatus({
        type: 'error',
        message: 'An unexpected error occurred while updating password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            System & Company Configuration
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Branding, document numbering prefixes, currency symbols, and database maintenance.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-white" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company & Bank Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5 text-xs">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-900">Company Identity & Letterhead</h3>
              <p className="text-neutral-500 text-[11px]">Appears on all official tax invoices, dispatches, and reports</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={settings.brandTagline}
                  onChange={(e) => setSettings({ ...settings, brandTagline: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Website</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Factory Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Tax / NTN Registration Number</label>
                <input
                  type="text"
                  value={settings.taxRegistrationNumber || ''}
                  onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                  placeholder="STRN-882901-7"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="font-bold text-sm text-neutral-900 mb-1">Document Numbering Prefixes & Currency</h3>
              <p className="text-neutral-500 text-[11px] mb-3">Custom code prefixes for automatic serial generators</p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Order Prefix</label>
                  <input
                    type="text"
                    value={settings.orderPrefix}
                    onChange={(e) => setSettings({ ...settings, orderPrefix: e.target.value })}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Expense Prefix</label>
                  <input
                    type="text"
                    value={settings.expensePrefix}
                    onChange={(e) => setSettings({ ...settings, expensePrefix: e.target.value })}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Dispatch Prefix</label>
                  <input
                    type="text"
                    value={settings.dispatchPrefix}
                    onChange={(e) => setSettings({ ...settings, dispatchPrefix: e.target.value })}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="font-bold text-sm text-neutral-900 mb-1">Banking & Remittance Information</h3>
              <p className="text-neutral-500 text-[11px] mb-3">Printed on customer tax invoices for direct wire settlement</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankDetails.bankName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Account Title</label>
                  <input
                    type="text"
                    value={settings.bankDetails.accountTitle}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankDetails: { ...settings.bankDetails, accountTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={settings.bankDetails.accountNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankDetails: { ...settings.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">IBAN Number</label>
                  <input
                    type="text"
                    value={settings.bankDetails.iban}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankDetails: { ...settings.bankDetails, iban: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200">
              <Button variant="primary" size="md" icon={Save} type="submit">
                Save System Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Brand Asset & Database Tools */}
        <div className="space-y-6">
          {/* Brand Logo Asset Showcase */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-neutral-900">Official Brand Asset</h3>
            <p className="text-neutral-500 text-[11px]">
              UY Garments official emerald green & metallic gold artwork. Retains brand identity while UI remains sleek monochrome.
            </p>

            <div className="p-6 bg-neutral-950 rounded-xl flex items-center justify-center">
              <UYGarmentsLogo size="lg" showText={true} customUrl={settings.customLogoUrl} />
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-neutral-700">Upload Alternative Logo File</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomLogoUpload}
                className="w-full text-xs text-neutral-600 cursor-pointer"
              />
              {settings.customLogoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setSettings({ ...settings, customLogoUrl: undefined });
                    db.updateSettings({ customLogoUrl: undefined });
                  }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
                >
                  Reset to Official Emerald & Gold UY Crest
                </button>
              )}
            </div>
          </div>

          {/* Owner Account & Security */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Owner Account & Security</h3>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  Single-owner master credentials & password management.
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[10px] font-bold">
                UY
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5 text-neutral-700">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Authorised Owner:</span>
                <span className="font-semibold text-neutral-950">{OWNER_USER.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Username:</span>
                <span className="font-mono text-neutral-950 font-semibold">{OWNER_USER.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Account Role:</span>
                <span className="font-mono text-neutral-900 bg-neutral-200/70 px-1.5 py-0.5 rounded text-[10px]">
                  {OWNER_USER.role} (Master Access)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Access Mode:</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Single Authorised Account
                </span>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neutral-800" />
                <span>Change Master Password</span>
              </div>

              {passwordStatus && (
                <div
                  className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}
                >
                  {passwordStatus.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] leading-snug">{passwordStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Lock}
                disabled={isChangingPassword}
                className="w-full justify-center bg-neutral-950 text-white hover:bg-neutral-900 mt-1"
              >
                {isChangingPassword ? 'Updating Master Password...' : 'Update Master Password'}
              </Button>
            </form>
          </div>

          {/* Database Backup & Maintenance */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-neutral-900">Database Tools & Persistence</h3>
            <p className="text-neutral-500 text-[11px]">
              Local persistent storage engine with export, import, and factory reset features.
            </p>

            {importStatus && (
              <div className="p-3 bg-neutral-100 rounded-lg text-neutral-900 font-medium">
                {importStatus}
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExportDatabase}
                className="w-full justify-start"
              >
                Export Database Backup (.JSON)
              </Button>

              <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50/50 space-y-1.5">
                <span className="font-semibold text-neutral-700 block">Restore Database from File</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportDatabase}
                  className="text-xs text-neutral-600 cursor-pointer"
                />
              </div>

              <Button
                variant="danger"
                size="sm"
                icon={RotateCcw}
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full justify-start"
              >
                Reset Database to Factory Defaults
              </Button>
            </div>
          </div>

          {/* About Application */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-neutral-900">About Application</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 text-neutral-600 border-b border-neutral-100">
                <span>Application</span>
                <span className="font-semibold text-neutral-900">UY Garments ERP</span>
              </div>
              <div className="flex justify-between items-center py-1 text-neutral-600 border-b border-neutral-100">
                <span>Release Version</span>
                <span className="font-mono text-neutral-700">v2.4.0 Production</span>
              </div>
              <div className="flex justify-between items-center py-1 text-neutral-600">
                <span>Software Developer</span>
                <span className="font-medium text-neutral-900">Developed by Muhammad Mubashir</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetToDefault}
        title="Reset to Factory Defaults"
        message="This will reload the initial demo data with garments stock, cutting lots, orders, and payment records. Proceed?"
        confirmText="Reset Entire Database"
        isDestructive={true}
      />
    </div>
  );
};
