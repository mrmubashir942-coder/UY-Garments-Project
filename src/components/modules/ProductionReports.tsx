import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ProductionRecord, Order, Collection } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  FileBarChart2,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  PackageCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ProductionReports: React.FC = () => {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Period filter
  const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all' as any);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    orderNumber: '',
    collection: '',
    productName: '',
    colour: '',
    size: 'M',
    orderedQty: 0,
    cutQty: 0,
    stitchedQty: 0,
    finishedQty: 0,
    inspectedQty: 0,
    aGradeQty: 0,
    bGradeQty: 0,
    cGradeQty: 0,
    rejectedQty: 0,
    readyToStockQty: 0,
    movedToStock: false,
    stage: 'finishing' as ProductionRecord['stage'],
    notes: '',
  });

  const loadData = () => {
    setRecords(db.getProductionRecords());
    setOrders(db.getOrders());
    setCollections(db.getCollections());
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  // Filter records by period
  const filteredRecords = records.filter((r) => {
    if (!r.date) return true;
    const recDate = new Date(r.date);
    const now = new Date();

    if (periodFilter === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      return r.date === today;
    }
    if (periodFilter === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return recDate >= oneWeekAgo && recDate <= now;
    }
    if (periodFilter === 'monthly') {
      return (
        recDate.getMonth() === now.getMonth() &&
        recDate.getFullYear() === now.getFullYear()
      );
    }
    if (periodFilter === 'yearly') {
      return recDate.getFullYear() === now.getFullYear();
    }
    if (periodFilter === 'custom') {
      if (customStartDate && customEndDate) {
        return r.date >= customStartDate && r.date <= customEndDate;
      }
    }
    return true; // 'all'
  });

  // Calculate Aggregations
  const totalOrdered = filteredRecords.reduce((sum, r) => sum + r.orderedQty, 0);
  const totalCut = filteredRecords.reduce((sum, r) => sum + r.cutQty, 0);
  const totalStitched = filteredRecords.reduce((sum, r) => sum + r.stitchedQty, 0);
  const totalFinished = filteredRecords.reduce((sum, r) => sum + r.finishedQty, 0);
  const totalInspected = filteredRecords.reduce((sum, r) => sum + r.inspectedQty, 0);
  const totalAGrade = filteredRecords.reduce((sum, r) => sum + r.aGradeQty, 0);
  const totalBGrade = filteredRecords.reduce((sum, r) => sum + r.bGradeQty, 0);
  const totalCGrade = filteredRecords.reduce((sum, r) => sum + r.cGradeQty, 0);
  const totalRejected = filteredRecords.reduce((sum, r) => sum + r.rejectedQty, 0);
  const totalReadyToStock = filteredRecords.reduce((sum, r) => sum + r.readyToStockQty, 0);
  const remainingWork = Math.max(0, totalOrdered - totalFinished);

  const handleOpenAdd = () => {
    setModalError(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      orderId: '',
      orderNumber: '',
      collection: collections[0]?.name || 'T-Shirt',
      productName: '',
      colour: '',
      size: 'M',
      orderedQty: 0,
      cutQty: 0,
      stitchedQty: 0,
      finishedQty: 0,
      inspectedQty: 0,
      aGradeQty: 0,
      bGradeQty: 0,
      cGradeQty: 0,
      rejectedQty: 0,
      readyToStockQty: 0,
      movedToStock: false,
      stage: 'finishing',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSelectOrder = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      const firstItem = ord.items[0];
      setFormData({
        ...formData,
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        collection: firstItem?.collection || formData.collection,
        productName: firstItem?.productName || formData.productName,
        colour: firstItem?.colour || formData.colour,
        size: firstItem?.size || formData.size,
        orderedQty: ord.quantityOrdered,
      });
    }
  };

  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const totalGrades =
      Number(formData.aGradeQty) +
      Number(formData.bGradeQty) +
      Number(formData.cGradeQty) +
      Number(formData.rejectedQty);

    if (formData.inspectedQty > 0 && totalGrades > formData.inspectedQty) {
      setModalError(
        `Grade pieces (A:${formData.aGradeQty} + B:${formData.bGradeQty} + C:${formData.cGradeQty} + Rej:${formData.rejectedQty} = ${totalGrades}) cannot exceed total inspected (${formData.inspectedQty}).`
      );
      return;
    }

    try {
      db.addProductionRecord({
        ...formData,
        orderedQty: Number(formData.orderedQty),
        cutQty: Number(formData.cutQty),
        stitchedQty: Number(formData.stitchedQty),
        finishedQty: Number(formData.finishedQty),
        inspectedQty: Number(formData.inspectedQty),
        aGradeQty: Number(formData.aGradeQty),
        bGradeQty: Number(formData.bGradeQty),
        cGradeQty: Number(formData.cGradeQty),
        rejectedQty: Number(formData.rejectedQty),
        readyToStockQty: Number(formData.readyToStockQty || formData.aGradeQty),
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Error saving production report.');
    }
  };

  const handleMoveToFactoryStock = (recordId: string) => {
    try {
      db.moveProductionToFactoryStock(recordId);
      alert('Successfully transferred ready-to-stock pieces to Factory Stock!');
    } catch (err: any) {
      alert(err.message || 'Error moving to factory stock.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Production Reports & Quality Audits
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Assembly line tracking across Cutting, Stitching, Finishing, and A/B/C/Reject quality grading.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            + Record Production Batch
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
          {(['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                periodFilter === period
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {period === 'all'
                ? 'All Historical Records'
                : period.charAt(0).toUpperCase() + period.slice(1) + ' Report'}
            </button>
          ))}
        </div>

        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 border border-neutral-300 rounded text-xs"
            />
            <span className="text-neutral-500 font-medium">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 border border-neutral-300 rounded text-xs"
            />
          </div>
        )}
      </div>

      {/* Numerical Production Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Total Ordered
          </div>
          <div className="text-xl font-black text-neutral-900 mt-1 font-mono">
            {totalOrdered.toLocaleString()} <span className="text-[10px] text-neutral-400">pcs</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Total Cut
          </div>
          <div className="text-xl font-black text-neutral-900 mt-1 font-mono">
            {totalCut.toLocaleString()} <span className="text-[10px] text-neutral-400">pcs</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Total Stitched
          </div>
          <div className="text-xl font-black text-neutral-900 mt-1 font-mono">
            {totalStitched.toLocaleString()} <span className="text-[10px] text-neutral-400">pcs</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Total Finished
          </div>
          <div className="text-xl font-black text-neutral-900 mt-1 font-mono">
            {totalFinished.toLocaleString()} <span className="text-[10px] text-neutral-400">pcs</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Ready-to-Stock
          </div>
          <div className="text-xl font-black text-neutral-950 mt-1 font-mono">
            {totalReadyToStock.toLocaleString()} <span className="text-[10px] text-neutral-400">pcs</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Remaining Work
          </div>
          <div className="text-xl font-black text-neutral-900 mt-1 font-mono">
            {remainingWork.toLocaleString()} <span className="text-[10px] text-neutral-400">pcs</span>
          </div>
        </div>
      </div>

      {/* Quality Inspection Grading Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Quality Inspection & Grading Audit (Inspected: {totalInspected.toLocaleString()} pcs)
            </h3>
            <p className="text-xs text-neutral-500">
              Verified breakdown of A-Grade, B-Grade, C-Grade and Rejections
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3 border border-neutral-200 rounded-lg">
            <div className="font-bold text-neutral-900">A-Grade (Export Quality)</div>
            <div className="text-2xl font-black font-mono text-neutral-950 mt-1">
              {totalAGrade.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Pass rate: {totalInspected > 0 ? ((totalAGrade / totalInspected) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="p-3 border border-neutral-200 rounded-lg">
            <div className="font-bold text-neutral-800">B-Grade (Minor Variance)</div>
            <div className="text-2xl font-black font-mono text-neutral-900 mt-1">
              {totalBGrade.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Secondary local wholesale</div>
          </div>

          <div className="p-3 border border-neutral-200 rounded-lg">
            <div className="font-bold text-neutral-800">C-Grade (Substandard)</div>
            <div className="text-2xl font-black font-mono text-neutral-800 mt-1">
              {totalCGrade.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Rework or discount lot</div>
          </div>

          <div className="p-3 border border-neutral-200 rounded-lg">
            <div className="font-bold text-neutral-900">Rejected (Scrap / Fabric Flaw)</div>
            <div className="text-2xl font-black font-mono text-neutral-900 mt-1">
              {totalRejected.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Rejection rate: {totalInspected > 0 ? ((totalRejected / totalInspected) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Production Records Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Order / Batch</th>
                <th className="py-3 px-4">Article & Colour</th>
                <th className="py-3 px-4 text-center">Stage</th>
                <th className="py-3 px-4 text-right">Ordered</th>
                <th className="py-3 px-4 text-right">Cut</th>
                <th className="py-3 px-4 text-right">Stitched</th>
                <th className="py-3 px-4 text-right">Finished</th>
                <th className="py-3 px-4 text-center">Grades (A / B / C / Rej)</th>
                <th className="py-3 px-4 text-center">Stock Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500">
                    No production batches found for this period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-neutral-600">{r.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-neutral-900">{r.orderNumber || 'Stock Batch'}</div>
                      <div className="text-[10px] text-neutral-400">{r.collection}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-950">{r.productName}</div>
                      <div className="text-neutral-500 text-[11px]">
                        {r.colour} · Size: <span className="font-semibold text-neutral-800">{r.size}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="capitalize font-semibold text-neutral-800">
                        {r.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-neutral-600">{r.orderedQty}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-neutral-600">{r.cutQty}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-neutral-600">{r.stitchedQty}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">{r.finishedQty}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="font-bold text-neutral-950">{r.aGradeQty}</span> /{' '}
                      <span className="text-neutral-600">{r.bGradeQty}</span> /{' '}
                      <span className="text-neutral-600">{r.cGradeQty}</span> /{' '}
                      <span className="text-neutral-500">{r.rejectedQty}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.movedToStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-neutral-900" /> In Stock
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMoveToFactoryStock(r.id)}
                          className="px-2 py-1 bg-neutral-900 text-white rounded text-[11px] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          Move Ready to Stock ({r.readyToStockQty})
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Production Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Production & Quality Inspection"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduction} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-lg text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Link Client Order (Optional)
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="">Floor Inventory Batch</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.customerName} ({o.quantityOrdered} pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Inspection Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Collection</label>
              <select
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Article Name *</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="Heavyweight Crewneck Tee"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Colour *</label>
              <input
                type="text"
                value={formData.colour}
                onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                placeholder="Jet Black"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Size *</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="M, L, XL"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="font-bold text-neutral-900 mb-2">Stage Quantities Progress</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1">Ordered Qty</label>
                <input
                  type="number"
                  min="0"
                  value={formData.orderedQty}
                  onChange={(e) => setFormData({ ...formData, orderedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Cut Qty</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cutQty}
                  onChange={(e) => setFormData({ ...formData, cutQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Stitched Qty</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stitchedQty}
                  onChange={(e) => setFormData({ ...formData, stitchedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Finished Qty</label>
                <input
                  type="number"
                  min="0"
                  value={formData.finishedQty}
                  onChange={(e) => setFormData({ ...formData, finishedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="font-bold text-neutral-900 mb-2">
              Quality Inspection & Grades (A + B + C + Reject must not exceed Inspected)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">Total Inspected</label>
                <input
                  type="number"
                  min="0"
                  value={formData.inspectedQty}
                  onChange={(e) => setFormData({ ...formData, inspectedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">A-Grade (Pass)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.aGradeQty}
                  onChange={(e) => {
                    const a = Number(e.target.value);
                    setFormData({ ...formData, aGradeQty: a, readyToStockQty: a });
                  }}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">B-Grade</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bGradeQty}
                  onChange={(e) => setFormData({ ...formData, bGradeQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">C-Grade</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cGradeQty}
                  onChange={(e) => setFormData({ ...formData, cGradeQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Rejected</label>
                <input
                  type="number"
                  min="0"
                  value={formData.rejectedQty}
                  onChange={(e) => setFormData({ ...formData, rejectedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Production Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
