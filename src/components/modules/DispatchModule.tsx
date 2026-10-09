import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Order, DispatchRecord } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  Truck,
  Plus,
  Search,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const DispatchModule: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);

  const [activeTab, setActiveTab] = useState<'orders-dispatch' | 'dispatch-records'>('orders-dispatch');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Form
  const [dispatchForm, setDispatchForm] = useState({
    dispatchDate: new Date().toISOString().split('T')[0],
    deliveryReference: '',
    quantityDispatched: 0,
    carrierOrDriver: '',
    receivedBy: '',
    notes: '',
  });

  const loadData = () => {
    setOrders(db.getOrders());
    setDispatches(db.getDispatches());
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const totalOrderedPieces = orders.reduce((sum, o) => sum + o.quantityOrdered, 0);
  const totalDispatchedPieces = orders.reduce((sum, o) => sum + o.quantityDispatched, 0);
  const totalRemainingToDispatch = orders.reduce((sum, o) => sum + o.quantityRemainingToDispatch, 0);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDispatches = dispatches.filter(
    (d) =>
      d.dispatchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDispatch = (order: Order) => {
    setActiveOrder(order);
    setDispatchForm({
      dispatchDate: new Date().toISOString().split('T')[0],
      deliveryReference: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      quantityDispatched: order.quantityRemainingToDispatch > 0 ? order.quantityRemainingToDispatch : 0,
      carrierOrDriver: 'TCS Cargo Express / Driver Asghar',
      receivedBy: 'Customer Gate Receiving',
      notes: 'Shrink-wrapped master cartons with intact security seals.',
    });
    setDispatchError(null);
    setIsDispatchModalOpen(true);
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setDispatchError(null);

    if (dispatchForm.quantityDispatched <= 0) {
      setDispatchError('Quantity dispatched must be greater than zero.');
      return;
    }

    if (dispatchForm.quantityDispatched > activeOrder.quantityRemainingToDispatch) {
      setDispatchError(
        `Cannot dispatch ${dispatchForm.quantityDispatched} pieces. Remaining undelivered quantity is ${activeOrder.quantityRemainingToDispatch} pieces.`
      );
      return;
    }

    try {
      const inv = db.getInvoiceByOrderId(activeOrder.id);
      db.addDispatch({
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        customerName: activeOrder.customerName,
        dispatchDate: dispatchForm.dispatchDate,
        deliveryReference: dispatchForm.deliveryReference,
        relatedInvoiceNumber: inv?.invoiceNumber,
        quantityDispatched: Number(dispatchForm.quantityDispatched),
        carrierOrDriver: dispatchForm.carrierOrDriver,
        receivedBy: dispatchForm.receivedBy,
        notes: dispatchForm.notes,
      });

      setIsDispatchModalOpen(false);
      setActiveOrder(null);
    } catch (err: any) {
      setDispatchError(err.message || 'Error processing dispatch.');
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    db.updateOrder(orderId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Dispatch Bay & Order Fulfillment Tracking
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Log partial consignments, track undelivered quantities, and manage delivery challans.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Ordered Volume
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalOrderedPieces.toLocaleString()} <span className="text-xs font-normal text-neutral-500">pieces</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Successfully Dispatched
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalDispatchedPieces.toLocaleString()} <span className="text-xs font-normal text-neutral-500">pieces</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Pending Dispatch Balance
          </div>
          <div className="text-2xl font-black text-neutral-950 mt-1 font-mono">
            {totalRemainingToDispatch.toLocaleString()} <span className="text-xs font-normal text-neutral-500">pieces</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('orders-dispatch')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'orders-dispatch'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Order Dispatch Queue ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('dispatch-records')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'dispatch-records'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Dispatch Challans Issued ({dispatches.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search order or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Orders Dispatch Status Table */}
      {activeTab === 'orders-dispatch' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-center">Lifecycle Status</th>
                  <th className="py-3 px-4 text-right">Ordered Qty</th>
                  <th className="py-3 px-4 text-right">Produced Qty</th>
                  <th className="py-3 px-4 text-right">Dispatched Qty</th>
                  <th className="py-3 px-4 text-right">Remaining to Dispatch</th>
                  <th className="py-3 px-4 text-center">Fulfillment Progress</th>
                  <th className="py-3 px-4 text-center">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      No orders currently in queue.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const percentage = o.quantityOrdered > 0
                      ? Math.min(100, Math.round((o.quantityDispatched / o.quantityOrdered) * 100))
                      : 0;

                    return (
                      <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neutral-950">
                          {o.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{o.customerName}</div>
                          <div className="text-[10px] text-neutral-400">Target Delivery: {o.expectedDeliveryDate}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as Order['status'])}
                            className="px-2 py-1 border border-neutral-300 rounded text-[11px] font-semibold bg-white cursor-pointer"
                          >
                            <option value="New">New</option>
                            <option value="In Work">In Work</option>
                            <option value="Pending">Pending</option>
                            <option value="Ready for Dispatch">Ready for Dispatch</option>
                            <option value="Partially Dispatched">Partially Dispatched</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                          {o.quantityOrdered.toLocaleString()} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-neutral-700">
                          {o.quantityProduced.toLocaleString()} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                          {o.quantityDispatched.toLocaleString()} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-neutral-950">
                          <span className={o.quantityRemainingToDispatch > 0 ? 'text-neutral-950' : 'text-neutral-400'}>
                            {o.quantityRemainingToDispatch.toLocaleString()} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="w-24 mx-auto bg-neutral-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-neutral-950 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-neutral-600 mt-0.5">
                            {percentage}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {o.quantityRemainingToDispatch > 0 ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenDispatch(o)}
                            >
                              Dispatch Lot
                            </Button>
                          ) : (
                            <span className="text-[11px] font-bold text-neutral-600 uppercase">
                              Fully Dispatched
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Dispatch Records Table */}
      {activeTab === 'dispatch-records' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Dispatch #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Quantity Dispatched</th>
                  <th className="py-3 px-4">Delivery / Bilty Challan #</th>
                  <th className="py-3 px-4">Carrier / Vehicle</th>
                  <th className="py-3 px-4">Received By</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      No dispatch challans found.
                    </td>
                  </tr>
                ) : (
                  filteredDispatches.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{d.dispatchNumber}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{d.dispatchDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">{d.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-950">{d.customerName}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-neutral-950">
                        {d.quantityDispatched.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-800 font-medium">{d.deliveryReference}</td>
                      <td className="py-3 px-4 text-neutral-600">{d.carrierOrDriver || '—'}</td>
                      <td className="py-3 px-4 text-neutral-600">{d.receivedBy || '—'}</td>
                      <td className="py-3 px-4 font-mono text-neutral-500">{d.relatedInvoiceNumber || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Dispatch Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Execute Order Dispatch"
        subtitle={`Release consignment for ${activeOrder?.orderNumber} (${activeOrder?.customerName})`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDispatch} className="space-y-4 text-xs">
          {dispatchError && (
            <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-lg text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-neutral-500">Total Ordered:</span>
              <div className="font-mono font-bold text-neutral-900">{activeOrder?.quantityOrdered} pcs</div>
            </div>
            <div>
              <span className="text-neutral-500">Remaining to Deliver:</span>
              <div className="font-mono font-black text-neutral-950 text-base">
                {activeOrder?.quantityRemainingToDispatch} pcs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Quantity for this Consignment *
              </label>
              <input
                type="number"
                min="1"
                max={activeOrder?.quantityRemainingToDispatch}
                value={dispatchForm.quantityDispatched}
                onChange={(e) => setDispatchForm({ ...dispatchForm, quantityDispatched: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
                required
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Supports partial dispatch.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Dispatch Date</label>
              <input
                type="date"
                value={dispatchForm.dispatchDate}
                onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Delivery Challan / Bilty / LR # *
              </label>
              <input
                type="text"
                value={dispatchForm.deliveryReference}
                onChange={(e) => setDispatchForm({ ...dispatchForm, deliveryReference: e.target.value })}
                placeholder="e.g. TCS-998210"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Carrier / Transport / Driver
              </label>
              <input
                type="text"
                value={dispatchForm.carrierOrDriver}
                onChange={(e) => setDispatchForm({ ...dispatchForm, carrierOrDriver: e.target.value })}
                placeholder="Driver Name / Vehicle No"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Customer Receiver Contact</label>
            <input
              type="text"
              value={dispatchForm.receivedBy}
              onChange={(e) => setDispatchForm({ ...dispatchForm, receivedBy: e.target.value })}
              placeholder="Warehouse in-charge name"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Carton & Gate Pass Notes</label>
            <textarea
              rows={2}
              value={dispatchForm.notes}
              onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
              placeholder="Box quantities, packing slip details"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Dispatch & Update Balances
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
