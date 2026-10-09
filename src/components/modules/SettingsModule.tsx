import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
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
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>(db.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
