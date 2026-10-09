import {
  Collection,
  StockItem,
  StockAdjustment,
  FabricItem,
  CuttingRecord,
  MaterialItem,
  MaterialUsage,
  StockTransfer,
  ProductionRecord,
  Customer,
  Order,
  Invoice,
  DispatchRecord,
  PaymentRecord,
  ExpenseRecord,
  Employee,
  SalaryRecord,
  CompanySettings,
  SalaryPaymentItem,
} from '../types';
import {
  INITIAL_COLLECTIONS,
  INITIAL_FACTORY_STOCK,
  INITIAL_FABRIC_STOCK,
  INITIAL_CUTTING_RECORDS,
  INITIAL_MATERIAL_STOCK,
  INITIAL_SHOP_STOCK,
  INITIAL_TRANSFERS,
  INITIAL_PRODUCTION_RECORDS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
  INITIAL_DISPATCHES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_EMPLOYEES,
  INITIAL_SALARY_RECORDS,
  INITIAL_SETTINGS,
} from './seedData';

const DB_KEY = 'uy_garments_app_db_v1';

const tagDemo = <T extends object>(items: T[]): T[] =>
  items.map((i) => ({ ...i, isDemo: true }));

export interface DatabaseState {
  collections: Collection[];
  factoryStock: StockItem[];
  shopStock: StockItem[];
  stockAdjustments: StockAdjustment[];
  fabricStock: FabricItem[];
  cuttingRecords: CuttingRecord[];
  materialStock: MaterialItem[];
  materialUsages: MaterialUsage[];
  stockTransfers: StockTransfer[];
  productionRecords: ProductionRecord[];
  customers: Customer[];
  orders: Order[];
  invoices: Invoice[];
  dispatches: DispatchRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  salaryRecords: SalaryRecord[];
  settings: CompanySettings;
}

