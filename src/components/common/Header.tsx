import React, { useState } from 'react';
import { auth, OWNER_USER } from '../../services/auth';
import { UYGarmentsLogo } from '../../assets/logo';
import { Menu, Shield, ChevronDown, LogOut, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeModuleName: string;
  onNavigateToSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeModuleName,
  onNavigateToSettings,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const currentUser = OWNER_USER;

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    setShowUserDropdown(false);
    auth.logout();
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="md:hidden">
          <UYGarmentsLogo size="sm" showText={false} />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 capitalize">
            {activeModuleName}
          </h1>
          <p className="text-xs text-neutral-500 hidden sm:block">
            UY Garments Management System · {todayStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Single Authorised Owner Profile Display */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-neutral-950 bg-white text-neutral-800 text-xs font-medium transition-colors cursor-pointer"
            aria-label="Owner profile options"
          >
            <div className="w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[10px] font-bold">
              UY
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-neutral-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-xl z-40 py-2 divide-y divide-neutral-100">
                {/* Current Active Account Info */}
                <div className="px-4 py-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Current Active Account
                  </div>
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs font-bold">
                      UY
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-950 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-xs text-neutral-600 font-semibold uppercase tracking-wider mt-0.5">
                        {currentUser.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 mt-2.5 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Single-Owner Session Active</span>
                  </div>
                </div>

                {/* Quick Owner Navigation */}
                <div className="py-1">
                  {onNavigateToSettings && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigateToSettings();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Security & System Settings</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Sign Out of Workspace</span>
                  </button>
                </div>

                {/* Footer Notice */}
                <div className="px-4 py-2.5 text-[10px] text-neutral-400 flex items-center justify-between">
                  <span>UY Garments ERP</span>
                  <span>Developed by Muhammad Mubashir</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
