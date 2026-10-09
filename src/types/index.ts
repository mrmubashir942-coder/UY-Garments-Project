export type CollectionName = 
  | 'T-Shirt'
  | 'Polo'
  | 'Drop Shoulder'
  | 'Hoodie'
  | 'Zipper'
  | 'Sweatshirt'
  | 'Cap'
  | string;

export interface Collection {
  id: string;
  name: string;
  code: string;
  description?: string;
  isCustom?: boolean;
}

export interface StockItem {
  id: string;
  collection: string;
  productName: string;
  sku: string;
  colour: string;
  size: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  date: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  location: 'factory' | 'shop' | 'fabric';
  sku: string;
  previousQty: number;
  newQty: number;
  difference: number;
  reason: string;
  adjustedBy: string;
  date: string;
}

export interface FabricItem {
  id: string;
  fabricName: string;
  collectionOrProduct: string;
  colour: string;
  batchLot: string;
  quantityKg: number;
  consumedKg: number;
  remainingKg: number;
  purchaseRatePerKg: number;
  supplier: string;
  dateReceived: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface CuttingRecord {
  id: string;
  cuttingDate: string;
  fabricId: string;
  fabricName: string;
  collectionOrProduct: string;
  colour: string;
  fabricBatch: string;
  fabricConsumedKg: number;
  piecesCut: number;
  sizeBreakdown: Record<string, number>;
  relatedOrderId?: string;
  orderNumber?: string;
  cutBy?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export type MaterialCategory = 'buttons' | 'thread' | 'packing' | 'fusing' | 'other';

export interface MaterialItem {
  id: string;
  category: MaterialCategory;
  name: string;
  colour?: string;
  size?: string;
  unit: string; // 'pcs', 'kg', 'cones', 'boxes', 'meters'
  openingStock: number;
  stockReceived: number;
  stockUsed: number;
  remainingStock: number;
  costPerUnit: number;
  supplier?: string;
  dateReceived: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface MaterialUsage {
  id: string;
  materialId: string;
  materialName: string;
  category: MaterialCategory;
  quantityUsed: number;
  date: string;
  purposeOrOrder: string;
  recordedBy: string;
  notes?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceLocation: 'Factory' | 'Shop';
  destinationLocation: 'Shop' | 'Factory';
  collection: string;
  productName: string;
  colour: string;
  size: string;
  quantity: number;
  transferDate: string;
  reference?: string;
  notes?: string;
  performedBy: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface ProductionRecord {
  id: string;
  date: string;
  orderId?: string;
  orderNumber?: string;
  collection: string;
  productName: string;
  colour: string;
  size: string;
  orderedQty: number;
  cutQty: number;
  stitchedQty: number;
  finishedQty: number;
  inspectedQty: number;
  aGradeQty: number;
  bGradeQty: number;
  cGradeQty: number;
  rejectedQty: number;
  readyToStockQty: number;
  movedToStock: boolean;
  notes?: string;
  stage: 'cutting' | 'stitching' | 'finishing' | 'quality_check' | 'ready_to_stock';
  isDemo?: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  accountRef: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  collection: string;
  productName: string;
  colour: string;
  size: string;
  quantity: number;
  rate: number;
  lineTotal: number;
}

export type OrderStatus = 
  | 'New'
  | 'In Work'
  | 'Pending'
  | 'Ready for Dispatch'
  | 'Partially Dispatched'
  | 'Dispatched'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overpaid';

export interface Order {
  id: string;
  orderNumber: string; // e.g. UY-ORD-000001
  customerId: string;
  customerName: string;
  customerPhone?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: OrderStatus;
  specialInstructions?: string;
  items: OrderItem[];
  discount: number;
  additionalCharges: number;
  subtotal: number;
  totalAmount: number;
  advancePayment: number;
  totalPaymentsReceived: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  quantityOrdered: number;
  quantityProduced: number;
  quantityDispatched: number;
  quantityRemainingToDispatch: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. UY-INV-000001
  orderId: string;
  orderNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  advanceReceived: number;
  subsequentPayments: number;
  totalReceived: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  status: 'Issued' | 'Paid' | 'Cancelled';
  isDemo?: boolean;
  createdAt: string;
}

export interface DispatchRecord {
  id: string;
  dispatchNumber: string; // e.g. UY-DSP-000001
  orderId: string;
  orderNumber: string;
  customerName: string;
  dispatchDate: string;
  deliveryReference: string;
  relatedInvoiceNumber?: string;
  quantityDispatched: number;
  sizeBreakdown?: Record<string, number>;
  carrierOrDriver?: string;
  receivedBy?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: 'advance' | 'subsequent' | 'general';
  accountReference?: string;
  chequeNumber?: string;
  bankReference?: string;
  notes?: string;
  receivedBy: string;
  isDemo?: boolean;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Factory Rent'
  | 'Electricity & Utilities'
  | 'Machine Maintenance'
  | 'Dyes & Chemicals'
  | 'Transport & Logistics'
  | 'Packing Materials'
  | 'Staff Welfare'
  | 'Office & Admin'
  | 'Salaries'
  | 'Other';

export interface ExpenseRecord {
  id: string;
  expenseNumber: string; // e.g. UY-EXP-000001
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidToVendor: string;
  referenceNumber?: string;
  notes?: string;
  attachmentName?: string;
  attachmentData?: string; // Data URL or base64
  status: 'Paid' | 'Pending';
  isDemo?: boolean;
  createdAt: string;
}

export type SalaryType = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Per piece';

export interface Employee {
  id: string;
  employeeId: string; // e.g. EMP-001
  name: string;
  phone: string;
  department: string;
  jobField: string;
  joiningDate: string;
  salaryType: SalaryType;
  agreedSalary: number;
  status: 'Active' | 'On Leave' | 'Inactive';
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface SalaryPaymentItem {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface SalaryRecord {
  id: string;
  salaryNumber: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  periodType: 'Monthly' | 'Weekly' | 'Custom';
  periodStart: string;
  periodEnd: string;
  agreedSalary: number;
  additionalEarnings: number; // overtime, bonus
  deductions: number; // advance deduction, penalty
  totalPayable: number;
  amountPaid: number;
  remainingSalary: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  payments: SalaryPaymentItem[];
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  companyName: string;
  brandTagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRegistrationNumber?: string;
  currencySymbol: string;
  orderPrefix: string;
  invoicePrefix: string;
  expensePrefix: string;
  dispatchPrefix: string;
  bankDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode?: string;
  };
  customLogoUrl?: string;
}

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: 'Owner' | 'Factory Manager' | 'Accounts Staff' | 'Supervisor';
}
