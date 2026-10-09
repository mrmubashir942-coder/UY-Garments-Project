import React, { useState, useEffect } from 'react';
import { auth, USERS } from '../../services/auth';
import { AppUser } from '../../types';
import { Menu, User, Shield, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeModuleName: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeModuleName }) => {
  const [currentUser, setCurrentUser] = useState<AppUser>(auth.getCurrentUser());
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    return auth.subscribe((u) => setCurrentUser(u));
  }, []);

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
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
        {/* User / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 text-xs font-medium transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-neutral-900 leading-tight">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
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
              <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-xl z-40 py-2 divide-y divide-neutral-100">
                <div className="px-4 py-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Current Active Account
                  </div>
                  <div className="font-medium text-sm text-neutral-900 mt-0.5">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3 text-neutral-700" />
                    <span>Role: {currentUser.role}</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Switch Active User / Role
                  </div>
                  {USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        auth.switchUser(user.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                        user.id === currentUser.id ? 'bg-neutral-100 font-semibold' : 'text-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="text-neutral-900">{user.name}</div>
                        <div className="text-[10px] text-neutral-500">{user.role}</div>
                      </div>
                      {user.id === currentUser.id && (
                        <Check className="w-4 h-4 text-neutral-900" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2 text-[10px] text-neutral-400 border-t border-neutral-100 flex items-center justify-between">
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
