import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import {
  Factory,
  Layers,
  Boxes,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Receipt,
  Truck,
  ArrowUpRight,
  TrendingUp,
  Database,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { NavModule } from '../common/Sidebar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatPKR } from '../../utils/currency';
import { UYGarmentsLogo } from '../../assets/logo';

interface DashboardProps {
  onNavigate: (module: NavModule) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState(() => ({
    factoryStock: db.getFactoryStock(),
    fabricStock: db.getFabricStock(),
    materialStock: db.getMaterialStock(),
    shopStock: db.getShopStock(),
    orders: db.getOrders(),
    payments: db.getPayments(),
    expenses: db.getExpenses(),
    settings: db.getSettings(),
    demoStatus: db.getDemoStatus(),
  }));

  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isReloadConfirmOpen, setIsReloadConfirmOpen] = useState(false);

  useEffect(() => {
    return db.subscribe(() => {
      setData({
        factoryStock: db.getFactoryStock(),
        fabricStock: db.getFabricStock(),
        materialStock: db.getMaterialStock(),
        shopStock: db.getShopStock(),
        orders: db.getOrders(),
        payments: db.getPayments(),
        expenses: db.getExpenses(),
        settings: db.getSettings(),
        demoStatus: db.getDemoStatus(),
      });
    });
  }, []);

  const currency = data.settings.currencySymbol || '$';

  // 1. Factory Stock Pieces
  const totalFactoryPieces = data.factoryStock.reduce((acc, item) => acc + item.quantity, 0);

  // 2. Fabric Stock Remaining Kg
  const totalFabricKg = data.fabricStock.reduce((acc, item) => acc + item.remainingKg, 0);

  // 3. Material Stock Total items
  const totalMaterialItems = data.materialStock.reduce((acc, item) => acc + item.remainingStock, 0);

  // 4. Shop Stock Pieces
  const totalShopPieces = data.shopStock.reduce((acc, item) => acc + item.quantity, 0);

  // 5. Active Orders (not completed or cancelled)
  const activeOrders = data.orders.filter(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
  );

  // 6. Orders in Production ('In Work' or 'New')
  const ordersInProduction = data.orders.filter(
    (o) => o.status === 'In Work' || o.status === 'New'
  );

  // 7. Orders Ready for Dispatch
  const ordersReadyForDispatch = data.orders.filter(
    (o) => o.status === 'Ready for Dispatch'
  );

  // 8. Outstanding Customer Payments (sum of remaining balances)
  const outstandingPayments = data.orders.reduce((acc, o) => acc + o.remainingBalance, 0);

  // 9. Total Payments Received
  const totalPaymentsReceived = data.payments.reduce((acc, p) => acc + p.amount, 0);

  // 10. Today's Expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysExpenses = data.expenses
    .filter((e) => e.date === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  // Low stock alerts
  const lowFactoryStock = data.factoryStock.filter((i) => i.quantity < 100);
  const lowFabricStock = data.fabricStock.filter((f) => f.remainingKg < 100);
  const lowMaterialStock = data.materialStock.filter((m) => m.remainingStock < 100);

  // Recent orders
  const recentOrders = [...data.orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Upcoming deliveries
  const upcomingDeliveries = [...activeOrders]
    .filter((o) => o.quantityRemainingToDispatch > 0)
    .sort((a, b) => new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UYGarmentsLogo size="md" showText={false} customUrl={data.settings.customLogoUrl} />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">
              UY Garments Operations Command
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Real-time manufacturing, inventory valuation, active order dispatch, and financial overview.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('fabric-stock')}
          >
            Fabric & Cutting
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('production-reports')}
          >
            Production Inspection
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('clients-orders')}
          >
            + New Order
          </Button>
        </div>
      </div>

      {/* Demo Data vs Real Business Data Mode Indicator */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 rounded-lg text-neutral-900 shrink-0">
            {data.demoStatus.hasDemoData ? (
              <Database className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-950 uppercase tracking-wider text-[11px]">
                {data.demoStatus.hasDemoData ? 'Demo Dataset Loaded' : '100% Live Factory Records'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  data.demoStatus.hasDemoData
                    ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                    : 'bg-neutral-900 text-white'
                }`}
              >
                {data.demoStatus.hasDemoData ? `${data.demoStatus.demoCount} Sample Records` : 'Live Operations'}
              </span>
            </div>
            <p className="text-neutral-500 mt-0.5 text-[11px]">
              {data.demoStatus.hasDemoData
                ? `Dashboard figures include sample garment articles, cutting batches, and test orders. Factory staff can purge demo data to operate on a 100% clean slate.`
                : `All dashboard cards and calculations reflect strictly verified live records entered by your factory staff.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {data.demoStatus.hasDemoData ? (
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsPurgeConfirmOpen(true)}
            >
              Clear Demo Data
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={Database}
              onClick={() => setIsReloadConfirmOpen(true)}
            >
              Load Sample Demo Data
            </Button>
          )}
        </div>
      </div>

      {/* 10 Required Summary Cards */}
      <div>
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
          Manufacturing & Inventory Figures
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Factory Stock"
            value={`${totalFactoryPieces.toLocaleString()} pcs`}
            subtext={`${data.factoryStock.length} article variants in warehouse`}
            icon={Factory}
          />
          <StatCard
            label="Fabric Stock"
            value={`${totalFabricKg.toLocaleString()} kg`}
            subtext={`${data.fabricStock.length} active yarn batches in warehouse`}
            icon={Layers}
          />
          <StatCard
            label="Material Stock"
            value={`${totalMaterialItems.toLocaleString()} units`}
            subtext={`${data.materialStock.length} accessories & trim lines`}
            icon={Boxes}
          />
          <StatCard
            label="Shop Stock"
            value={`${totalShopPieces.toLocaleString()} pcs`}
            subtext={`${data.shopStock.length} display & floor variants`}
            icon={Store}
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
          Orders & Financial Status
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Active Orders"
            value={activeOrders.length}
            subtext="Under manufacturing & fulfillment"
            icon={Clock}
          />
          <StatCard
            label="In Production"
            value={ordersInProduction.length}
            subtext="Floor cutting & stitching lines"
            icon={TrendingUp}
          />
          <StatCard
            label="Ready for Dispatch"
            value={ordersReadyForDispatch.length}
            subtext="Inspected & packed in carton bay"
            icon={Truck}
          />
          <StatCard
            label="Outstanding Receivables"
            value={formatPKR(outstandingPayments)}
            subtext="Unpaid & partial order balances"
            icon={AlertTriangle}
          />
          <StatCard
            label="Payments Received"
            value={formatPKR(totalPaymentsReceived)}
            subtext={`${data.payments.length} ledger receipts recorded`}
            icon={CreditCard}
          />
          <StatCard
            label="Today's Expenses"
            value={formatPKR(todaysExpenses)}
            subtext="Daily factory disbursements"
            icon={Receipt}
          />
        </div>
      </div>

      {/* Grid: Recent Orders & Upcoming Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">Recent Orders</h3>
              <p className="text-xs text-neutral-500">Latest wholesale client bookings</p>
            </div>
            <button
              onClick={() => onNavigate('clients-orders')}
              className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-neutral-100">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No orders recorded yet.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-neutral-900">{order.orderNumber}</div>
                    <div className="text-neutral-500 mt-0.5">{order.customerName}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {order.quantityOrdered.toLocaleString()} pcs · Date: {order.orderDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-neutral-900">
                      {formatPKR(order.totalAmount)}
                    </div>
                    <div className="text-[11px] font-medium text-neutral-600 mt-0.5">
                      {order.status}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Bal: {formatPKR(order.remainingBalance)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">Upcoming Dispatches & Delivery Deadlines</h3>
              <p className="text-xs text-neutral-500">Target delivery schedule</p>
            </div>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Dispatch Bay <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-neutral-100">
            {upcomingDeliveries.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No pending deliveries scheduled.
              </div>
            ) : (
              upcomingDeliveries.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-neutral-900">{order.orderNumber}</div>
                    <div className="text-neutral-500 mt-0.5">{order.customerName}</div>
                    <div className="text-[11px] text-neutral-700 font-medium mt-0.5">
                      Due: {order.expectedDeliveryDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-neutral-900">
                      {order.quantityRemainingToDispatch.toLocaleString()} pcs left
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Dispatched: {order.quantityDispatched.toLocaleString()} / {order.quantityOrdered.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-semibold text-neutral-800 uppercase mt-0.5">
                      Status: {order.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low-Stock Alerts Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-neutral-900" />
            <h3 className="font-bold text-neutral-900 text-sm">Inventory Reorder & Low-Stock Alerts</h3>
          </div>
          <span className="text-xs text-neutral-500">Threshold: &lt; 100 units</span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Factory low */}
          <div>
            <div className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider mb-2">
              Factory Garments ({lowFactoryStock.length})
            </div>
            {lowFactoryStock.length === 0 ? (
              <p className="text-neutral-400 italic">No low-stock garments in factory.</p>
            ) : (
              <ul className="space-y-2">
                {lowFactoryStock.slice(0, 4).map((item) => (
                  <li key={item.id} className="p-2 border border-neutral-200 rounded-md">
                    <div className="font-semibold text-neutral-900">{item.productName}</div>
                    <div className="text-neutral-500 text-[11px] flex justify-between mt-0.5">
                      <span>{item.colour} ({item.size})</span>
                      <span className="font-mono font-bold text-neutral-900">{item.quantity} pcs</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fabric low */}
          <div>
            <div className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider mb-2">
              Fabric Lots ({lowFabricStock.length})
            </div>
            {lowFabricStock.length === 0 ? (
              <p className="text-neutral-400 italic">Adequate fabric lot weight available.</p>
            ) : (
              <ul className="space-y-2">
                {lowFabricStock.slice(0, 4).map((f) => (
                  <li key={f.id} className="p-2 border border-neutral-200 rounded-md">
                    <div className="font-semibold text-neutral-900 truncate">{f.fabricName}</div>
                    <div className="text-neutral-500 text-[11px] flex justify-between mt-0.5">
                      <span>{f.colour}</span>
                      <span className="font-mono font-bold text-neutral-900">{f.remainingKg} kg</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Material low */}
          <div>
            <div className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider mb-2">
              Materials & Trims ({lowMaterialStock.length})
            </div>
            {lowMaterialStock.length === 0 ? (
              <p className="text-neutral-400 italic">Adequate material supplies in stock.</p>
            ) : (
              <ul className="space-y-2">
                {lowMaterialStock.slice(0, 4).map((m) => (
                  <li key={m.id} className="p-2 border border-neutral-200 rounded-md">
                    <div className="font-semibold text-neutral-900 truncate">{m.name}</div>
                    <div className="text-neutral-500 text-[11px] flex justify-between mt-0.5">
                      <span className="capitalize">{m.category}</span>
                      <span className="font-mono font-bold text-neutral-900">{m.remainingStock} {m.unit}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isPurgeConfirmOpen}
        onClose={() => setIsPurgeConfirmOpen(false)}
        onConfirm={() => {
          db.clearDemoData();
          setIsPurgeConfirmOpen(false);
        }}
        title="Clear Sample Demo Data"
        message="This will remove all sample garment stock, cutting lots, demo orders, and dummy invoices while preserving your company settings and custom collections. Are you sure you want to start with a clean slate?"
        confirmText="Yes, Purge Sample Data"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={isReloadConfirmOpen}
        onClose={() => setIsReloadConfirmOpen(false)}
        onConfirm={() => {
          db.reloadDemoData();
          setIsReloadConfirmOpen(false);
        }}
        title="Load Sample Demo Data"
        message="This will reload the initial demonstration records for factory stock, fabric rolls, cutting batches, client orders, and expense vouchers. Proceed?"
        confirmText="Load Sample Records"
        isDestructive={false}
      />
    </div>
  );
};
