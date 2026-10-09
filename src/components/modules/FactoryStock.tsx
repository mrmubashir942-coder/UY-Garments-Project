import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { StockItem, Collection } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatPKR, CURRENCY_SYMBOL } from '../../utils/currency';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Layers,
  History,
} from 'lucide-react';

export const FactoryStock: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currency, setCurrency] = useState(CURRENCY_SYMBOL);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedColour, setSelectedColour] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StockItem | null>(null);

  // Active item for Edit or Adjust
  const [activeItem, setActiveItem] = useState<StockItem | null>(null);

  // Form states
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
    adjustedBy: 'Warehouse In-charge',
  });

  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionCode, setNewCollectionCode] = useState('');

  const loadData = () => {
    setItems(db.getFactoryStock());
    setCollections(db.getCollections());
    setCurrency(db.getSettings().currencySymbol || CURRENCY_SYMBOL);
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colour.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.size.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollection =
      selectedCollection === 'all' || item.collection.toLowerCase() === selectedCollection.toLowerCase();

    const matchesColour =
      selectedColour === 'all' || item.colour.toLowerCase() === selectedColour.toLowerCase();

    const matchesSize =
      selectedSize === 'all' || item.size.toLowerCase() === selectedSize.toLowerCase();

    return matchesSearch && matchesCollection && matchesColour && matchesSize;
  });

  // Extract unique colours and sizes for filters
  const uniqueColours = Array.from(new Set(items.map((i) => i.colour))).filter(Boolean);
  const uniqueSizes = Array.from(new Set(items.map((i) => i.size))).filter(Boolean);

  const totalPieces = filteredItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalCostValue = filteredItems.reduce((acc, i) => acc + i.quantity * i.costPrice, 0);
  const totalRetailValue = filteredItems.reduce((acc, i) => acc + i.quantity * i.sellingPrice, 0);

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
      reason: 'Physical cycle count adjustment',
      adjustedBy: 'Warehouse Manager',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.collection || !formData.productName || !formData.colour || !formData.size) {
      alert('Please fill in collection, article name, colour and size.');
      return;
    }

    db.addFactoryStock(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    db.updateFactoryStock(activeItem.id, formData);
    setIsEditModalOpen(false);
    setActiveItem(null);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    db.adjustFactoryStock(activeItem.id, Number(adjustData.newQty), adjustData.reason, adjustData.adjustedBy);
    setIsAdjustModalOpen(false);
    setActiveItem(null);
  };

  const handleDelete = () => {
    if (deleteConfirmItem) {
      db.deleteFactoryStock(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    }
  };

  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    db.addCollection({
      name: newCollectionName.trim(),
      code: newCollectionCode.trim().toUpperCase() || newCollectionName.substring(0, 3).toUpperCase(),
      isCustom: true,
    });
    setNewCollectionName('');
    setNewCollectionCode('');
  };

  const stockAdjustments = db['state']?.stockAdjustments?.filter((a) => a.location === 'factory') || [];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Factory Garments Stock
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Finished apparel inventory stored at primary manufacturing facility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Layers}
            onClick={() => setIsCollectionModalOpen(true)}
          >
            Manage Collections
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={History}
            onClick={() => setIsHistoryModalOpen(true)}
          >
            Adjustment History
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            + Add Stock Record
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Finished Units
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            {totalPieces.toLocaleString()} <span className="text-xs font-normal text-neutral-500">pieces</span>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Cost Valuation
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {formatPKR(totalCostValue)}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Wholesale / Retail Valuation
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {formatPKR(totalRetailValue)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by article name, SKU, colour, size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            >
              <option value="all">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedColour}
              onChange={(e) => setSelectedColour(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            >
              <option value="all">All Colours</option>
              {uniqueColours.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>

            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            >
              <option value="all">All Sizes</option>
              {uniqueSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {(searchQuery || selectedCollection !== 'all' || selectedColour !== 'all' || selectedSize !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCollection('all');
                  setSelectedColour('all');
                  setSelectedSize('all');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline px-2 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Collection</th>
                <th className="py-3 px-4">Article / Name</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4 text-center">Colour</th>
                <th className="py-3 px-4 text-center">Size</th>
                <th className="py-3 px-4 text-right">Stock Qty</th>
                <th className="py-3 px-4 text-right">Cost ({currency})</th>
                <th className="py-3 px-4 text-right">Wholesale ({currency})</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500">
                    No factory stock records match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">{item.collection}</td>
                    <td className="py-3 px-4 font-medium text-neutral-950">
                      <div>{item.productName}</div>
                      {item.notes && <div className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-xs">{item.notes}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{item.sku}</td>
                    <td className="py-3 px-4 text-center text-neutral-700">{item.colour}</td>
                    <td className="py-3 px-4 text-center font-bold text-neutral-900">{item.size}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                      <span className={item.quantity < 100 ? 'text-neutral-950 underline decoration-neutral-400 font-black' : ''}>
                        {item.quantity.toLocaleString()} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-600">
                      {formatPKR(item.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-900">
                      {formatPKR(item.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                      {formatPKR(item.quantity * item.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Stock Adjustment"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Delete Record"
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

      {/* Add Stock Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Factory Stock Variant"
        subtitle="Record finished garments directly into factory inventory"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Collection *
              </label>
              <select
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Article / Product Name *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g. Heavyweight Crewneck Tee"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                SKU / Article Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="UY-TSH-BLK-M"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Colour *
              </label>
              <input
                type="text"
                value={formData.colour}
                onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                placeholder="e.g. Jet Black, Navy Blue, White"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Size *
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. S, M, L, XL, Free Size"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Quantity *
              </label>
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
              <label className="block font-semibold text-neutral-700 mb-1">
                Cost Price ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Selling Price ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Receipt Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pieces, dozens"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Batch Notes & Inspection Ref
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Lot # A-44, inspected and packed in polybags."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Stock Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Stock Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Stock Record"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Collection</label>
              <select
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
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
              <label className="block font-semibold text-neutral-700 mb-1">Selling ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment"
        subtitle={`Adjust physical quantity for ${activeItem?.productName} (${activeItem?.colour}, ${activeItem?.size})`}
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Current Registered Stock:</span>
              <span className="font-mono font-bold text-neutral-900">{activeItem?.quantity} {activeItem?.unit}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>SKU:</span>
              <span className="font-mono text-neutral-800">{activeItem?.sku}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              New Physical Count Quantity *
            </label>
            <input
              type="number"
              min="0"
              value={adjustData.newQty}
              onChange={(e) => setAdjustData({ ...adjustData, newQty: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
              required
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Difference:{' '}
              <span className="font-mono font-bold">
                {Number(adjustData.newQty) - (activeItem?.quantity || 0) > 0 ? '+' : ''}
                {Number(adjustData.newQty) - (activeItem?.quantity || 0)} pieces
              </span>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Reason for Adjustment *
            </label>
            <input
              type="text"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Physical inventory count variance, sample dispatch"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Authorized By
            </label>
            <input
              type="text"
              value={adjustData.adjustedBy}
              onChange={(e) => setAdjustData({ ...adjustData, adjustedBy: e.target.value })}
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

      {/* Manage Collections Modal */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        title="Manage Collections"
        subtitle="Default collections: T-Shirt, Polo, Drop Shoulder, Hoodie, Zipper, Sweatshirt, Cap"
      >
        <div className="space-y-4 text-xs">
          <form onSubmit={handleAddCollection} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="font-semibold text-neutral-800">Add Custom Collection</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Collection Name (e.g. Tank Top)"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              />
              <input
                type="text"
                placeholder="Prefix / Code (e.g. TNK)"
                value={newCollectionCode}
                onChange={(e) => setNewCollectionCode(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white uppercase font-mono"
              />
            </div>
            <Button variant="primary" size="sm" type="submit">
              + Add Collection
            </Button>
          </form>

          <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto">
            {collections.map((col) => (
              <div key={col.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900">{col.name}</span>
                  <span className="ml-2 font-mono text-[11px] text-neutral-400">({col.code})</span>
                  {col.isCustom && (
                    <span className="ml-2 text-[10px] text-neutral-500 uppercase tracking-wider">Custom</span>
                  )}
                </div>
                {col.isCustom && (
                  <button
                    onClick={() => db.deleteCollection(col.id)}
                    className="text-neutral-400 hover:text-neutral-900 p-1"
                    title="Delete Custom Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Stock Adjustment History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Stock Adjustment Log"
        maxWidth="2xl"
      >
        <div className="space-y-3 text-xs">
          {stockAdjustments.length === 0 ? (
            <p className="py-8 text-center text-neutral-500">No stock adjustments recorded yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {stockAdjustments.map((adj) => (
                <div key={adj.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="font-mono font-bold text-neutral-900">{adj.sku}</div>
                    <div className="text-neutral-600 mt-0.5">Reason: {adj.reason}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Adjusted by {adj.adjustedBy} on {adj.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">
                      {adj.previousQty} → <span className="font-bold text-neutral-950">{adj.newQty}</span>
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">
                      Diff: {adj.difference > 0 ? `+${adj.difference}` : adj.difference}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        onConfirm={handleDelete}
        title="Delete Stock Record"
        message={`Are you sure you want to permanently remove "${deleteConfirmItem?.productName} (${deleteConfirmItem?.colour}, ${deleteConfirmItem?.size})"?`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};
