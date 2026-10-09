import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ExpenseRecord, ExpenseCategory, PaymentMethod } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Receipt,
  Plus,
  Search,
  Upload,
  FileText,
  Download,
  Trash2,
  Calendar,
  Eye,
  Paperclip,
} from 'lucide-react';

export const ExpensesModule: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [currency, setCurrency] = useState('$');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewAttachmentExpense, setViewAttachmentExpense] = useState<ExpenseRecord | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<ExpenseRecord | null>(null);

  // Form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Electricity & Utilities' as ExpenseCategory,
    description: '',
    amount: 0,
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    paidToVendor: '',
    referenceNumber: '',
    notes: '',
    attachmentName: '',
    attachmentData: '',
    status: 'Paid' as 'Paid' | 'Pending',
  });

  const loadData = () => {
    setExpenses(db.getExpenses());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const categories: ExpenseCategory[] = [
    'Factory Rent',
    'Electricity & Utilities',
    'Machine Maintenance',
    'Dyes & Chemicals',
    'Transport & Logistics',
    'Packing Materials',
    'Staff Welfare',
    'Office & Admin',
    'Salaries',
    'Other',
  ];

  // Period filtering
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidToVendor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || e.category === selectedCategory;

    let matchesPeriod = true;
    if (e.date) {
      const expDate = new Date(e.date);
      const now = new Date();
      if (periodFilter === 'daily') {
        const todayStr = now.toISOString().split('T')[0];
        matchesPeriod = e.date === todayStr;
      } else if (periodFilter === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchesPeriod = expDate >= oneWeekAgo && expDate <= now;
      } else if (periodFilter === 'monthly') {
        matchesPeriod = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      } else if (periodFilter === 'yearly') {
        matchesPeriod = expDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesCategory && matchesPeriod;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category wise summary breakdown
  const categoryTotals = categories.map((cat) => {
    const total = filteredExpenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return { category: cat, total };
  }).filter((c) => c.total > 0);

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Electricity & Utilities',
      description: '',
      amount: 0,
      paymentMethod: 'Bank Transfer',
      paidToVendor: '',
      referenceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: '',
      attachmentName: '',
      attachmentData: '',
      status: 'Paid',
    });
    setIsAddModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData({
          ...formData,
          attachmentName: file.name,
          attachmentData: uploadEvent.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) {
      alert('Please specify description and valid expense amount.');
      return;
    }

    db.addExpense({
      ...formData,
      amount: Number(formData.amount),
    });

    setIsAddModalOpen(false);
  };

  const handleDeleteExpense = () => {
    if (deleteConfirmExpense) {
      db.deleteExpense(deleteConfirmExpense.id);
      setDeleteConfirmExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Factory Expenses & Disbursements
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Operational expenses, rent, utilities, maintenance, bill receipts, and category summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            + Record Expense Voucher
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Expenses for Period
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Expense Vouchers Logged
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {filteredExpenses.length} <span className="text-xs font-normal text-neutral-500">vouchers</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Largest Expense Category
          </div>
          <div className="text-lg font-bold text-neutral-950 mt-1 truncate">
            {categoryTotals[0] ? categoryTotals[0].category : 'None'}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
            {categoryTotals[0] ? `${currency}${categoryTotals[0].total.toFixed(2)}` : '—'}
          </div>
        </div>
      </div>

      {/* Category Wise Breakdown Grid */}
      {categoryTotals.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Category-wise Disbursement Breakdown
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {categoryTotals.map((c) => (
              <div key={c.category} className="p-3 border border-neutral-200 rounded-lg">
                <div className="font-semibold text-neutral-900 truncate">{c.category}</div>
                <div className="font-mono font-black text-neutral-950 mt-1 text-sm">
                  {currency}{c.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Period Controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
            {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  periodFilter === period
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {period === 'all'
                  ? 'All History'
                  : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search expense or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To / Vendor</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Bill / Receipt</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    No expense records recorded for this filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-950">{exp.expenseNumber}</td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{exp.date}</td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">{exp.category}</td>
                    <td className="py-3 px-4 text-neutral-950 font-medium">
                      <div>{exp.description}</div>
                      {exp.referenceNumber && (
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Ref: {exp.referenceNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{exp.paidToVendor || '—'}</td>
                    <td className="py-3 px-4 text-center text-neutral-600">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-neutral-950 text-sm">
                      {currency}{exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {exp.attachmentData ? (
                        <button
                          onClick={() => setViewAttachmentExpense(exp)}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-900 font-bold hover:underline cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-[10px]">No receipt</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setDeleteConfirmExpense(exp)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Factory Expense"
        subtitle="Log operational overheads and upload bill attachments"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Expense Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Expense Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Description / Purpose *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Factory floor electricity bill for September / Overlock oil servicing"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Reference / Bill #</label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="e.g. INV-8821"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Paid To / Vendor Name</label>
              <input
                type="text"
                value={formData.paidToVendor}
                onChange={(e) => setFormData({ ...formData, paidToVendor: e.target.value })}
                placeholder="e.g. Al-Madina Industrial Supplies"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Bill Attachment Upload */}
          <div className="p-3 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50 space-y-2">
            <div className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-neutral-700" />
              <span>Attach Bill / Vendor Invoice (Image or PDF)</span>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="text-xs text-neutral-600 cursor-pointer"
            />
            {formData.attachmentName && (
              <div className="text-[11px] text-neutral-900 font-mono font-medium">
                Attached: {formData.attachmentName}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Expense Voucher
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Attachment Modal */}
      <Modal
        isOpen={!!viewAttachmentExpense}
        onClose={() => setViewAttachmentExpense(null)}
        title={`Receipt Bill: ${viewAttachmentExpense?.expenseNumber}`}
        subtitle={viewAttachmentExpense?.description}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {viewAttachmentExpense?.attachmentData?.startsWith('data:image') ? (
            <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-[60vh] flex items-center justify-center bg-neutral-100">
              <img
                src={viewAttachmentExpense.attachmentData}
                alt="Receipt Bill"
                className="max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-6 text-center border border-neutral-200 rounded-lg bg-neutral-50">
              <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="font-mono text-neutral-900">{viewAttachmentExpense?.attachmentName}</p>
              <a
                href={viewAttachmentExpense?.attachmentData}
                download={viewAttachmentExpense?.attachmentName || 'bill-receipt'}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white rounded text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Download Attached Bill
              </a>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" onClick={() => setViewAttachmentExpense(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmExpense}
        onClose={() => setDeleteConfirmExpense(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={`Are you sure you want to delete ${deleteConfirmExpense?.expenseNumber} (${deleteConfirmExpense?.description})?`}
        isDestructive={true}
      />
    </div>
  );
};
