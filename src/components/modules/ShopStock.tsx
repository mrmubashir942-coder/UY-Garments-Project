import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { StockItem, StockTransfer, Collection } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Plus,
  ArrowRightLeft,
  Store,
  Search,
  SlidersHorizontal,
  History,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';

export const ShopStock: React.FC = () => {
  const [shopItems, setShopItems] = useState<StockItem[]>([]);
  const [factoryItems, setFactoryItems] = useState<StockItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currency, setCurrency] = useState('$');

  const [activeTab, setActiveTab] = useState<'shop-items' | 'transfer-history'>('shop-items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StockItem | null>(null);

  const [activeItem, setActiveItem] = useState<StockItem | null>(null);

  // Transfer form
  const [selectedTransferItemId, setSelectedTransferItemId] = useState<string>('');
  const [transferForm, setTransferForm] = useState({
    sourceLocation: 'Factory' as 'Factory' | 'Shop',
    destinationLocation: 'Shop' as 'Shop' | 'Factory',
    collection: '',
    productName: '',
    colour: '',
    size: '',
    quantity: 0,
    transferDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    performedBy: 'Factory Manager - Asif Khan',
  });

  const [transferError, setTransferError] = useState<string | null>(null);

  // Form states for manual shop entry
  const [formData, setFormData] = useState({
    collection: '',
    productName: '',
    sku: '',
    colour: '',
    size: '',
    quantity: 0,
    unit: 'pieces',
    costPrice: 0,
    sellingPrice: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [adjustData, setAdjustData] = useState({
    newQty: 0,
    reason: '',
    adjustedBy: 'Store Manager',
  });

  const loadData = () => {
    setShopItems(db.getShopStock());
    setFactoryItems(db.getFactoryStock());
    setTransfers(db.getStockTransfers());
    setCollections(db.getCollections());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const filteredShopItems = shopItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colour.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.size.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollection =
      selectedCollection === 'all' || item.collection.toLowerCase() === selectedCollection.toLowerCase();

    return matchesSearch && matchesCollection;
  });

  const totalShopUnits = filteredShopItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalShopRetailValuation = filteredShopItems.reduce((acc, i) => acc + i.quantity * i.sellingPrice, 0);

  const handleOpenAdd = () => {
    setFormData({
      collection: collections[0]?.name || '',
      productName: '',
      sku: '',
      colour: '',
      size: '',
      quantity: 0,
      unit: 'pieces',
      costPrice: 0,
      sellingPrice: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setActiveItem(item);
    setFormData({
      collection: item.collection,
      productName: item.productName,
      sku: item.sku,
      colour: item.colour,
      size: item.size,
      quantity: item.quantity,
      unit: item.unit,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      date: item.date,
      notes: item.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAdjust = (item: StockItem) => {
    setActiveItem(item);
    setAdjustData({
      newQty: item.quantity,
      reason: 'Physical display recount',
      adjustedBy: 'Store Supervisor',
    });
    setIsAdjustModalOpen(true);
  };

  const handleOpenTransfer = () => {
    setTransferError(null);
    const firstFactory = factoryItems.find((f) => f.quantity > 0) || factoryItems[0];
    setSelectedTransferItemId(firstFactory?.id || '');
    setTransferForm({
      sourceLocation: 'Factory',
      destinationLocation: 'Shop',
      collection: firstFactory?.collection || collections[0]?.name || 'T-Shirt',
      productName: firstFactory?.productName || '',
      colour: firstFactory?.colour || '',
      size: firstFactory?.size || '',
      quantity: 10,
      transferDate: new Date().toISOString().split('T')[0],
      reference: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: 'Store replenishment transfer',
      performedBy: 'Factory Manager - Asif Khan',
    });
    setIsTransferModalOpen(true);
  };

  const handleSelectFactoryItemForTransfer = (selectedId: string) => {
    setSelectedTransferItemId(selectedId);
    const item = factoryItems.find((f) => f.id === selectedId);
    if (item) {
      setTransferForm({
        ...transferForm,
        collection: item.collection,
        productName: item.productName,
        colour: item.colour,
        size: item.size,
      });
    }
  };

  const handleSelectShopItemForTransfer = (selectedId: string) => {
    setSelectedTransferItemId(selectedId);
    const item = shopItems.find((s) => s.id === selectedId);
    if (item) {
      setTransferForm({
        ...transferForm,
        collection: item.collection,
        productName: item.productName,
        colour: item.colour,
        size: item.size,
      });
    }
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (transferForm.quantity <= 0) {
      setTransferError('Transfer quantity must be greater than zero.');
      return;
    }

    try {
      db.transferStock(transferForm);
      setIsTransferModalOpen(false);
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed.');
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    db.addShopStock(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    db.updateShopStock(activeItem.id, formData);
    setIsEditModalOpen(false);
    setActiveItem(null);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    db.adjustShopStock(activeItem.id, Number(adjustData.newQty), adjustData.reason, adjustData.adjustedBy);
    setIsAdjustModalOpen(false);
    setActiveItem(null);
  };

  const handleDelete = () => {
    if (deleteConfirmItem) {
      db.deleteShopStock(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Shop Stock & Inter-Location Transfers
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Retail showroom inventory and atomic stock transfers between Factory and Retail Shop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={ArrowRightLeft}
            onClick={handleOpenTransfer}
          >
            + Transfer Stock (Factory ↔ Shop)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            + Manual Shop Entry
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Units on Display & Racks
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            {totalShopUnits.toLocaleString()} <span className="text-xs font-normal text-neutral-500">pieces</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Retail Showroom Valuation
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalShopRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Transfers Recorded
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {transfers.length} <span className="text-xs font-normal text-neutral-500">consignments</span>
          </div>
        </div>
      </div>

      {/* Tab Controls & Search */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('shop-items')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'shop-items'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Shop Inventory ({shopItems.length})
            </button>
            <button
              onClick={() => setActiveTab('transfer-history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'transfer-history'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Transfer History ({transfers.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search shop variants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            >
              <option value="all">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab 1: Shop Inventory Table */}
      {activeTab === 'shop-items' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Collection</th>
                  <th className="py-3 px-4">Article Name</th>
                  <th className="py-3 px-4">Shop SKU</th>
                  <th className="py-3 px-4 text-center">Colour</th>
                  <th className="py-3 px-4 text-center">Size</th>
                  <th className="py-3 px-4 text-right">Showroom Stock</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Retail Price</th>
                  <th className="py-3 px-4 text-right">Total Retail Value</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredShopItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-500">
                      No stock variants found in shop showroom.
                    </td>
                  </tr>
                ) : (
                  filteredShopItems.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-neutral-900">{item.collection}</td>
                      <td className="py-3 px-4 font-medium text-neutral-950">{item.productName}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{item.sku}</td>
                      <td className="py-3 px-4 text-center text-neutral-800">{item.colour}</td>
                      <td className="py-3 px-4 text-center font-bold text-neutral-900">{item.size}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                        {item.quantity.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">
                        {currency}{item.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {currency}{item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {currency}{(item.quantity * item.sellingPrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Recount Adjustment"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Delete"
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

      {/* Tab 2: Transfer History */}
      {activeTab === 'transfer-history' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Transfer #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4 text-center">Colour</th>
                  <th className="py-3 px-4 text-center">Size</th>
                  <th className="py-3 px-4 text-right">Qty Moved</th>
                  <th className="py-3 px-4">Reference & Gate Pass</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      No stock transfers recorded yet.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{t.transferNumber}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{t.transferDate}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        {t.sourceLocation} → {t.destinationLocation}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-950">{t.productName}</div>
                        <div className="text-[10px] text-neutral-400">{t.collection}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-800">{t.colour}</td>
                      <td className="py-3 px-4 text-center font-bold text-neutral-900">{t.size}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-neutral-950">
                        {t.quantity.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        <div>{t.reference || 'N/A'}</div>
                        {t.notes && <div className="text-[10px] text-neutral-400 mt-0.5">{t.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{t.performedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal (Atomic Source to Destination) */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Atomic Stock Transfer"
        subtitle="Safely move finished garments between Factory and Shop with zero discrepancies"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4 text-xs">
          {transferError && (
            <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-lg text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>{transferError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Source Location *</label>
              <select
                value={transferForm.sourceLocation}
                onChange={(e) => {
                  const src = e.target.value as 'Factory' | 'Shop';
                  const nextList = src === 'Factory' ? factoryItems : shopItems;
                  const firstItem = nextList.find((i) => i.quantity > 0) || nextList[0];
                  setSelectedTransferItemId(firstItem?.id || '');
                  setTransferForm({
                    ...transferForm,
                    sourceLocation: src,
                    destinationLocation: src === 'Factory' ? 'Shop' : 'Factory',
                    collection: firstItem?.collection || transferForm.collection,
                    productName: firstItem?.productName || '',
                    colour: firstItem?.colour || '',
                    size: firstItem?.size || '',
                  });
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white font-bold"
              >
                <option value="Factory">Factory Warehouse</option>
                <option value="Shop">Retail Showroom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Destination Location</label>
              <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-100 font-bold text-neutral-800">
                {transferForm.destinationLocation === 'Shop' ? 'Retail Showroom (Shop)' : 'Factory Warehouse'}
              </div>
            </div>
          </div>

          {/* Quick select item from source */}
          {transferForm.sourceLocation === 'Factory' ? (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Select Available Article from Factory Warehouse *
              </label>
              <select
                value={selectedTransferItemId}
                onChange={(e) => handleSelectFactoryItemForTransfer(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="">-- Choose Article from Factory --</option>
                {factoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.productName} — {item.colour} ({item.size}) [Stock: {item.quantity} pcs]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Select Available Article from Retail Showroom (Shop) *
              </label>
              <select
                value={selectedTransferItemId}
                onChange={(e) => handleSelectShopItemForTransfer(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="">-- Choose Article from Shop Showroom --</option>
                {shopItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.productName} — {item.colour} ({item.size}) [Stock: {item.quantity} pcs]
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Collection</label>
              <input
                type="text"
                value={transferForm.collection}
                onChange={(e) => setTransferForm({ ...transferForm, collection: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Article</label>
              <input
                type="text"
                value={transferForm.productName}
                onChange={(e) => setTransferForm({ ...transferForm, productName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Colour</label>
              <input
                type="text"
                value={transferForm.colour}
                onChange={(e) => setTransferForm({ ...transferForm, colour: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Size</label>
              <input
                type="text"
                value={transferForm.size}
                onChange={(e) => setTransferForm({ ...transferForm, size: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Quantity to Move *</label>
              <input
                type="number"
                min="1"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Transfer Date</label>
              <input
                type="date"
                value={transferForm.transferDate}
                onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Delivery Challan / Ref</label>
              <input
                type="text"
                value={transferForm.reference}
                onChange={(e) => setTransferForm({ ...transferForm, reference: e.target.value })}
                placeholder="e.g. DC-9982"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Authorized In-Charge</label>
              <input
                type="text"
                value={transferForm.performedBy}
                onChange={(e) => setTransferForm({ ...transferForm, performedBy: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Notes / Driver Details</label>
              <input
                type="text"
                value={transferForm.notes}
                onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                placeholder="Dispatched via delivery van # 4"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm & Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Add Shop Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Shop Stock Variant"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block font-semibold text-neutral-700 mb-1">Article Name</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Colour</label>
              <input
                type="text"
                value={formData.colour}
                onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Cost ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Retail ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Shop Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Shop Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Shop Stock"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Article</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Retail ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Shop Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Shop Stock Adjustment"
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex justify-between text-neutral-600">
              <span>Current Stock:</span>
              <span className="font-mono font-bold text-neutral-900">{activeItem?.quantity} pcs</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">New Physical Quantity *</label>
            <input
              type="number"
              min="0"
              value={adjustData.newQty}
              onChange={(e) => setAdjustData({ ...adjustData, newQty: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Reason *</label>
            <input
              type="text"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        onConfirm={handleDelete}
        title="Delete Shop Stock"
        message={`Are you sure you want to remove ${deleteConfirmItem?.productName}?`}
        isDestructive={true}
      />
    </div>
  );
};
