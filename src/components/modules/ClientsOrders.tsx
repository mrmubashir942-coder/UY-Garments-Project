import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Customer, Order, OrderItem, Collection } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Users2,
  Plus,
  Search,
  FileText,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { InvoiceView } from '../invoice/InvoiceView';

export const ClientsOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currency, setCurrency] = useState('$');

  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

  // Form: Customer
  const [customerForm, setCustomerForm] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    accountRef: '',
    notes: '',
  });

  // Form: Order
  const [orderForm, setOrderForm] = useState<{
    customerId: string;
    customerName: string;
    customerPhone: string;
    orderDate: string;
    expectedDeliveryDate: string;
    status: Order['status'];
    specialInstructions: string;
    items: OrderItem[];
    discount: number;
    additionalCharges: number;
    advancePayment: number;
  }>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'New',
    specialInstructions: '',
    items: [
      {
        id: '1',
        collection: 'T-Shirt',
        productName: 'Heavyweight Crewneck Tee',
        colour: 'Jet Black',
        size: 'M',
        quantity: 100,
        rate: 8.50,
        lineTotal: 850.00,
      },
    ],
    discount: 0,
    additionalCharges: 0,
    advancePayment: 0,
  });

  const loadData = () => {
    setOrders(db.getOrders());
    setCustomers(db.getCustomers());
    setCollections(db.getCollections());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrderBookValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalReceivables = orders.reduce((sum, o) => sum + o.remainingBalance, 0);
  const totalReceived = orders.reduce((sum, o) => sum + o.totalPaymentsReceived, 0);

  // Order item line calculations
  const calculateSubtotal = (items: OrderItem[]) => {
    return items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
  };

  const handleOpenAddOrder = () => {
    const firstCust = customers[0];
    setOrderForm({
      customerId: firstCust?.id || '',
      customerName: firstCust?.companyName || firstCust?.name || '',
      customerPhone: firstCust?.phone || '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'New',
      specialInstructions: '',
      items: [
        {
          id: String(Date.now()),
          collection: collections[0]?.name || 'T-Shirt',
          productName: 'Heavyweight Crewneck Tee',
          colour: 'Jet Black',
          size: 'M',
          quantity: 200,
          rate: 8.50,
          lineTotal: 1700.00,
        },
      ],
      discount: 0,
      additionalCharges: 0,
      advancePayment: 0,
    });
    setIsAddOrderModalOpen(true);
  };

  const handleSelectCustomer = (customerId: string) => {
    const c = customers.find((cust) => cust.id === customerId);
    if (c) {
      setOrderForm({
        ...orderForm,
        customerId: c.id,
        customerName: c.companyName || c.name,
        customerPhone: c.phone,
      });
    }
  };

  const handleAddItemToOrder = () => {
    const newItem: OrderItem = {
      id: String(Date.now()),
      collection: collections[0]?.name || 'T-Shirt',
      productName: '',
      colour: '',
      size: 'L',
      quantity: 100,
      rate: 10.00,
      lineTotal: 1000.00,
    };
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, newItem],
    });
  };

  const handleRemoveItemFromOrder = (index: number) => {
    if (orderForm.items.length <= 1) return;
    const updated = orderForm.items.filter((_, idx) => idx !== index);
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleUpdateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderForm.items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      item.lineTotal = Number(item.quantity) * Number(item.rate);
    }
    updated[index] = item;
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customerId || orderForm.items.length === 0) {
      alert('Please select a customer and specify at least one order line item.');
      return;
    }

    const subtotal = calculateSubtotal(orderForm.items);

    db.addOrder({
      customerId: orderForm.customerId,
      customerName: orderForm.customerName,
      customerPhone: orderForm.customerPhone,
      orderDate: orderForm.orderDate,
      expectedDeliveryDate: orderForm.expectedDeliveryDate,
      status: orderForm.status,
      specialInstructions: orderForm.specialInstructions,
      items: orderForm.items,
      subtotal,
      discount: Number(orderForm.discount || 0),
      additionalCharges: Number(orderForm.additionalCharges || 0),
      totalAmount: subtotal + Number(orderForm.additionalCharges || 0) - Number(orderForm.discount || 0),
      advancePayment: Number(orderForm.advancePayment || 0),
      totalPaymentsReceived: Number(orderForm.advancePayment || 0),
      quantityProduced: 0,
      quantityDispatched: 0,
    });

    setIsAddOrderModalOpen(false);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name && !customerForm.companyName) {
      alert('Please enter client or company name');
      return;
    }

    db.addCustomer(customerForm);
    setIsAddCustomerModalOpen(false);
    setCustomerForm({
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      accountRef: '',
      notes: '',
    });
  };

  const handleDeleteOrder = () => {
    if (deleteConfirmOrder) {
      db.deleteOrder(deleteConfirmOrder.id);
      setDeleteConfirmOrder(null);
    }
  };

  // If viewing invoice
  if (viewInvoiceOrder) {
    const invoice = db.getInvoiceByOrderId(viewInvoiceOrder.id);
    if (invoice) {
      return (
        <InvoiceView
          invoice={invoice}
          settings={db.getSettings()}
          onBack={() => setViewInvoiceOrder(null)}
        />
      );
    }
  }

  const subtotal = calculateSubtotal(orderForm.items);
  const grandTotal = subtotal + Number(orderForm.additionalCharges || 0) - Number(orderForm.discount || 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Clients & Wholesale Orders
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Customer directory, multi-product order booking, and automatic tax invoice generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Users2}
            onClick={() => setIsAddCustomerModalOpen(true)}
          >
            + New Client
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddOrder}
          >
            + Create Wholesale Order
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Order Book Value
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalOrderBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Payments Collected
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Outstanding Receivables
          </div>
          <div className="text-2xl font-black text-neutral-950 mt-1 font-mono">
            {currency}{totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Customer Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Clients Directory ({customers.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder={activeTab === 'orders' ? 'Search by order # or customer...' : 'Search clients...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            {activeTab === 'orders' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="In Work">In Work</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Partially Dispatched">Partially Dispatched</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Completed">Completed</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Delivery Due</th>
                  <th className="py-3 px-4 text-right">Qty (Pieces)</th>
                  <th className="py-3 px-4 text-right">Order Total</th>
                  <th className="py-3 px-4 text-right">Remaining Bal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-500">
                      No customer orders match the query.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{o.customerName}</div>
                        {o.customerPhone && <div className="text-[10px] text-neutral-400">{o.customerPhone}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{o.orderDate}</td>
                      <td className="py-3 px-4 font-mono text-neutral-800 font-medium">{o.expectedDeliveryDate}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {o.quantityOrdered.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {currency}{o.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-neutral-950">
                        {currency}{o.remainingBalance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-[11px] text-neutral-800 uppercase tracking-wider">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[11px] text-neutral-900">
                        {o.paymentStatus}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewInvoiceOrder(o)}
                            className="p-1.5 text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="View / Print Tax Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmOrder(o)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Customers Directory Table */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 font-mono">Account Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      No customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-950">
                        {c.companyName || c.name}
                      </td>
                      <td className="py-3 px-4 text-neutral-800 font-medium">{c.contactPerson || c.name}</td>
                      <td className="py-3 px-4 font-mono text-neutral-700">{c.phone}</td>
                      <td className="py-3 px-4 text-neutral-600">{c.email || '—'}</td>
                      <td className="py-3 px-4 text-neutral-600 truncate max-w-xs">{c.address || '—'}</td>
                      <td className="py-3 px-4 font-mono text-neutral-500">{c.accountRef || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        title="Create Wholesale Garments Order"
        subtitle="Multi-product order booking with automatic invoice creation"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Select Customer *
              </label>
              <select
                value={orderForm.customerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Order Date</label>
              <input
                type="date"
                value={orderForm.orderDate}
                onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={orderForm.expectedDeliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 text-sm">Order Items Breakdown</span>
              <Button variant="secondary" size="sm" type="button" onClick={handleAddItemToOrder}>
                + Add Line Item
              </Button>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="p-2">Collection</th>
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Colour</th>
                    <th className="p-2 text-center">Size</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Rate ({currency})</th>
                    <th className="p-2 text-right">Line Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orderForm.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-2">
                        <select
                          value={it.collection}
                          onChange={(e) => handleUpdateOrderItem(idx, 'collection', e.target.value)}
                          className="w-full px-2 py-1 border border-neutral-300 rounded bg-white"
                        >
                          {collections.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.productName}
                          onChange={(e) => handleUpdateOrderItem(idx, 'productName', e.target.value)}
                          placeholder="Heavyweight Crewneck"
                          className="w-full px-2 py-1 border border-neutral-300 rounded bg-white"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.colour}
                          onChange={(e) => handleUpdateOrderItem(idx, 'colour', e.target.value)}
                          placeholder="Jet Black"
                          className="w-full px-2 py-1 border border-neutral-300 rounded bg-white"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.size}
                          onChange={(e) => handleUpdateOrderItem(idx, 'size', e.target.value)}
                          placeholder="M"
                          className="w-16 mx-auto px-2 py-1 border border-neutral-300 rounded bg-white text-center font-bold"
                          required
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleUpdateOrderItem(idx, 'quantity', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-neutral-300 rounded bg-white text-right font-mono font-bold"
                          required
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={it.rate}
                          onChange={(e) => handleUpdateOrderItem(idx, 'rate', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-neutral-300 rounded bg-white text-right font-mono"
                          required
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-neutral-900">
                        {currency}{(it.quantity * it.rate).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromOrder(idx)}
                          disabled={orderForm.items.length <= 1}
                          className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Adjustments & Advance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Discount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderForm.discount}
                onChange={(e) => setOrderForm({ ...orderForm, discount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Additional Charges ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderForm.additionalCharges}
                onChange={(e) => setOrderForm({ ...orderForm, additionalCharges: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Advance Payment Received ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderForm.advancePayment}
                onChange={(e) => setOrderForm({ ...orderForm, advancePayment: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Special Production Instructions</label>
            <textarea
              rows={2}
              value={orderForm.specialInstructions}
              onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
              placeholder="e.g. Export shrink packaging, individual polybag with barcode sticker"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-neutral-100 rounded-lg flex items-center justify-between text-xs font-semibold">
            <div>
              <span>Subtotal: {currency}{subtotal.toFixed(2)}</span> ·{' '}
              <span>Grand Total: <span className="text-sm font-black text-neutral-950">{currency}{grandTotal.toFixed(2)}</span></span>
            </div>
            <div>
              <span>Advance: {currency}{(orderForm.advancePayment || 0).toFixed(2)}</span> ·{' '}
              <span>Remaining: {currency}{Math.max(0, grandTotal - (orderForm.advancePayment || 0)).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Order & Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Add Wholesale Customer"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Company / Brand Name *</label>
            <input
              type="text"
              value={customerForm.companyName}
              onChange={(e) => setCustomerForm({ ...customerForm, companyName: e.target.value })}
              placeholder="Apex Fashion Retailers Ltd."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={customerForm.contactPerson}
                onChange={(e) => setCustomerForm({ ...customerForm, contactPerson: e.target.value })}
                placeholder="Zubair Ahmed"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Phone Number *</label>
              <input
                type="text"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Account Reference</label>
              <input
                type="text"
                value={customerForm.accountRef}
                onChange={(e) => setCustomerForm({ ...customerForm, accountRef: e.target.value })}
                placeholder="ACT-APEX-01"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Delivery Address</label>
            <input
              type="text"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              placeholder="Commercial Warehouse Plot 402, Trade Boulevard"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmOrder}
        onClose={() => setDeleteConfirmOrder(null)}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message={`Are you sure you want to delete order ${deleteConfirmOrder?.orderNumber}? This will also remove the corresponding invoice.`}
        isDestructive={true}
      />
    </div>
  );
};
