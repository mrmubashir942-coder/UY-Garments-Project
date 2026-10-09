import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { PaymentRecord, Order, Customer, PaymentMethod } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  Plus,
  Search,
  BookOpen,
  Calendar,
  FileCheck,
  Building,
  ArrowUpRight,
} from 'lucide-react';

export const PaymentsModule: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currency, setCurrency] = useState('$');

  const [activeTab, setActiveTab] = useState<'all-payments' | 'customer-ledger' | 'order-summary'>('all-payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');

  // Modals
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  // Form
  const [paymentForm, setPaymentForm] = useState<{
    customerId: string;
    customerName: string;
    orderId: string;
    orderNumber: string;
    invoiceNumber: string;
    paymentDate: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentType: 'advance' | 'subsequent';
    accountReference: string;
    chequeNumber: string;
    bankReference: string;
    notes: string;
    receivedBy: string;
  }>({
    customerId: '',
    customerName: '',
    orderId: '',
    orderNumber: '',
    invoiceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'Bank Transfer',
    paymentType: 'subsequent',
    accountReference: '',
    chequeNumber: '',
    bankReference: '',
    notes: '',
    receivedBy: 'Accountant - Farhan Ali',
  });

  const loadData = () => {
    setPayments(db.getPayments());
    setOrders(db.getOrders());
    setCustomers(db.getCustomers());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const totalPaymentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstandingBalance = orders.reduce((sum, o) => sum + o.remainingBalance, 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.orderNumber && p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.chequeNumber && p.chequeNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCustomer =
      selectedCustomerId === 'all' || p.customerId === selectedCustomerId;

    return matchesSearch && matchesCustomer;
  });

  const handleOpenAdd = () => {
    const firstOrder = orders.find((o) => o.remainingBalance > 0) || orders[0];
    const cust = customers.find((c) => c.id === firstOrder?.customerId) || customers[0];
    const inv = firstOrder ? db.getInvoiceByOrderId(firstOrder.id) : null;

    setPaymentForm({
      customerId: cust?.id || '',
      customerName: cust?.companyName || cust?.name || '',
      orderId: firstOrder?.id || '',
      orderNumber: firstOrder?.orderNumber || '',
      invoiceNumber: inv?.invoiceNumber || '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: firstOrder ? firstOrder.remainingBalance : 0,
      paymentMethod: 'Bank Transfer',
      paymentType: 'subsequent',
      accountReference: 'HBL-Commercial A/C',
      chequeNumber: '',
      bankReference: '',
      notes: 'Cleared payment received',
      receivedBy: 'Accountant - Farhan Ali',
    });
    setIsAddPaymentModalOpen(true);
  };

  const handleSelectOrderInPaymentForm = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      const inv = db.getInvoiceByOrderId(ord.id);
      setPaymentForm({
        ...paymentForm,
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        customerId: ord.customerId,
        customerName: ord.customerName,
        invoiceNumber: inv?.invoiceNumber || '',
        amount: ord.remainingBalance,
      });
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customerName || paymentForm.amount <= 0) {
      alert('Please specify valid customer and positive payment amount.');
      return;
    }

    db.addPayment({
      ...paymentForm,
      amount: Number(paymentForm.amount),
    });

    setIsAddPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Payments & Customer Accounts Ledger
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Advance payments, subsequent collections, cheques, bank wire remittances, and customer-wise ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            + Record Payment Receipt
          </Button>
        </div>
      </div>

      {/* Numerical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Payments Collected
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalPaymentsCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Current Outstanding Receivables
          </div>
          <div className="text-2xl font-black text-neutral-950 mt-1 font-mono">
            {currency}{totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Payment Vouchers Issued
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {payments.length} <span className="text-xs font-normal text-neutral-500">receipts</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('all-payments')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'all-payments'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Payment Receipts ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('customer-ledger')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'customer-ledger'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Customer Ledgers
            </button>
            <button
              onClick={() => setActiveTab('order-summary')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'order-summary'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Order-wise Balances
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search payment or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            {activeTab === 'customer-ledger' && (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              >
                <option value="all">All Clients</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: All Payments Table */}
      {activeTab === 'all-payments' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order & Invoice Ref</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Method</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4">Bank / Cheque Details</th>
                  <th className="py-3 px-4">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{p.paymentNumber}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{p.paymentDate}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">{p.customerName}</td>
                      <td className="py-3 px-4 font-mono text-neutral-700">
                        <div>{p.orderNumber || 'General Payment'}</div>
                        {p.invoiceNumber && <div className="text-[10px] text-neutral-400">{p.invoiceNumber}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-neutral-800 capitalize">
                          {p.paymentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-neutral-700">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-neutral-950 text-sm">
                        {currency}{p.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {p.chequeNumber && <div>Cheque: {p.chequeNumber}</div>}
                        {p.bankReference && <div>Ref: {p.bankReference}</div>}
                        {p.accountReference && <div>A/C: {p.accountReference}</div>}
                        {p.notes && <div className="text-[10px] text-neutral-400 mt-0.5">{p.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{p.receivedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Customer Ledgers */}
      {activeTab === 'customer-ledger' && (
        <div className="space-y-6">
          {customers
            .filter((c) => selectedCustomerId === 'all' || c.id === selectedCustomerId)
            .map((cust) => {
              const custOrders = orders.filter((o) => o.customerId === cust.id);
              const custPayments = payments.filter((p) => p.customerId === cust.id);
              const totalBilled = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
              const balanceDue = totalBilled - totalPaid;

              return (
                <div key={cust.id} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-2">
                    <div>
                      <h3 className="font-bold text-base text-neutral-950">
                        {cust.companyName || cust.name}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Account Ref: {cust.accountRef || 'ACT-STD'} · Phone: {cust.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-neutral-500">Total Billed:</span>{' '}
                        <span className="font-mono font-bold text-neutral-900">{currency}{totalBilled.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Total Paid:</span>{' '}
                        <span className="font-mono font-bold text-neutral-900">{currency}{totalPaid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Balance:</span>{' '}
                        <span className="font-mono font-black text-neutral-950 text-sm">{currency}{balanceDue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History under this customer */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-600 font-semibold uppercase text-[10px]">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Voucher #</th>
                          <th className="py-2 px-3">Order #</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Reference / Cheque</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {custPayments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-neutral-400">
                              No payment vouchers recorded for this client.
                            </td>
                          </tr>
                        ) : (
                          custPayments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2 px-3 font-mono text-neutral-600">{p.paymentDate}</td>
                              <td className="py-2 px-3 font-mono font-bold text-neutral-900">{p.paymentNumber}</td>
                              <td className="py-2 px-3 font-mono">{p.orderNumber || '—'}</td>
                              <td className="py-2 px-3">{p.paymentMethod}</td>
                              <td className="py-2 px-3 text-neutral-600">{p.chequeNumber || p.bankReference || p.accountReference || '—'}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                                {currency}{p.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Tab 3: Order-wise Summary */}
      {activeTab === 'order-summary' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Order Grand Total</th>
                  <th className="py-3 px-4 text-right">Advance Received</th>
                  <th className="py-3 px-4 text-right">Subsequent Received</th>
                  <th className="py-3 px-4 text-right">Total Payments</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((o) => {
                  const subsequent = Math.max(0, o.totalPaymentsReceived - o.advancePayment);
                  return (
                    <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{o.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">{o.customerName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {currency}{o.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-700">
                        {currency}{o.advancePayment.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-700">
                        {currency}{subsequent.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {currency}{o.totalPaymentsReceived.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-neutral-950">
                        {currency}{o.remainingBalance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[11px] uppercase tracking-wider">
                        {o.paymentStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Receipt Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Record Payment Receipt"
        subtitle="Post advance or invoice clearance into customer ledger"
        maxWidth="lg"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Link Client Order (Optional)
              </label>
              <select
                value={paymentForm.orderId}
                onChange={(e) => handleSelectOrderInPaymentForm(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="">General Account Payment</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customerName} (Bal: {currency}{o.remainingBalance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Payment Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Type</label>
              <select
                value={paymentForm.paymentType}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="advance">Advance Payment</option>
                <option value="subsequent">Subsequent Settlement</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Cheque Number</label>
              <input
                type="text"
                value={paymentForm.chequeNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
                placeholder="e.g. CHQ-991204"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Bank Reference / Wire ID</label>
              <input
                type="text"
                value={paymentForm.bankReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, bankReference: e.target.value })}
                placeholder="e.g. FT-261009-4412"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Account Ref / Voucher</label>
              <input
                type="text"
                value={paymentForm.accountReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, accountReference: e.target.value })}
                placeholder="e.g. HBL-009128"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Remarks & Ledger Notes</label>
            <textarea
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="e.g. Cleared via Meezan online portal"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Payment Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
