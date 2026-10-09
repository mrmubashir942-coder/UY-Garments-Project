import React from 'react';
import { UYGarmentsLogo } from '../../assets/logo';
import {
  LayoutDashboard,
  Factory,
  Layers,
  Boxes,
  Store,
  FileBarChart2,
  Users2,
  Truck,
  CreditCard,
  Receipt,
  UserCheck,
  Settings,
  X,
} from 'lucide-react';

export type NavModule =
  | 'dashboard'
  | 'factory-stock'
  | 'fabric-stock'
  | 'material-stock'
  | 'shop-stock'
  | 'production-reports'
  | 'clients-orders'
  | 'dispatch'
  | 'payments'
  | 'expenses'
  | 'employees'
  | 'settings';

interface SidebarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  isOpen: boolean;
  onClose: () => void;
  customLogoUrl?: string;
}

interface NavItem {
  id: NavModule;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'factory-stock', label: 'Factory Stock', icon: Factory },
  { id: 'fabric-stock', label: 'Fabric Stock', icon: Layers },
  { id: 'material-stock', label: 'Material Stock', icon: Boxes },
  { id: 'shop-stock', label: 'Shop Stock', icon: Store },
  { id: 'production-reports', label: 'Production Reports', icon: FileBarChart2 },
  { id: 'clients-orders', label: 'Clients & Orders', icon: Users2 },
  { id: 'dispatch', label: 'Dispatch', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'employees', label: 'Employees & Salaries', icon: UserCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isOpen,
  onClose,
  customLogoUrl,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs no-print"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-neutral-950 text-white z-40 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 no-print border-r border-neutral-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area with Official UY Garments Emerald & Gold Crest */}
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
          <UYGarmentsLogo size="md" showText={true} customUrl={customLogoUrl} />
          <button
            onClick={onClose}
            className="md:hidden text-neutral-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Management Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-white text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-neutral-950' : 'text-neutral-400 group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-neutral-900 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>UY Garments v2.4</span>
          <span className="text-neutral-500">All Systems Normal</span>
        </div>
      </aside>
    </>
  );
};
