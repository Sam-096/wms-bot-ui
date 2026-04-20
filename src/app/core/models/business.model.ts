export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface InwardTransaction {
  id: string;
  warehouseId: string;
  grnNumber: string;
  commodityName: string;
  supplierName: string;
  vehicleNumber: string | null;
  quantityBags: number | null;
  unitWeight: number | null;
  totalWeight: number | null;
  unit: string;
  status: TransactionStatus;
  remarks: string | null;
  inwardDate: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InwardFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateInwardRequest {
  commodityName: string;
  supplierName: string;
  vehicleNumber: string;
  quantityBags: number;
  unitWeight: number;
  grnNumber: string;
  unit?: string;
  remarks?: string;
  warehouseId: string;
}

export interface OutwardTransaction {
  id: string;
  warehouseId: string;
  dispatchNumber: string;
  commodityName: string;
  customerName: string;
  vehicleNumber: string | null;
  quantityBags: number | null;
  unitWeight: number | null;
  totalWeight: number | null;
  unit: string;
  status: TransactionStatus;
  remarks: string | null;
  outwardDate: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutwardRequest {
  commodityName: string;
  customerName: string;
  vehicleNumber: string;
  quantityBags: number;
  unit?: string;
  remarks?: string;
  warehouseId: string;
}

export type GatePassStatus = 'Open' | 'Closed' | 'Overstay';
export type GatePassPurpose = 'Inward' | 'Outward' | 'Other';

export interface GatePass {
  id: string;
  passNumber: string;
  vehicleNo: string;
  driverName: string;
  purpose: GatePassPurpose;
  commodity?: string;
  bagsCount?: number;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  status: GatePassStatus;
  warehouseId: string;
}

export interface CreateGatePassRequest {
  vehicleNo: string;
  driverName: string;
  purpose: GatePassPurpose;
  commodity?: string;
  bagsCount?: number;
  warehouseId: string;
}

export type StockStatus = 'OK' | 'LOW' | 'CRITICAL';

export interface StockItem {
  id: string;
  itemName: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  warehouseId: string;
  lastUpdated: string;
  status: StockStatus;
}

export type BondStatus = 'Active' | 'Expired' | 'Released';

export interface Bond {
  id: string;
  bondNumber: string;
  commodity: string;
  quantity: number;
  unit: string;
  startDate: string;
  expiryDate: string;
  status: BondStatus;
  warehouseId: string;
  createdAt: string;
  daysToExpiry?: number;
}

export interface CreateBondRequest {
  commodity: string;
  quantity: number;
  unit: string;
  startDate: string;
  expiryDate: string;
  warehouseId: string;
}

export type ReportType =
  | 'DAILY_ACTIVITY'
  | 'STOCK_SUMMARY'
  | 'INWARD_REPORT'
  | 'OUTWARD_REPORT'
  | 'GATE_LOG'
  | 'BOND_STATUS';

export type ReportFormat = 'CSV' | 'PDF';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface Report {
  id: string;
  reportType: ReportType;
  dateFrom: string;
  dateTo: string;
  format: ReportFormat;
  status: ReportStatus;
  generatedAt?: string;
  downloadUrl?: string;
  warehouseId: string;
}

export interface GenerateReportRequest {
  reportType: ReportType;
  dateFrom: string;
  dateTo: string;
  format: ReportFormat;
  warehouseId: string;
}

export interface DashboardSnapshot {
  stockHealth: number;
  activeVehicles: number;
  pendingInward: number;
  pendingOutward: number;
  lowStockItems: number;
  activeBonds: number;
  warehouseId: string;
  timestamp: string;
}
