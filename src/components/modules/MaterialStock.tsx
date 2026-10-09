import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { MaterialItem, MaterialCategory, MaterialUsage } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Plus,
  Boxes,
  MinusCircle,
  Search,
  Filter,
  Trash2,
  Edit2,
  History,
  AlertCircle,
} from 'lucide-react';

export const MaterialStock: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [usages, setUsages] = useState<MaterialUsage[]>([]);
  const [currency, setCurrency] = useState('$');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [isUsageLogModalOpen, setIsUsageLogModalOpen] = useState(false);
  const [deleteConfirmMaterial, setDeleteConfirmMaterial] = useState<MaterialItem | null>(null);

  // Active item
  const [activeMaterial, setActiveMaterial] = useState<MaterialItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    category: 'buttons' as MaterialCategory,
    name: '',
    colour: '',
    size: '',
    unit: 'pieces',
    openingStock: 0,
    stockReceived: 0,
    stockUsed: 0,
    costPerUnit: 0,
    supplier: '',
    dateReceived: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [usageData, setUsageData] = useState({
    quantityUsed: 0,
    purposeOrOrder: '',
    recordedBy: 'Floor Supervisor',
    notes: '',
  });

  const [usageError, setUsageError] = useState<string | null>(null);

  const loadData = () => {
    setMaterials(db.getMaterialStock());
    setUsages(db.getMaterialUsages());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const categories: { id: MaterialCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Trims & Materials' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'thread', label: 'Thread' },
    { id: 'packing', label: 'Packing' },
    { id: 'fusing', label: 'Fusing & Interlining' },
    { id: 'other', label: 'Other Materials' },
  ];

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.colour && m.colour.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalRemainingUnits = filteredMaterials.reduce((acc, m) => acc + m.remainingStock, 0);
  const totalMaterialValuation = filteredMaterials.reduce((acc, m) => acc + m.remainingStock * m.costPerUnit, 0);

  const handleOpenAdd = () => {
    setFormData({
      category: 'buttons',
      name: '',
      colour: '',
      size: '',
      unit: 'pieces',
      openingStock: 0,
      stockReceived: 0,
      stockUsed: 0,
      costPerUnit: 0,
      supplier: '',
      dateReceived: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: MaterialItem) => {
    setActiveMaterial(item);
    setFormData({
      category: item.category,
      name: item.name,
      colour: item.colour || '',
      size: item.size || '',
      unit: item.unit,
      openingStock: item.openingStock,
      stockReceived: item.stockReceived,
      stockUsed: item.stockUsed,
      costPerUnit: item.costPerUnit,
      supplier: item.supplier || '',
      dateReceived: item.dateReceived,
      notes: item.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenUse = (item: MaterialItem) => {
    setActiveMaterial(item);
    setUsageData({
      quantityUsed: 0,
      purposeOrOrder: 'Line Stitching Batch',
      recordedBy: 'Floor Supervisor',
      notes: '',
    });
    setUsageError(null);
    setIsUseModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter material name');
      return;
    }

    db.addMaterialStock(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaterial) return;

    db.updateMaterialStock(activeMaterial.id, formData);
    setIsEditModalOpen(false);
    setActiveMaterial(null);
  };

  const handleSaveUse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaterial) return;
    setUsageError(null);

    if (usageData.quantityUsed <= 0) {
      setUsageError('Quantity used must be greater than zero.');
      return;
    }

    try {
      db.recordMaterialUsage({
        materialId: activeMaterial.id,
        materialName: activeMaterial.name,
        category: activeMaterial.category,
        quantityUsed: Number(usageData.quantityUsed),
        date: new Date().toISOString().split('T')[0],
        purposeOrOrder: usageData.purposeOrOrder,
        recordedBy: usageData.recordedBy,
        notes: usageData.notes,
      });
      setIsUseModalOpen(false);
      setActiveMaterial(null);
    } catch (err: any) {
      setUsageError(err.message || 'Error recording material usage.');
    }
  };

  const handleDelete = () => {
    if (deleteConfirmMaterial) {
      db.deleteMaterialStock(deleteConfirmMaterial.id);
      setDeleteConfirmMaterial(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Material & Trims Inventory
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Buttons, threads, poly-bags, cartons, fusing interfacing, and accessories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={History}
            onClick={() => setIsUsageLogModalOpen(true)}
          >
            Material Usage Log
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            + Add Material / Trim
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Material Items Tracked
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            {filteredMaterials.length} <span className="text-xs font-normal text-neutral-500">specifications</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Remaining Stock Units
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalRemainingUnits.toLocaleString()} <span className="text-xs font-normal text-neutral-500">units</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Material Valuation
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalMaterialValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by material name, colour, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-100 rounded-lg shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Material Specification</th>
                <th className="py-3 px-4 text-center">Colour</th>
                <th className="py-3 px-4 text-center">Size / Width</th>
                <th className="py-3 px-4 text-right">Opening</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">Used</th>
                <th className="py-3 px-4 text-right">Remaining Stock</th>
                <th className="py-3 px-4 text-right">Cost / Unit</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500">
                    No material records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold capitalize text-neutral-900">{m.category}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-950">{m.name}</div>
                      {m.supplier && <div className="text-[10px] text-neutral-400 mt-0.5 truncate">{m.supplier}</div>}
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-700">{m.colour || '—'}</td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-800">{m.size || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-500">
                      {m.openingStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-600">
                      +{m.stockReceived.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-600">
                      -{m.stockUsed.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-neutral-950">
                      {m.remainingStock.toLocaleString()} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-800">
                      {currency}{m.costPerUnit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenUse(m)}
                          className="px-2 py-1 bg-neutral-900 text-white rounded text-[11px] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Record Consumption"
                        >
                          Record Usage
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmMaterial(m)}
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

      {/* Add Material Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Material or Accessory"
        subtitle="Track buttons, thread, packing, and fusible materials"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Material Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                <option value="buttons">Buttons</option>
                <option value="thread">Thread</option>
                <option value="packing">Packing Materials</option>
                <option value="fusing">Fusing & Interlining</option>
                <option value="other">Other Accessories / Custom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Material Specification / Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 4-Hole Engraved Horn Button"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Colour
              </label>
              <input
                type="text"
                value={formData.colour}
                onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                placeholder="e.g. Dark Tortoise, White"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Size / Width / Spec
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 18L (11.5mm) / 5000m cone"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Unit of Measure *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pieces, kg, cones, rolls"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Opening Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.openingStock}
                onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Stock Received
              </label>
              <input
                type="number"
                min="0"
                value={formData.stockReceived}
                onChange={(e) => setFormData({ ...formData, stockReceived: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Cost per Unit ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Supplier / Vendor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Accessories Supplier"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={formData.dateReceived}
                onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Material Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Material"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block font-semibold text-neutral-700 mb-1">Size / Width</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Opening</label>
              <input
                type="number"
                value={formData.openingStock}
                onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Received</label>
              <input
                type="number"
                value={formData.stockReceived}
                onChange={(e) => setFormData({ ...formData, stockReceived: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Used</label>
              <input
                type="number"
                value={formData.stockUsed}
                onChange={(e) => setFormData({ ...formData, stockUsed: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Usage Modal */}
      <Modal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="Record Material Consumption"
        subtitle={`Deduct consumed quantity of ${activeMaterial?.name}`}
      >
        <form onSubmit={handleSaveUse} className="space-y-4 text-xs">
          {usageError && (
            <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-lg text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>{usageError}</span>
            </div>
          )}

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between">
            <span className="text-neutral-600">Currently in Stock:</span>
            <span className="font-mono font-bold text-neutral-950">
              {activeMaterial?.remainingStock} {activeMaterial?.unit}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Quantity Consumed *
            </label>
            <input
              type="number"
              min="1"
              max={activeMaterial?.remainingStock}
              value={usageData.quantityUsed}
              onChange={(e) => setUsageData({ ...usageData, quantityUsed: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Purpose / Floor Order *
            </label>
            <input
              type="text"
              value={usageData.purposeOrOrder}
              onChange={(e) => setUsageData({ ...usageData, purposeOrOrder: e.target.value })}
              placeholder="e.g. Polo Batch # 104 collar buttons"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Recorded By
            </label>
            <input
              type="text"
              value={usageData.recordedBy}
              onChange={(e) => setUsageData({ ...usageData, recordedBy: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsUseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Material Deduction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Usage Log Modal */}
      <Modal
        isOpen={isUsageLogModalOpen}
        onClose={() => setIsUsageLogModalOpen(false)}
        title="Material Consumption History"
        maxWidth="2xl"
      >
        <div className="space-y-3 text-xs">
          {usages.length === 0 ? (
            <p className="py-8 text-center text-neutral-500">No material usage recorded yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {usages.map((u) => (
                <div key={u.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-neutral-900">{u.materialName}</div>
                    <div className="text-neutral-600 mt-0.5">Purpose: {u.purposeOrOrder}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Recorded by {u.recordedBy} on {u.date}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-neutral-950">
                    -{u.quantityUsed}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmMaterial}
        onClose={() => setDeleteConfirmMaterial(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Are you sure you want to delete ${deleteConfirmMaterial?.name}?`}
        isDestructive={true}
      />
    </div>
  );
};
