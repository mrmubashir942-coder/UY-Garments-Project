import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { FabricItem, CuttingRecord, Collection, Order } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Plus,
  Scissors,
  Layers,
  Search,
  AlertCircle,
  Trash2,
  Edit2,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

export const FabricStock: React.FC = () => {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [cuttings, setCuttings] = useState<CuttingRecord[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState('$');

  const [activeTab, setActiveTab] = useState<'fabric-batches' | 'cutting-records'>('fabric-batches');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddFabricModalOpen, setIsAddFabricModalOpen] = useState(false);
  const [isAddCuttingModalOpen, setIsAddCuttingModalOpen] = useState(false);
  const [isEditCuttingModalOpen, setIsEditCuttingModalOpen] = useState(false);
  const [isAdjustFabricModalOpen, setIsAdjustFabricModalOpen] = useState(false);
  const [activeFabric, setActiveFabric] = useState<FabricItem | null>(null);
  const [adjustFabricData, setAdjustFabricData] = useState({
    newRemainingKg: 0,
    reason: 'Physical roll weight audit',
    adjustedBy: 'Warehouse Manager',
  });
  const [deleteConfirmFabric, setDeleteConfirmFabric] = useState<FabricItem | null>(null);
  const [deleteConfirmCutting, setDeleteConfirmCutting] = useState<CuttingRecord | null>(null);

  // Edit cutting record state
  const [activeCutting, setActiveCutting] = useState<CuttingRecord | null>(null);

  // Form: Fabric Receiving
  const [fabricForm, setFabricForm] = useState({
    fabricName: '',
    collectionOrProduct: '',
    colour: '',
    batchLot: '',
    quantityKg: 0,
    purchaseRatePerKg: 0,
    supplier: '',
    dateReceived: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Form: Cutting Record
  const [cuttingForm, setCuttingForm] = useState<{
    cuttingDate: string;
    fabricId: string;
    fabricName: string;
    collectionOrProduct: string;
    colour: string;
    fabricBatch: string;
    fabricConsumedKg: number;
    piecesCut: number;
    sizeBreakdown: Record<string, number>;
    relatedOrderId: string;
    orderNumber: string;
    cutBy: string;
    notes: string;
  }>({
    cuttingDate: new Date().toISOString().split('T')[0],
    fabricId: '',
    fabricName: '',
    collectionOrProduct: '',
    colour: '',
    fabricBatch: '',
    fabricConsumedKg: 0,
    piecesCut: 0,
    sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    relatedOrderId: '',
    orderNumber: '',
    cutBy: 'Master Tariq Jameel',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setFabrics(db.getFabricStock());
    setCuttings(db.getCuttingRecords());
    setCollections(db.getCollections());
    setOrders(db.getOrders());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  // Totals
  const totalReceivedKg = fabrics.reduce((sum, f) => sum + f.quantityKg, 0);
  const totalConsumedKg = fabrics.reduce((sum, f) => sum + f.consumedKg, 0);
  const totalRemainingKg = fabrics.reduce((sum, f) => sum + f.remainingKg, 0);
  const totalInventoryValuation = fabrics.reduce((sum, f) => sum + f.remainingKg * f.purchaseRatePerKg, 0);
  const totalPiecesCut = cuttings.reduce((sum, c) => sum + c.piecesCut, 0);

  // Filtered views
  const filteredFabrics = fabrics.filter(
    (f) =>
      f.fabricName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.colour.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.batchLot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCuttings = cuttings.filter(
    (c) =>
      c.fabricName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.colour.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fabricBatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.orderNumber && c.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open add cutting modal & pre-select first fabric if available
  const handleOpenAddCutting = () => {
    setFormError(null);
    const firstFabric = fabrics.find((f) => f.remainingKg > 0) || fabrics[0];
    setCuttingForm({
      cuttingDate: new Date().toISOString().split('T')[0],
      fabricId: firstFabric?.id || '',
      fabricName: firstFabric?.fabricName || '',
      collectionOrProduct: firstFabric?.collectionOrProduct || '',
      colour: firstFabric?.colour || '',
      fabricBatch: firstFabric?.batchLot || '',
      fabricConsumedKg: 0,
      piecesCut: 0,
      sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      relatedOrderId: '',
      orderNumber: '',
      cutBy: 'Master Tariq Jameel',
      notes: '',
    });
    setIsAddCuttingModalOpen(true);
  };

  // Change selected fabric in cutting modal
  const handleSelectFabricForCutting = (fabricId: string) => {
    const selected = fabrics.find((f) => f.id === fabricId);
    if (selected) {
      setCuttingForm({
        ...cuttingForm,
        fabricId: selected.id,
        fabricName: selected.fabricName,
        collectionOrProduct: selected.collectionOrProduct,
        colour: selected.colour,
        fabricBatch: selected.batchLot,
      });
    }
  };

  const handleSelectOrderForCutting = (orderId: string) => {
    const selected = orders.find((o) => o.id === orderId);
    setCuttingForm({
      ...cuttingForm,
      relatedOrderId: selected ? selected.id : '',
      orderNumber: selected ? selected.orderNumber : '',
    });
  };

  const handleSaveFabric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fabricForm.fabricName || !fabricForm.colour || !fabricForm.batchLot || fabricForm.quantityKg <= 0) {
      alert('Please fill in fabric name, colour, batch lot and valid quantity.');
      return;
    }

    db.addFabricStock(fabricForm);
    setIsAddFabricModalOpen(false);
    setFabricForm({
      fabricName: '',
      collectionOrProduct: '',
      colour: '',
      batchLot: '',
      quantityKg: 0,
      purchaseRatePerKg: 0,
      supplier: '',
      dateReceived: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSaveCutting = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!cuttingForm.fabricId) {
      setFormError('Please select a fabric lot.');
      return;
    }

    if (cuttingForm.fabricConsumedKg <= 0) {
      setFormError('Fabric consumed (kg) must be greater than zero.');
      return;
    }

    if (cuttingForm.piecesCut <= 0) {
      setFormError('Pieces cut must be greater than zero.');
      return;
    }

    try {
      db.addCuttingRecord(cuttingForm);
      setIsAddCuttingModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error recording cutting.');
    }
  };

  const handleOpenEditCutting = (cutting: CuttingRecord) => {
    setActiveCutting(cutting);
    setCuttingForm({
      cuttingDate: cutting.cuttingDate,
      fabricId: cutting.fabricId,
      fabricName: cutting.fabricName,
      collectionOrProduct: cutting.collectionOrProduct,
      colour: cutting.colour,
      fabricBatch: cutting.fabricBatch,
      fabricConsumedKg: cutting.fabricConsumedKg,
      piecesCut: cutting.piecesCut,
      sizeBreakdown: cutting.sizeBreakdown || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      relatedOrderId: cutting.relatedOrderId || '',
      orderNumber: cutting.orderNumber || '',
      cutBy: cutting.cutBy || 'Master Tariq Jameel',
      notes: cutting.notes || '',
    });
    setFormError(null);
    setIsEditCuttingModalOpen(true);
  };

  const handleSaveEditCutting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCutting) return;
    setFormError(null);

    try {
      db.updateCuttingRecord(activeCutting.id, cuttingForm);
      setIsEditCuttingModalOpen(false);
      setActiveCutting(null);
    } catch (err: any) {
      setFormError(err.message || 'Error updating cutting record.');
    }
  };

  const handleOpenAdjustFabric = (fabric: FabricItem) => {
    setActiveFabric(fabric);
    setAdjustFabricData({
      newRemainingKg: fabric.remainingKg,
      reason: 'Physical roll weight audit',
      adjustedBy: 'Warehouse Manager',
    });
    setIsAdjustFabricModalOpen(true);
  };

  const handleSaveAdjustFabric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFabric) return;
    db.adjustFabricStock(
      activeFabric.id,
      Number(adjustFabricData.newRemainingKg),
      adjustFabricData.reason,
      adjustFabricData.adjustedBy
    );
    setIsAdjustFabricModalOpen(false);
    setActiveFabric(null);
  };

  const handleDeleteCutting = () => {
    if (deleteConfirmCutting) {
      db.deleteCuttingRecord(deleteConfirmCutting.id);
      setDeleteConfirmCutting(null);
    }
  };

  const handleDeleteFabric = () => {
    if (deleteConfirmFabric) {
      db.deleteFabricStock(deleteConfirmFabric.id);
      setDeleteConfirmFabric(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Fabric Stock & Cutting Master
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Raw yarn & knit roll batches, automatic kg deduction, and cutting floor reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Scissors}
            onClick={handleOpenAddCutting}
          >
            + New Cutting Record
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddFabricModalOpen(true)}
          >
            + Receive Fabric Batch
          </Button>
        </div>
      </div>

      {/* Numerical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Fabric Received
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalReceivedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Consumed in Cutting
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalConsumedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Yield: {totalPiecesCut.toLocaleString()} garments cut
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Remaining In Warehouse
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalRemainingKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Fabric Asset Valuation
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalInventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented control for functional switching */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('fabric-batches')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'fabric-batches'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Fabric Batches & Rolls ({fabrics.length})
            </button>
            <button
              onClick={() => setActiveTab('cutting-records')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'cutting-records'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Cutting Transactions ({cuttings.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search fabric or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Fabric Batches */}
      {activeTab === 'fabric-batches' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fabric Description</th>
                  <th className="py-3 px-4">Batch / Lot #</th>
                  <th className="py-3 px-4">Intended Product</th>
                  <th className="py-3 px-4 text-center">Colour</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Consumed</th>
                  <th className="py-3 px-4 text-right">Remaining</th>
                  <th className="py-3 px-4 text-right">Rate / kg</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredFabrics.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-500">
                      No fabric lots found.
                    </td>
                  </tr>
                ) : (
                  filteredFabrics.map((f) => (
                    <tr key={f.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-950 flex items-center gap-1.5">
                          <span>{f.fabricName}</span>
                          {f.isDemo && (
                            <span className="text-[10px] text-neutral-400 font-mono">· Demo</span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">Recv: {f.dateReceived}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">{f.batchLot}</td>
                      <td className="py-3 px-4 text-neutral-700">{f.collectionOrProduct}</td>
                      <td className="py-3 px-4 text-center text-neutral-800">{f.colour}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-neutral-600">
                        {f.quantityKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">
                        {f.consumedKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                        <span className={f.remainingKg < 50 ? 'underline font-black' : ''}>
                          {f.remainingKg.toLocaleString()} kg
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-700">
                        {currency}{f.purchaseRatePerKg.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 truncate max-w-xs">{f.supplier}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAdjustFabric(f)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Authorized Weight Adjustment"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmFabric(f)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Delete Fabric Batch"
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

      {/* Tab 2: Cutting Records */}
      {activeTab === 'cutting-records' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product / Collection</th>
                  <th className="py-3 px-4">Batch Lot</th>
                  <th className="py-3 px-4 text-center">Colour</th>
                  <th className="py-3 px-4 text-right">Fabric Used (kg)</th>
                  <th className="py-3 px-4 text-right">Pieces Cut</th>
                  <th className="py-3 px-4">Size Breakdown</th>
                  <th className="py-3 px-4">Related Order</th>
                  <th className="py-3 px-4">Cutting Master</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCuttings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-500">
                      No cutting records registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredCuttings.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-neutral-600">{c.cuttingDate}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-950">{c.collectionOrProduct}</div>
                        <div className="text-[10px] text-neutral-400 truncate max-w-xs">{c.fabricName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">{c.fabricBatch}</td>
                      <td className="py-3 px-4 text-center text-neutral-800">{c.colour}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {c.fabricConsumedKg} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-neutral-950">
                        {c.piecesCut.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 text-[11px] font-mono text-neutral-600">
                          {c.sizeBreakdown &&
                            Object.entries(c.sizeBreakdown)
                              .filter(([_, qty]) => qty > 0)
                              .map(([sz, qty]) => (
                                <span key={sz} className="border border-neutral-200 px-1 py-0.5 rounded">
                                  {sz}:{qty}
                                </span>
                              ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                        {c.orderNumber || 'Floor Stock'}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{c.cutBy || 'Cutting Dept'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditCutting(c)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Edit Cutting Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmCutting(c)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Delete and Reverse Fabric Deduction"
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

      {/* Add Fabric Batch Modal */}
      <Modal
        isOpen={isAddFabricModalOpen}
        onClose={() => setIsAddFabricModalOpen(false)}
        title="Receive Fabric Batch / Roll"
        subtitle="Record newly delivered raw fabric lot into inventory"
      >
        <form onSubmit={handleSaveFabric} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Fabric Name / Construction Type *
            </label>
            <input
              type="text"
              value={fabricForm.fabricName}
              onChange={(e) => setFabricForm({ ...fabricForm, fabricName: e.target.value })}
              placeholder="e.g. Single Jersey 100% Combed Cotton 220 GSM"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Batch / Lot # *
              </label>
              <input
                type="text"
                value={fabricForm.batchLot}
                onChange={(e) => setFabricForm({ ...fabricForm, batchLot: e.target.value })}
                placeholder="LOT-2026-BLK-01"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Colour *
              </label>
              <input
                type="text"
                value={fabricForm.colour}
                onChange={(e) => setFabricForm({ ...fabricForm, colour: e.target.value })}
                placeholder="e.g. Jet Black"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Collection / Intended Product
              </label>
              <input
                type="text"
                value={fabricForm.collectionOrProduct}
                onChange={(e) => setFabricForm({ ...fabricForm, collectionOrProduct: e.target.value })}
                placeholder="T-Shirt, Polo, Hoodie"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Quantity in Kilograms *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={fabricForm.quantityKg}
                onChange={(e) => setFabricForm({ ...fabricForm, quantityKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Purchase Rate / kg ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fabricForm.purchaseRatePerKg}
                onChange={(e) => setFabricForm({ ...fabricForm, purchaseRatePerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={fabricForm.dateReceived}
                onChange={(e) => setFabricForm({ ...fabricForm, dateReceived: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Knitting Mill / Fabric Supplier
              </label>
              <input
                type="text"
                value={fabricForm.supplier}
                onChange={(e) => setFabricForm({ ...fabricForm, supplier: e.target.value })}
                placeholder="e.g. Al-Hadeed Textile Mills"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Notes & Dye Quality
              </label>
              <input
                type="text"
                value={fabricForm.notes}
                onChange={(e) => setFabricForm({ ...fabricForm, notes: e.target.value })}
                placeholder="Reactive dyed, pre-shrunk, bio-polished"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddFabricModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Receive Fabric
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Cutting Record Modal */}
      <Modal
        isOpen={isAddCuttingModalOpen}
        onClose={() => setIsAddCuttingModalOpen(false)}
        title="Record Fabric Cutting"
        subtitle="Automatic deduction of kilograms from matching fabric lot"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCutting} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-lg text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Select Fabric Lot to Deduct From *
              </label>
              <select
                value={cuttingForm.fabricId}
                onChange={(e) => handleSelectFabricForCutting(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                {fabrics.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.batchLot} — {f.fabricName} ({f.colour}) [Avail: {f.remainingKg} kg]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Cutting Date
              </label>
              <input
                type="date"
                value={cuttingForm.cuttingDate}
                onChange={(e) => setCuttingForm({ ...cuttingForm, cuttingDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Fabric Consumed in Kilograms *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={cuttingForm.fabricConsumedKg}
                onChange={(e) => setCuttingForm({ ...cuttingForm, fabricConsumedKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Total Pieces Cut *
              </label>
              <input
                type="number"
                min="1"
                value={cuttingForm.piecesCut}
                onChange={(e) => setCuttingForm({ ...cuttingForm, piecesCut: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Related Client Order
              </label>
              <select
                value={cuttingForm.relatedOrderId}
                onChange={(e) => handleSelectOrderForCutting(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="">Floor Stock (No Order)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.customerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Size Breakdown */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
            <div className="font-semibold text-neutral-800">Size-wise Quantities Breakdown (Optional)</div>
            <div className="grid grid-cols-5 gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <div key={sz}>
                  <label className="block text-[10px] text-neutral-500 font-bold uppercase">{sz}</label>
                  <input
                    type="number"
                    min="0"
                    value={cuttingForm.sizeBreakdown[sz] || 0}
                    onChange={(e) => {
                      const newBreakdown = { ...cuttingForm.sizeBreakdown, [sz]: Number(e.target.value) };
                      const sumPieces = Object.values(newBreakdown).reduce((a, b) => a + b, 0);
                      setCuttingForm({
                        ...cuttingForm,
                        sizeBreakdown: newBreakdown,
                        piecesCut: sumPieces > 0 ? sumPieces : cuttingForm.piecesCut,
                      });
                    }}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded font-mono text-center bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Cutting Master / Operator
              </label>
              <input
                type="text"
                value={cuttingForm.cutBy}
                onChange={(e) => setCuttingForm({ ...cuttingForm, cutBy: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Cutting Efficiency & Marker Notes
              </label>
              <input
                type="text"
                value={cuttingForm.notes}
                onChange={(e) => setCuttingForm({ ...cuttingForm, notes: e.target.value })}
                placeholder="Marker efficiency, fabric wastage notes"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddCuttingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Cutting & Deduct Fabric
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Cutting Modal */}
      <Modal
        isOpen={isEditCuttingModalOpen}
        onClose={() => setIsEditCuttingModalOpen(false)}
        title="Edit Cutting Record"
        subtitle="Modifications will accurately recalculate and reverse fabric deductions"
      >
        <form onSubmit={handleSaveEditCutting} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-lg text-neutral-900">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Fabric Lot</label>
            <select
              value={cuttingForm.fabricId}
              onChange={(e) => handleSelectFabricForCutting(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
            >
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.batchLot} — {f.fabricName} ({f.colour}) [Avail: {f.remainingKg} kg]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Fabric Consumed (kg)</label>
              <input
                type="number"
                step="0.1"
                value={cuttingForm.fabricConsumedKg}
                onChange={(e) => setCuttingForm({ ...cuttingForm, fabricConsumedKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Pieces Cut</label>
              <input
                type="number"
                value={cuttingForm.piecesCut}
                onChange={(e) => setCuttingForm({ ...cuttingForm, piecesCut: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Notes</label>
            <input
              type="text"
              value={cuttingForm.notes}
              onChange={(e) => setCuttingForm({ ...cuttingForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditCuttingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Cutting Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Fabric Weight Modal */}
      <Modal
        isOpen={isAdjustFabricModalOpen}
        onClose={() => setIsAdjustFabricModalOpen(false)}
        title="Authorized Fabric Weight Adjustment"
        subtitle={`Adjust physical balance for lot ${activeFabric?.batchLot} (${activeFabric?.colour})`}
      >
        <form onSubmit={handleSaveAdjustFabric} className="space-y-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Current Registered Balance:</span>
              <span className="font-mono font-bold text-neutral-900">{activeFabric?.remainingKg} kg</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Fabric Type:</span>
              <span className="text-neutral-800">{activeFabric?.fabricName}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              New Verified Physical Weight (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={adjustFabricData.newRemainingKg}
              onChange={(e) => setAdjustFabricData({ ...adjustFabricData, newRemainingKg: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
              required
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Variance:{' '}
              <span className="font-mono font-bold">
                {Number(adjustFabricData.newRemainingKg) - (activeFabric?.remainingKg || 0) > 0 ? '+' : ''}
                {(Number(adjustFabricData.newRemainingKg) - (activeFabric?.remainingKg || 0)).toFixed(1)} kg
              </span>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Reason for Adjustment *
            </label>
            <input
              type="text"
              value={adjustFabricData.reason}
              onChange={(e) => setAdjustFabricData({ ...adjustFabricData, reason: e.target.value })}
              placeholder="e.g. Physical roll scale calibration, salvage sample deduction"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Authorized In-Charge
            </label>
            <input
              type="text"
              value={adjustFabricData.adjustedBy}
              onChange={(e) => setAdjustFabricData({ ...adjustFabricData, adjustedBy: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAdjustFabricModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Apply Fabric Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Fabric Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirmFabric}
        onClose={() => setDeleteConfirmFabric(null)}
        onConfirm={handleDeleteFabric}
        title="Delete Fabric Batch"
        message={`Are you sure you want to delete fabric batch ${deleteConfirmFabric?.batchLot}?`}
        isDestructive={true}
      />

      {/* Delete Cutting Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirmCutting}
        onClose={() => setDeleteConfirmCutting(null)}
        onConfirm={handleDeleteCutting}
        title="Delete Cutting Record"
        message={`Deleting this cutting transaction will restore ${deleteConfirmCutting?.fabricConsumedKg} kg back to fabric lot ${deleteConfirmCutting?.fabricBatch}. Proceed?`}
        confirmText="Delete & Restore"
        isDestructive={true}
      />
    </div>
  );
};
