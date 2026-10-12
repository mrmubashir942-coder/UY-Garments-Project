import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { auth } from './services/auth';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar, NavModule } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { Dashboard } from './components/modules/Dashboard';
import { FactoryStock } from './components/modules/FactoryStock';
import { FabricStock } from './components/modules/FabricStock';
import { MaterialStock } from './components/modules/MaterialStock';
import { ShopStock } from './components/modules/ShopStock';
import { ProductionReports } from './components/modules/ProductionReports';
import { ClientsOrders } from './components/modules/ClientsOrders';
import { DispatchModule } from './components/modules/DispatchModule';
import { PaymentsModule } from './components/modules/PaymentsModule';
import { ExpensesModule } from './components/modules/ExpensesModule';
import { EmployeesModule } from './components/modules/EmployeesModule';
import { SettingsModule } from './components/modules/SettingsModule';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    auth.isAuthenticated()
  );
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(
    db.getSettings().customLogoUrl
  );

  useEffect(() => {
    const unsubDb = db.subscribe(() => {
      setCustomLogoUrl(db.getSettings().customLogoUrl);
    });
    const unsubAuth = auth.subscribe((authed) => {
      setIsAuthenticated(authed);
    });

    return () => {
      unsubDb();
      unsubAuth();
    };
  }, []);

  // Protected Routes: Unauthenticated visitors cannot access dashboard or business records
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const moduleTitles: Record<NavModule, string> = {
    dashboard: 'Dashboard',
    'factory-stock': 'Factory Stock',
    'fabric-stock': 'Fabric Stock & Cutting',
    'material-stock': 'Material Stock & Trims',
    'shop-stock': 'Shop Stock & Transfers',
    'production-reports': 'Production Reports',
    'clients-orders': 'Clients & Wholesale Orders',
    dispatch: 'Dispatch & Order Tracking',
    payments: 'Payments & Accounts',
    expenses: 'Factory Expenses',
    employees: 'Employees & Salaries',
    settings: 'Settings & Company Profile',
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={(mod) => setActiveModule(mod)} />;
      case 'factory-stock':
        return <FactoryStock />;
      case 'fabric-stock':
        return <FabricStock />;
      case 'material-stock':
        return <MaterialStock />;
      case 'shop-stock':
        return <ShopStock />;
      case 'production-reports':
        return <ProductionReports />;
      case 'clients-orders':
        return <ClientsOrders />;
      case 'dispatch':
        return <DispatchModule />;
      case 'payments':
        return <PaymentsModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'employees':
        return <EmployeesModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <Dashboard onNavigate={(mod) => setActiveModule(mod)} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex">
      {/* Pitch-Black Left Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={(mod) => setActiveModule(mod)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        customLogoUrl={customLogoUrl}
        onLogout={() => auth.logout()}
      />

      {/* Main Workspace */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 min-h-screen print:ml-0 print:min-h-0">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeModuleName={moduleTitles[activeModule]}
          onNavigateToSettings={() => setActiveModule('settings')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}
