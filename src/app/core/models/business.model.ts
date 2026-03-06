export type TransactionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface InwardTransaction {
  id: string;
  grnNumber: string;
  date: string;
  vehicleNo: string;
  driverName: string;
  commodity: string;
  bags: number;
  unitWeight: number;
  totalWeight: number;
  supplierName: string;
  warehouseId: string;
  status: TransactionStatus;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
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
  bags: number;
  unitWeight: number;
  supplierName: string;
  vehicleNo: string;
  grnNumber: string;
  remarks?: string;
  warehouseId: string;
}

export interface OutwardTransaction {
  id: string;
  outwardNumber: string;
  date: string;
  vehicleNo: string;
  driverName: string;
  commodity: string;
  bags: number;
  destination: string;
  purpose: string;
  warehouseId: string;
  status: TransactionStatus;
  remarks?: string;
  createdAt: string;
}

export interface CreateOutwardRequest {
  commodity: string;
  bags: number;
  destination: string;
  vehicleNo: string;
  purpose: string;
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
