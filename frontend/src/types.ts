
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  bases: Array<{ id: string; name: string }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface DashboardMetrics {
  openingBalance: number;
  closingBalance: number;
  netMovement: number;
  assignedAssets: number;
  expendedAssets: number;
  purchases: number;
  transfersIn: number;
  transfersOut: number;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  baseId?: string;
  equipmentTypeId?: string;
}

export interface Asset {
  id: string;
  equipmentTypeId: string;
  modelName: string;
  serialNumber?: string;
  currentBaseId: string;
  quantity: number;
  status: string;
  lastUpdatedAt: string;
  isFungible: boolean;
  currentBalance: number;
  equipmentType: EquipmentType;
  currentBase: Base;
}

export interface EquipmentType {
  id: string;
  typeName: string;
  category: string;
  description?: string;
}

export interface Base {
  id: string;
  baseName: string;
  location: string;
  description?: string;
}

export interface Purchase {
  id: string;
  assetId: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  purchaseDate: string;
  supplierInfo?: string;
  receivingBaseId: string;
  purchaseOrderNumber?: string;
  recordedByUserId: string;
  createdAt: string;
  asset: Asset;
  receivingBase: Base;
  recordedBy: User;
}

export interface Transfer {
  id: string;
  assetId: string;
  assetSerialNumber?: string;
  quantity: number;
  sourceBaseId: string;
  destinationBaseId: string;
  transferDate: string;
  reason?: string;
  status: string;
  initiatedByUserId: string;
  receivedByUserId?: string;
  createdAt: string;
  completedAt?: string;
  asset: Asset;
  sourceBase: Base;
  destinationBase: Base;
  initiatedBy: User;
  receivedBy?: User;
}

export interface Assignment {
  id: string;
  assetId: string;
  assignedToUserId: string;
  assignmentDate: string;
  baseOfAssignmentId: string;
  purpose?: string;
  expectedReturnDate?: string;
  returnedDate?: string;
  isActive: boolean;
  recordedByUserId: string;
  createdAt: string;
  asset: Asset;
  assignedTo: User;
  baseOfAssignment: Base;
  recordedBy: User;
}

export interface Expenditure {
  id: string;
  assetId: string;
  quantityExpended: number;
  expenditureDate: string;
  baseId: string;
  reason?: string;
  reportedByUserId: string;
  createdAt: string;
  asset: Asset;
  base: Base;
  reportedBy: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
