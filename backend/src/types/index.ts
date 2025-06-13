
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  bases: string[];
}

export interface AuthRequest extends Request {
  user?: User;
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
