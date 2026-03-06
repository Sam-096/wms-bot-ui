export type AppRole = 'MANAGER' | 'OPERATOR' | 'GATE_STAFF' | 'VIEWER' | 'ADMIN';

export interface User {
  userId: string;
  username: string;
  email: string;
  role: AppRole;
  warehouseId: string;
  warehouseName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
  warehouseId: string;
}

export interface Warehouse {
  id: string;
  name: string;
}