class DatabaseService {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadDatabase();
  }

  private loadDatabase(): DatabaseState {
    try {
      const data = localStorage.getItem(DB_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Partial<DatabaseState>;
        return {
          collections: parsed.collections || INITIAL_COLLECTIONS,
          factoryStock: parsed.factoryStock || tagDemo(INITIAL_FACTORY_STOCK),
          shopStock: parsed.shopStock || tagDemo(INITIAL_SHOP_STOCK),
          stockAdjustments: parsed.stockAdjustments || [],
          fabricStock: parsed.fabricStock || tagDemo(INITIAL_FABRIC_STOCK),
          cuttingRecords: parsed.cuttingRecords || tagDemo(INITIAL_CUTTING_RECORDS),
          materialStock: parsed.materialStock || tagDemo(INITIAL_MATERIAL_STOCK),
          materialUsages: parsed.materialUsages || [],
          stockTransfers: parsed.stockTransfers || tagDemo(INITIAL_TRANSFERS),
          productionRecords: parsed.productionRecords || tagDemo(INITIAL_PRODUCTION_RECORDS),
          customers: parsed.customers || tagDemo(INITIAL_CUSTOMERS),
          orders: parsed.orders || tagDemo(INITIAL_ORDERS),
          invoices: parsed.invoices || tagDemo(INITIAL_INVOICES),
          dispatches: parsed.dispatches || tagDemo(INITIAL_DISPATCHES),
          payments: parsed.payments || tagDemo(INITIAL_PAYMENTS),
          expenses: parsed.expenses || tagDemo(INITIAL_EXPENSES),
          employees: parsed.employees || tagDemo(INITIAL_EMPLOYEES),
          salaryRecords: parsed.salaryRecords || tagDemo(INITIAL_SALARY_RECORDS),
          settings: parsed.settings || INITIAL_SETTINGS,
        };
      }
    } catch (e) {
      console.error('Failed to parse database from localStorage:', e);
    }

    const defaultState: DatabaseState = {
      collections: INITIAL_COLLECTIONS,
      factoryStock: tagDemo(INITIAL_FACTORY_STOCK),
      shopStock: tagDemo(INITIAL_SHOP_STOCK),
      stockAdjustments: [],
      fabricStock: tagDemo(INITIAL_FABRIC_STOCK),
      cuttingRecords: tagDemo(INITIAL_CUTTING_RECORDS),
      materialStock: tagDemo(INITIAL_MATERIAL_STOCK),
      materialUsages: [],
      stockTransfers: tagDemo(INITIAL_TRANSFERS),
      productionRecords: tagDemo(INITIAL_PRODUCTION_RECORDS),
      customers: tagDemo(INITIAL_CUSTOMERS),
      orders: tagDemo(INITIAL_ORDERS),
      invoices: tagDemo(INITIAL_INVOICES),
      dispatches: tagDemo(INITIAL_DISPATCHES),
      payments: tagDemo(INITIAL_PAYMENTS),
      expenses: tagDemo(INITIAL_EXPENSES),
      employees: tagDemo(INITIAL_EMPLOYEES),
      salaryRecords: tagDemo(INITIAL_SALARY_RECORDS),
      settings: INITIAL_SETTINGS,
    };
    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: DatabaseState): void {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state));
      this.state = state;
      this.notify();
    } catch (e) {
      console.error('Failed to save database state to localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  // Backup, Restore & Reset
  public exportData(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseState;
      if (!parsed.collections || !parsed.factoryStock || !parsed.orders) {
        throw new Error('Invalid database format');
      }
      this.saveState(parsed);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  public resetToDefaults(): void {
    const defaultState: DatabaseState = {
      collections: INITIAL_COLLECTIONS,
      factoryStock: tagDemo(INITIAL_FACTORY_STOCK),
      shopStock: tagDemo(INITIAL_SHOP_STOCK),
      stockAdjustments: [],
      fabricStock: tagDemo(INITIAL_FABRIC_STOCK),
      cuttingRecords: tagDemo(INITIAL_CUTTING_RECORDS),
      materialStock: tagDemo(INITIAL_MATERIAL_STOCK),
      materialUsages: [],
      stockTransfers: tagDemo(INITIAL_TRANSFERS),
      productionRecords: tagDemo(INITIAL_PRODUCTION_RECORDS),
      customers: tagDemo(INITIAL_CUSTOMERS),
      orders: tagDemo(INITIAL_ORDERS),
      invoices: tagDemo(INITIAL_INVOICES),
      dispatches: tagDemo(INITIAL_DISPATCHES),
      payments: tagDemo(INITIAL_PAYMENTS),
      expenses: tagDemo(INITIAL_EXPENSES),
      employees: tagDemo(INITIAL_EMPLOYEES),
      salaryRecords: tagDemo(INITIAL_SALARY_RECORDS),
      settings: INITIAL_SETTINGS,
    };
    this.saveState(defaultState);
  }

  /**
   * Purges all sample/demo records while preserving system collections and company settings.
   * This allows garments factory staff to operate with 100% clean, verified business data.
   */
  public clearDemoData(): void {
    const isNotDemo = (item: { isDemo?: boolean }) => !item.isDemo;

    this.saveState({
      ...this.state,
      factoryStock: this.state.factoryStock.filter(isNotDemo),
      shopStock: this.state.shopStock.filter(isNotDemo),
      stockAdjustments: [],
      fabricStock: this.state.fabricStock.filter(isNotDemo),
      cuttingRecords: this.state.cuttingRecords.filter(isNotDemo),
      materialStock: this.state.materialStock.filter(isNotDemo),
      materialUsages: [],
      stockTransfers: this.state.stockTransfers.filter(isNotDemo),
      productionRecords: this.state.productionRecords.filter(isNotDemo),
      customers: this.state.customers.filter(isNotDemo),
      orders: this.state.orders.filter(isNotDemo),
      invoices: this.state.invoices.filter(isNotDemo),
      dispatches: this.state.dispatches.filter(isNotDemo),
      payments: this.state.payments.filter(isNotDemo),
      expenses: this.state.expenses.filter(isNotDemo),
      employees: this.state.employees.filter(isNotDemo),
      salaryRecords: this.state.salaryRecords.filter(isNotDemo),
    });
  }

  public reloadDemoData(): void {
    this.resetToDefaults();
  }

  public getDemoStatus(): { hasDemoData: boolean; demoCount: number; realCount: number } {
    let demoCount = 0;
    let realCount = 0;
    const checkItem = (item: { isDemo?: boolean }) => {
      if (item.isDemo) demoCount++;
      else realCount++;
    };

    this.state.factoryStock.forEach(checkItem);
    this.state.fabricStock.forEach(checkItem);
    this.state.materialStock.forEach(checkItem);
    this.state.shopStock.forEach(checkItem);
    this.state.orders.forEach(checkItem);
    this.state.payments.forEach(checkItem);
    this.state.expenses.forEach(checkItem);
    this.state.employees.forEach(checkItem);

    return {
      hasDemoData: demoCount > 0,
      demoCount,
      realCount,
    };
  }

  // ---------------- Settings ----------------
  public getSettings(): CompanySettings {
    return { ...this.state.settings };
  }

  public updateSettings(updates: Partial<CompanySettings>): void {
    this.saveState({
      ...this.state,
      settings: { ...this.state.settings, ...updates },
    });
  }

  // ---------------- Collections ----------------
  public getCollections(): Collection[] {
    return [...this.state.collections];
  }

  public addCollection(collection: Omit<Collection, 'id'>): Collection {
    const newCol: Collection = {
      ...collection,
      id: `col-${Date.now()}`,
    };
    this.saveState({
      ...this.state,
      collections: [...this.state.collections, newCol],
    });
    return newCol;
  }

  public updateCollection(id: string, updates: Partial<Collection>): void {
    this.saveState({
      ...this.state,
      collections: this.state.collections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  }

  public deleteCollection(id: string): void {
    this.saveState({
      ...this.state,
      collections: this.state.collections.filter((c) => c.id !== id),
    });
  }

  public renameCollection(id: string, newName: string, newCode?: string): void {
    const existing = this.state.collections.find((c) => c.id === id);
    if (!existing) return;
    const oldName = existing.name;

    this.saveState({
      ...this.state,
      collections: this.state.collections.map((c) =>
        c.id === id
          ? {
              ...c,
              name: newName,
              code: newCode || c.code,
            }
          : c
      ),
      factoryStock: this.state.factoryStock.map((item) =>
        item.collection.toLowerCase() === oldName.toLowerCase()
          ? { ...item, collection: newName }
          : item
      ),
      shopStock: this.state.shopStock.map((item) =>
        item.collection.toLowerCase() === oldName.toLowerCase()
          ? { ...item, collection: newName }
          : item
      ),
    });
  }

  // ---------------- Factory Stock ----------------
  public getFactoryStock(): StockItem[] {
    return [...this.state.factoryStock];
  }

  public addFactoryStock(item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>): StockItem {
    const newItem: StockItem = {
      ...item,
      id: `f-stk-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      factoryStock: [newItem, ...this.state.factoryStock],
    });
    return newItem;
  }

  public updateFactoryStock(id: string, updates: Partial<StockItem>): void {
    this.saveState({
      ...this.state,
      factoryStock: this.state.factoryStock.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    });
  }

  public deleteFactoryStock(id: string): void {
    this.saveState({
      ...this.state,
      factoryStock: this.state.factoryStock.filter((item) => item.id !== id),
    });
  }

  public adjustFactoryStock(
    itemId: string,
    newQty: number,
    reason: string,
    adjustedBy: string
  ): void {
    const item = this.state.factoryStock.find((i) => i.id === itemId);
    if (!item) return;

    const previousQty = item.quantity;
    const difference = newQty - previousQty;

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      itemId,
      location: 'factory',
      sku: item.sku,
      previousQty,
      newQty,
      difference,
      reason,
      adjustedBy,
      date: new Date().toISOString().split('T')[0],
    };

    this.saveState({
      ...this.state,
      factoryStock: this.state.factoryStock.map((i) =>
        i.id === itemId ? { ...i, quantity: newQty, updatedAt: new Date().toISOString() } : i
      ),
      stockAdjustments: [adjustment, ...this.state.stockAdjustments],
    });
  }

  // ---------------- Fabric Stock & Cutting ----------------
  public getFabricStock(): FabricItem[] {
    return [...this.state.fabricStock];
  }

  public addFabricStock(item: Omit<FabricItem, 'id' | 'consumedKg' | 'remainingKg' | 'createdAt'>): FabricItem {
    const newItem: FabricItem = {
      ...item,
      id: `fab-${Date.now()}`,
      consumedKg: 0,
      remainingKg: item.quantityKg,
      createdAt: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      fabricStock: [newItem, ...this.state.fabricStock],
    });
    return newItem;
  }

  public updateFabricStock(id: string, updates: Partial<FabricItem>): void {
    this.saveState({
      ...this.state,
      fabricStock: this.state.fabricStock.map((f) => {
        if (f.id === id) {
          const updated = { ...f, ...updates };
          updated.remainingKg = Math.max(0, updated.quantityKg - updated.consumedKg);
          return updated;
        }
        return f;
      }),
    });
  }

  public deleteFabricStock(id: string): void {
    this.saveState({
      ...this.state,
      fabricStock: this.state.fabricStock.filter((f) => f.id !== id),
    });
  }

  public adjustFabricStock(
    fabricId: string,
    newRemainingKg: number,
    reason: string,
    adjustedBy: string
  ): void {
    const fabric = this.state.fabricStock.find((f) => f.id === fabricId);
    if (!fabric) return;

    const previousQty = fabric.remainingKg;
    const difference = newRemainingKg - previousQty;

    const adjustment: StockAdjustment = {
      id: `adj-fab-${Date.now()}`,
      itemId: fabricId,
      location: 'fabric',
      sku: fabric.batchLot,
      previousQty,
      newQty: newRemainingKg,
      difference,
      reason,
      adjustedBy,
      date: new Date().toISOString().split('T')[0],
    };

    const updatedFabric: FabricItem = {
      ...fabric,
      remainingKg: newRemainingKg,
    };

    this.saveState({
      ...this.state,
      fabricStock: this.state.fabricStock.map((f) => (f.id === fabricId ? updatedFabric : f)),
      stockAdjustments: [adjustment, ...this.state.stockAdjustments],
    });
  }

  public getCuttingRecords(): CuttingRecord[] {
    return [...this.state.cuttingRecords];
  }

  /**
   * Confirms a cutting record and atomically deducts kilograms used from the matching fabric batch.
   * Prevents negative stock unless authorized.
   */
  public addCuttingRecord(record: Omit<CuttingRecord, 'id' | 'createdAt'>): CuttingRecord {
    const fabric = this.state.fabricStock.find((f) => f.id === record.fabricId);
    if (!fabric) {
      throw new Error(`Fabric with ID ${record.fabricId} not found.`);
    }

    if (fabric.remainingKg < record.fabricConsumedKg) {
      throw new Error(
        `Insufficient fabric stock. Available: ${fabric.remainingKg} kg, Required: ${record.fabricConsumedKg} kg.`
      );
    }

    const newRecord: CuttingRecord = {
      ...record,
      id: `cut-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedFabric: FabricItem = {
      ...fabric,
      consumedKg: fabric.consumedKg + record.fabricConsumedKg,
      remainingKg: fabric.remainingKg - record.fabricConsumedKg,
    };

    this.saveState({
      ...this.state,
      cuttingRecords: [newRecord, ...this.state.cuttingRecords],
      fabricStock: this.state.fabricStock.map((f) => (f.id === fabric.id ? updatedFabric : f)),
    });

    return newRecord;
  }

  /**
   * Reverses previous cutting deduction cleanly before applying updated quantity.
   */
  public updateCuttingRecord(id: string, updates: Partial<CuttingRecord>): void {
    const existing = this.state.cuttingRecords.find((c) => c.id === id);
    if (!existing) return;

    const oldFabric = this.state.fabricStock.find((f) => f.id === existing.fabricId);
    const newFabricId = updates.fabricId || existing.fabricId;
    const targetFabric = this.state.fabricStock.find((f) => f.id === newFabricId);
    const newConsumedKg = updates.fabricConsumedKg ?? existing.fabricConsumedKg;

    if (!targetFabric) {
      throw new Error('Target fabric not found');
    }

    let updatedFabricList = [...this.state.fabricStock];

    if (oldFabric && oldFabric.id === targetFabric.id) {
      // Same fabric: adjust difference
      const diff = newConsumedKg - existing.fabricConsumedKg;
      if (oldFabric.remainingKg - diff < 0) {
        throw new Error(`Insufficient fabric in batch ${oldFabric.batchLot}`);
      }
      updatedFabricList = updatedFabricList.map((f) =>
        f.id === oldFabric.id
          ? {
              ...f,
              consumedKg: f.consumedKg + diff,
              remainingKg: f.remainingKg - diff,
            }
          : f
      );
    } else {
      // Changed fabric: restore old, deduct from new
      if (oldFabric) {
        updatedFabricList = updatedFabricList.map((f) =>
          f.id === oldFabric.id
            ? {
                ...f,
                consumedKg: Math.max(0, f.consumedKg - existing.fabricConsumedKg),
                remainingKg: f.remainingKg + existing.fabricConsumedKg,
              }
            : f
        );
      }
      if (targetFabric.remainingKg < newConsumedKg) {
        throw new Error(`Insufficient fabric in new batch ${targetFabric.batchLot}`);
      }
      updatedFabricList = updatedFabricList.map((f) =>
        f.id === targetFabric.id
          ? {
              ...f,
              consumedKg: f.consumedKg + newConsumedKg,
              remainingKg: f.remainingKg - newConsumedKg,
            }
          : f
      );
    }

    const updatedRecord: CuttingRecord = {
      ...existing,
      ...updates,
    };

    this.saveState({
      ...this.state,
      cuttingRecords: this.state.cuttingRecords.map((c) => (c.id === id ? updatedRecord : c)),
      fabricStock: updatedFabricList,
    });
  }

  public deleteCuttingRecord(id: string): void {
    const existing = this.state.cuttingRecords.find((c) => c.id === id);
    if (!existing) return;

    // Restore consumed fabric
    const updatedFabricList = this.state.fabricStock.map((f) =>
      f.id === existing.fabricId
        ? {
            ...f,
            consumedKg: Math.max(0, f.consumedKg - existing.fabricConsumedKg),
            remainingKg: f.remainingKg + existing.fabricConsumedKg,
          }
        : f
    );

    this.saveState({
      ...this.state,
      cuttingRecords: this.state.cuttingRecords.filter((c) => c.id !== id),
      fabricStock: updatedFabricList,
    });
  }

  // ---------------- Material Stock ----------------
  public getMaterialStock(): MaterialItem[] {
    return [...this.state.materialStock];
  }

  public addMaterialStock(item: Omit<MaterialItem, 'id' | 'remainingStock' | 'createdAt'>): MaterialItem {
    const remainingStock = item.openingStock + item.stockReceived - item.stockUsed;
    const newItem: MaterialItem = {
      ...item,
      id: `mat-${Date.now()}`,
      remainingStock,
      createdAt: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      materialStock: [newItem, ...this.state.materialStock],
    });
    return newItem;
  }

  public updateMaterialStock(id: string, updates: Partial<MaterialItem>): void {
    this.saveState({
      ...this.state,
      materialStock: this.state.materialStock.map((m) => {
        if (m.id === id) {
          const updated = { ...m, ...updates };
          updated.remainingStock = updated.openingStock + updated.stockReceived - updated.stockUsed;
          return updated;
        }
        return m;
      }),
    });
  }

  public deleteMaterialStock(id: string): void {
    this.saveState({
      ...this.state,
      materialStock: this.state.materialStock.filter((m) => m.id !== id),
    });
  }

  public recordMaterialUsage(usage: Omit<MaterialUsage, 'id'>): MaterialUsage {
    const material = this.state.materialStock.find((m) => m.id === usage.materialId);
    if (!material) throw new Error('Material not found');

    if (material.remainingStock < usage.quantityUsed) {
      throw new Error(`Insufficient material stock. Available: ${material.remainingStock} ${material.unit}`);
    }

    const newUsage: MaterialUsage = {
      ...usage,
      id: `musg-${Date.now()}`,
    };

    const updatedMaterial: MaterialItem = {
      ...material,
      stockUsed: material.stockUsed + usage.quantityUsed,
      remainingStock: material.remainingStock - usage.quantityUsed,
    };

    this.saveState({
      ...this.state,
      materialStock: this.state.materialStock.map((m) => (m.id === material.id ? updatedMaterial : m)),
      materialUsages: [newUsage, ...this.state.materialUsages],
    });

    return newUsage;
  }

  public getMaterialUsages(): MaterialUsage[] {
    return [...this.state.materialUsages];
  }

  // ---------------- Shop Stock ----------------
  public getShopStock(): StockItem[] {
    return [...this.state.shopStock];
  }

  public addShopStock(item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>): StockItem {
    const newItem: StockItem = {
      ...item,
      id: `s-stk-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      shopStock: [newItem, ...this.state.shopStock],
    });
    return newItem;
  }

  public updateShopStock(id: string, updates: Partial<StockItem>): void {
    this.saveState({
      ...this.state,
      shopStock: this.state.shopStock.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    });
  }

  public deleteShopStock(id: string): void {
    this.saveState({
      ...this.state,
      shopStock: this.state.shopStock.filter((item) => item.id !== id),
    });
  }

  public adjustShopStock(itemId: string, newQty: number, reason: string, adjustedBy: string): void {
    const item = this.state.shopStock.find((i) => i.id === itemId);
    if (!item) return;

    const previousQty = item.quantity;
    const difference = newQty - previousQty;

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      itemId,
      location: 'shop',
      sku: item.sku,
      previousQty,
      newQty,
      difference,
      reason,
      adjustedBy,
      date: new Date().toISOString().split('T')[0],
    };

    this.saveState({
      ...this.state,
      shopStock: this.state.shopStock.map((i) =>
        i.id === itemId ? { ...i, quantity: newQty, updatedAt: new Date().toISOString() } : i
      ),
      stockAdjustments: [adjustment, ...this.state.stockAdjustments],
    });
  }

  // ---------------- Stock Transfers (Factory <-> Shop) ----------------
  public getStockTransfers(): StockTransfer[] {
    return [...this.state.stockTransfers];
  }

  public transferStock(transfer: Omit<StockTransfer, 'id' | 'transferNumber' | 'createdAt'>): StockTransfer {
    const { sourceLocation, destinationLocation, collection, productName, colour, size, quantity } = transfer;

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than zero');
    }

    const sourceList = sourceLocation === 'Factory' ? this.state.factoryStock : this.state.shopStock;
    const destList = destinationLocation === 'Factory' ? this.state.factoryStock : this.state.shopStock;

    // Find source item
    const sourceItem = sourceList.find(
      (item) =>
        item.collection.toLowerCase() === collection.toLowerCase() &&
        item.productName.toLowerCase() === productName.toLowerCase() &&
        item.colour.toLowerCase() === colour.toLowerCase() &&
        item.size.toLowerCase() === size.toLowerCase()
    );

    if (!sourceItem) {
      throw new Error(`Item not found in ${sourceLocation}: ${productName} (${colour}, ${size})`);
    }

    if (sourceItem.quantity < quantity) {
      throw new Error(
        `Insufficient stock in ${sourceLocation}. Available: ${sourceItem.quantity}, Requested: ${quantity}`
      );
    }

    // Atomic update
    const updatedSource = sourceList.map((item) =>
      item.id === sourceItem.id ? { ...item, quantity: item.quantity - quantity } : item
    );

    // Find or create in destination
    let destFound = false;
    let updatedDest = destList.map((item) => {
      if (
        item.collection.toLowerCase() === collection.toLowerCase() &&
        item.productName.toLowerCase() === productName.toLowerCase() &&
        item.colour.toLowerCase() === colour.toLowerCase() &&
        item.size.toLowerCase() === size.toLowerCase()
      ) {
        destFound = true;
        return { ...item, quantity: item.quantity + quantity };
      }
      return item;
    });

    if (!destFound) {
      const newDestItem: StockItem = {
        id: `${destinationLocation === 'Factory' ? 'f' : 's'}-stk-${Date.now()}`,
        collection,
        productName,
        sku: `${sourceItem.sku}-${destinationLocation === 'Factory' ? 'FAC' : 'SHP'}`,
        colour,
        size,
        quantity,
        unit: sourceItem.unit || 'pieces',
        costPrice: sourceItem.costPrice,
        sellingPrice: sourceItem.sellingPrice,
        date: transfer.transferDate,
        notes: `Transferred from ${sourceLocation}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedDest = [newDestItem, ...updatedDest];
    }

    const count = this.state.stockTransfers.length + 1;
    const transferNumber = `UY-TRF-${String(count).padStart(6, '0')}`;

    const newTransfer: StockTransfer = {
      ...transfer,
      id: `trf-${Date.now()}`,
      transferNumber,
      createdAt: new Date().toISOString(),
    };

    if (sourceLocation === 'Factory') {
      this.saveState({
        ...this.state,
        factoryStock: updatedSource,
        shopStock: updatedDest,
        stockTransfers: [newTransfer, ...this.state.stockTransfers],
      });
    } else {
      this.saveState({
        ...this.state,
        shopStock: updatedSource,
        factoryStock: updatedDest,
        stockTransfers: [newTransfer, ...this.state.stockTransfers],
      });
    }

    return newTransfer;
  }

  // ---------------- Production Records ----------------
  public getProductionRecords(): ProductionRecord[] {
    return [...this.state.productionRecords];
  }

  public addProductionRecord(record: Omit<ProductionRecord, 'id' | 'createdAt'>): ProductionRecord {
    // Validate grades: aGrade + bGrade + cGrade + rejected <= inspected
    const totalGrades = record.aGradeQty + record.bGradeQty + record.cGradeQty + record.rejectedQty;
    if (record.inspectedQty > 0 && totalGrades > record.inspectedQty) {
      throw new Error(
        `Grade quantities (A:${record.aGradeQty} + B:${record.bGradeQty} + C:${record.cGradeQty} + Rej:${record.rejectedQty} = ${totalGrades}) cannot exceed inspected quantity (${record.inspectedQty}).`
      );
    }

    const newRecord: ProductionRecord = {
      ...record,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      productionRecords: [newRecord, ...this.state.productionRecords],
    });

    return newRecord;
  }

  public updateProductionRecord(id: string, updates: Partial<ProductionRecord>): void {
    const existing = this.state.productionRecords.find((p) => p.id === id);
    if (!existing) return;

    const inspected = updates.inspectedQty ?? existing.inspectedQty;
    const a = updates.aGradeQty ?? existing.aGradeQty;
    const b = updates.bGradeQty ?? existing.bGradeQty;
    const c = updates.cGradeQty ?? existing.cGradeQty;
    const rej = updates.rejectedQty ?? existing.rejectedQty;

    if (inspected > 0 && a + b + c + rej > inspected) {
      throw new Error('Total graded pieces cannot exceed inspected pieces.');
    }

    this.saveState({
      ...this.state,
      productionRecords: this.state.productionRecords.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  }

  /**
   * Moves inspected ready-to-stock pieces directly into Factory Stock without double counting.
   */
  public moveProductionToFactoryStock(productionId: string): void {
    const prod = this.state.productionRecords.find((p) => p.id === productionId);
    if (!prod) throw new Error('Production record not found');
    if (prod.movedToStock) throw new Error('Pieces have already been moved to factory stock.');
    if (prod.readyToStockQty <= 0) throw new Error('No ready-to-stock pieces available to move.');

    // Find existing factory stock or create new variant
    const existingStock = this.state.factoryStock.find(
      (item) =>
        item.collection.toLowerCase() === prod.collection.toLowerCase() &&
        item.productName.toLowerCase() === prod.productName.toLowerCase() &&
        item.colour.toLowerCase() === prod.colour.toLowerCase() &&
        item.size.toLowerCase() === prod.size.toLowerCase()
    );

    let updatedFactoryStock = [...this.state.factoryStock];

    if (existingStock) {
      updatedFactoryStock = updatedFactoryStock.map((item) =>
        item.id === existingStock.id
          ? {
              ...item,
              quantity: item.quantity + prod.readyToStockQty,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
    } else {
      const newItem: StockItem = {
        id: `f-stk-${Date.now()}`,
        collection: prod.collection,
        productName: prod.productName,
        sku: `UY-${prod.collection.substring(0, 3).toUpperCase()}-${prod.colour.substring(0, 3).toUpperCase()}-${prod.size}`,
        colour: prod.colour,
        size: prod.size,
        quantity: prod.readyToStockQty,
        unit: 'pieces',
        costPrice: 5.0,
        sellingPrice: 10.0,
        date: new Date().toISOString().split('T')[0],
        notes: `Transferred from production record ${prod.orderNumber || prod.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedFactoryStock = [newItem, ...updatedFactoryStock];
    }

    const updatedProdRecords = this.state.productionRecords.map((p) =>
      p.id === productionId ? { ...p, movedToStock: true } : p
    );

    this.saveState({
      ...this.state,
      factoryStock: updatedFactoryStock,
      productionRecords: updatedProdRecords,
    });
  }

  // ---------------- Customers ----------------
  public getCustomers(): Customer[] {
    return [...this.state.customers];
  }

  public addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      customers: [newCust, ...this.state.customers],
    });
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): void {
    this.saveState({
      ...this.state,
      customers: this.state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  }

  public deleteCustomer(id: string): void {
    this.saveState({
      ...this.state,
      customers: this.state.customers.filter((c) => c.id !== id),
    });
  }

  // ---------------- Orders & Invoices ----------------
  public getOrders(): Order[] {
    return [...this.state.orders];
  }

  public addOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'remainingBalance' | 'paymentStatus' | 'quantityOrdered' | 'quantityRemainingToDispatch'>): Order {
    const count = this.state.orders.length + 1;
    const prefix = this.state.settings.orderPrefix || 'UY-ORD-';
    const orderNumber = `${prefix}${String(count).padStart(6, '0')}`;

    const quantityOrdered = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const quantityRemainingToDispatch = Math.max(0, quantityOrdered - (orderData.quantityDispatched || 0));

    const totalAmount = orderData.subtotal + (orderData.additionalCharges || 0) - (orderData.discount || 0);
    const totalPaymentsReceived = orderData.advancePayment || 0;
    const remainingBalance = Math.max(0, totalAmount - totalPaymentsReceived);

    let paymentStatus: Order['paymentStatus'] = 'Unpaid';
    if (totalPaymentsReceived >= totalAmount && totalAmount > 0) {
      paymentStatus = totalPaymentsReceived > totalAmount ? 'Overpaid' : 'Paid';
    } else if (totalPaymentsReceived > 0) {
      paymentStatus = 'Partially Paid';
    }

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      totalAmount,
      totalPaymentsReceived,
      remainingBalance,
      paymentStatus,
      quantityOrdered,
      quantityRemainingToDispatch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If advance payment was made, automatically record payment voucher
    let updatedPayments = [...this.state.payments];
    if (orderData.advancePayment > 0) {
      const payCount = this.state.payments.length + 1;
      const paymentNumber = `UY-PAY-${String(payCount).padStart(6, '0')}`;
      const advPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        paymentNumber,
        customerId: newOrder.customerId,
        customerName: newOrder.customerName,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        paymentDate: newOrder.orderDate,
        amount: orderData.advancePayment,
        paymentMethod: 'Cash',
        paymentType: 'advance',
        notes: `Order Confirmation Advance for ${orderNumber}`,
        receivedBy: 'System / Accounts',
        createdAt: new Date().toISOString(),
      };
      updatedPayments = [advPayment, ...updatedPayments];
    }

    // Automatically generate corresponding invoice
    const invCount = this.state.invoices.length + 1;
    const invPrefix = this.state.settings.invoicePrefix || 'UY-INV-';
    const invoiceNumber = `${invPrefix}${String(invCount).padStart(6, '0')}`;
    const cust = this.state.customers.find((c) => c.id === newOrder.customerId);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      invoiceDate: newOrder.orderDate,
      dueDate: newOrder.expectedDeliveryDate,
      customerId: newOrder.customerId,
      customerName: newOrder.customerName,
      customerCompany: cust?.companyName,
      customerPhone: newOrder.customerPhone || cust?.phone || '',
      customerEmail: cust?.email || '',
      customerAddress: cust?.address || '',
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      discount: newOrder.discount,
      additionalCharges: newOrder.additionalCharges,
      grandTotal: newOrder.totalAmount,
      advanceReceived: newOrder.advancePayment,
      subsequentPayments: 0,
      totalReceived: newOrder.totalPaymentsReceived,
      remainingBalance: newOrder.remainingBalance,
      paymentStatus: newOrder.paymentStatus,
      notes: newOrder.specialInstructions || 'Thank you for your business with UY Garments.',
      status: 'Issued',
      createdAt: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      orders: [newOrder, ...this.state.orders],
      invoices: [newInvoice, ...this.state.invoices],
      payments: updatedPayments,
    });

    return newOrder;
  }

  public updateOrder(id: string, updates: Partial<Order>): void {
    const existing = this.state.orders.find((o) => o.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updates };

    if (updates.items) {
      merged.quantityOrdered = updates.items.reduce((sum, item) => sum + item.quantity, 0);
      merged.subtotal = updates.items.reduce((sum, item) => sum + item.lineTotal, 0);
    }

    merged.totalAmount = merged.subtotal + (merged.additionalCharges || 0) - (merged.discount || 0);
    merged.remainingBalance = Math.max(0, merged.totalAmount - merged.totalPaymentsReceived);
    merged.quantityRemainingToDispatch = Math.max(0, merged.quantityOrdered - merged.quantityDispatched);

    if (merged.totalPaymentsReceived >= merged.totalAmount && merged.totalAmount > 0) {
      merged.paymentStatus = merged.totalPaymentsReceived > merged.totalAmount ? 'Overpaid' : 'Paid';
    } else if (merged.totalPaymentsReceived > 0) {
      merged.paymentStatus = 'Partially Paid';
    } else {
      merged.paymentStatus = 'Unpaid';
    }

    merged.updatedAt = new Date().toISOString();

    // Sync corresponding invoice if exists
    const updatedInvoices = this.state.invoices.map((inv) => {
      if (inv.orderId === id) {
        return {
          ...inv,
          items: merged.items,
          subtotal: merged.subtotal,
          discount: merged.discount,
          additionalCharges: merged.additionalCharges,
          grandTotal: merged.totalAmount,
          advanceReceived: merged.advancePayment,
          totalReceived: merged.totalPaymentsReceived,
          remainingBalance: merged.remainingBalance,
          paymentStatus: merged.paymentStatus,
        };
      }
      return inv;
    });

    this.saveState({
      ...this.state,
      orders: this.state.orders.map((o) => (o.id === id ? merged : o)),
      invoices: updatedInvoices,
    });
  }

  public deleteOrder(id: string): void {
    this.saveState({
      ...this.state,
      orders: this.state.orders.filter((o) => o.id !== id),
      invoices: this.state.invoices.filter((inv) => inv.orderId !== id),
    });
  }

  // ---------------- Invoices ----------------
  public getInvoices(): Invoice[] {
    return [...this.state.invoices];
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.state.invoices.find((inv) => inv.id === id);
  }

  public getInvoiceByOrderId(orderId: string): Invoice | undefined {
    return this.state.invoices.find((inv) => inv.orderId === orderId);
  }

  // ---------------- Dispatches ----------------
  public getDispatches(): DispatchRecord[] {
    return [...this.state.dispatches];
  }

  public getDispatchesByOrderId(orderId: string): DispatchRecord[] {
    return this.state.dispatches.filter((d) => d.orderId === orderId);
  }

  public addDispatch(dispatch: Omit<DispatchRecord, 'id' | 'dispatchNumber' | 'createdAt'>): DispatchRecord {
    const order = this.state.orders.find((o) => o.id === dispatch.orderId);
    if (!order) throw new Error('Order not found');

    if (order.quantityRemainingToDispatch < dispatch.quantityDispatched) {
      throw new Error(
        `Cannot dispatch ${dispatch.quantityDispatched} pieces. Remaining undelivered: ${order.quantityRemainingToDispatch}`
      );
    }

    const count = this.state.dispatches.length + 1;
    const prefix = this.state.settings.dispatchPrefix || 'UY-DSP-';
    const dispatchNumber = `${prefix}${String(count).padStart(6, '0')}`;

    const newDispatch: DispatchRecord = {
      ...dispatch,
      id: `dsp-${Date.now()}`,
      dispatchNumber,
      createdAt: new Date().toISOString(),
    };

    // Update order dispatched count and dispatch status
    const newQuantityDispatched = order.quantityDispatched + dispatch.quantityDispatched;
    const newQuantityRemaining = Math.max(0, order.quantityOrdered - newQuantityDispatched);

    let newStatus = order.status;
    if (newQuantityRemaining === 0) {
      newStatus = 'Dispatched';
    } else if (newQuantityDispatched > 0) {
      newStatus = 'Partially Dispatched';
    }

    const updatedOrder: Order = {
      ...order,
      quantityDispatched: newQuantityDispatched,
      quantityRemainingToDispatch: newQuantityRemaining,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      dispatches: [newDispatch, ...this.state.dispatches],
      orders: this.state.orders.map((o) => (o.id === order.id ? updatedOrder : o)),
    });

    return newDispatch;
  }

  // ---------------- Payments & Receivables ----------------
  public getPayments(): PaymentRecord[] {
    return [...this.state.payments];
  }

  public getPaymentsByOrderId(orderId: string): PaymentRecord[] {
    return this.state.payments.filter((p) => p.orderId === orderId);
  }

  public getPaymentsByCustomerId(customerId: string): PaymentRecord[] {
    return this.state.payments.filter((p) => p.customerId === customerId);
  }

  public addPayment(paymentData: Omit<PaymentRecord, 'id' | 'paymentNumber' | 'createdAt'>): PaymentRecord {
    const count = this.state.payments.length + 1;
    const paymentNumber = `UY-PAY-${String(count).padStart(6, '0')}`;

    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      paymentNumber,
      createdAt: new Date().toISOString(),
    };

    // If allocated to an order, update the order & invoice payments
    let updatedOrders = [...this.state.orders];
    let updatedInvoices = [...this.state.invoices];

    if (paymentData.orderId) {
      const order = this.state.orders.find((o) => o.id === paymentData.orderId);
      if (order) {
        const totalPaymentsReceived = order.totalPaymentsReceived + paymentData.amount;
        const remainingBalance = Math.max(0, order.totalAmount - totalPaymentsReceived);

        let paymentStatus: Order['paymentStatus'] = 'Unpaid';
        if (totalPaymentsReceived >= order.totalAmount && order.totalAmount > 0) {
          paymentStatus = totalPaymentsReceived > order.totalAmount ? 'Overpaid' : 'Paid';
        } else if (totalPaymentsReceived > 0) {
          paymentStatus = 'Partially Paid';
        }

        updatedOrders = updatedOrders.map((o) =>
          o.id === order.id
            ? {
                ...o,
                totalPaymentsReceived,
                remainingBalance,
                paymentStatus,
                updatedAt: new Date().toISOString(),
              }
            : o
        );

        updatedInvoices = updatedInvoices.map((inv) =>
          inv.orderId === order.id
            ? {
                ...inv,
                subsequentPayments: inv.subsequentPayments + (paymentData.paymentType === 'subsequent' ? paymentData.amount : 0),
                totalReceived: totalPaymentsReceived,
                remainingBalance,
                paymentStatus,
              }
            : inv
        );
      }
    }

    this.saveState({
      ...this.state,
      payments: [newPayment, ...this.state.payments],
      orders: updatedOrders,
      invoices: updatedInvoices,
    });

    return newPayment;
  }

  // ---------------- Expenses ----------------
  public getExpenses(): ExpenseRecord[] {
    return [...this.state.expenses];
  }

  public addExpense(expense: Omit<ExpenseRecord, 'id' | 'expenseNumber' | 'createdAt'>): ExpenseRecord {
    const count = this.state.expenses.length + 1;
    const prefix = this.state.settings.expensePrefix || 'UY-EXP-';
    const expenseNumber = `${prefix}${String(count).padStart(6, '0')}`;

    const newExpense: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      expenseNumber,
      createdAt: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      expenses: [newExpense, ...this.state.expenses],
    });

    return newExpense;
  }

  public updateExpense(id: string, updates: Partial<ExpenseRecord>): void {
    this.saveState({
      ...this.state,
      expenses: this.state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  }

  public deleteExpense(id: string): void {
    this.saveState({
      ...this.state,
      expenses: this.state.expenses.filter((e) => e.id !== id),
    });
  }

  // ---------------- Employees & Salaries ----------------
  public getEmployees(): Employee[] {
    return [...this.state.employees];
  }

  public addEmployee(emp: Omit<Employee, 'id' | 'createdAt'>): Employee {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      employees: [newEmp, ...this.state.employees],
    });
    return newEmp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): void {
    this.saveState({
      ...this.state,
      employees: this.state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  }

  public deleteEmployee(id: string): void {
    this.saveState({
      ...this.state,
      employees: this.state.employees.filter((e) => e.id !== id),
    });
  }

  public getSalaryRecords(): SalaryRecord[] {
    return [...this.state.salaryRecords];
  }

  public addSalaryRecord(salary: Omit<SalaryRecord, 'id' | 'salaryNumber' | 'totalPayable' | 'remainingSalary' | 'status' | 'createdAt' | 'updatedAt'>): SalaryRecord {
    const count = this.state.salaryRecords.length + 1;
    const salaryNumber = `UY-SAL-${salary.periodStart.slice(0, 7)}-${String(count).padStart(3, '0')}`;

    const totalPayable = salary.agreedSalary + (salary.additionalEarnings || 0) - (salary.deductions || 0);
    const remainingSalary = Math.max(0, totalPayable - (salary.amountPaid || 0));

    let status: SalaryRecord['status'] = 'Unpaid';
    if (salary.amountPaid >= totalPayable && totalPayable > 0) {
      status = 'Paid';
    } else if (salary.amountPaid > 0) {
      status = 'Partially Paid';
    }

    const newRecord: SalaryRecord = {
      ...salary,
      id: `sal-${Date.now()}`,
      salaryNumber,
      totalPayable,
      remainingSalary,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      salaryRecords: [newRecord, ...this.state.salaryRecords],
    });

    return newRecord;
  }

  public recordSalaryPayment(salaryRecordId: string, payment: Omit<SalaryPaymentItem, 'id'>): void {
    const rec = this.state.salaryRecords.find((s) => s.id === salaryRecordId);
    if (!rec) throw new Error('Salary record not found');

    const newPaymentItem: SalaryPaymentItem = {
      ...payment,
      id: `spay-${Date.now()}`,
    };

    const newAmountPaid = rec.amountPaid + payment.amount;
    const newRemaining = Math.max(0, rec.totalPayable - newAmountPaid);

    let status: SalaryRecord['status'] = 'Unpaid';
    if (newAmountPaid >= rec.totalPayable && rec.totalPayable > 0) {
      status = 'Paid';
    } else if (newAmountPaid > 0) {
      status = 'Partially Paid';
    }

    const updatedRec: SalaryRecord = {
      ...rec,
      amountPaid: newAmountPaid,
      remainingSalary: newRemaining,
      status,
      payments: [...rec.payments, newPaymentItem],
      updatedAt: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      salaryRecords: this.state.salaryRecords.map((s) => (s.id === salaryRecordId ? updatedRec : s)),
    });
  }
}

export const db = new DatabaseService();
