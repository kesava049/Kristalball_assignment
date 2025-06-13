
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (userData: { username: string; email: string; password: string; fullName: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
  updateProfile: async (userData: { fullName?: string; email?: string }) => {
    const response = await api.put('/user/profile', userData);
    return response.data;
  }
};

// Assets API
export const assetAPI = {
  getAssets: async (params?: { baseId?: string; equipmentTypeId?: string }) => {
    const response = await api.get('/assets', { params });
    return response.data;
  },
  getEquipmentTypes: async () => {
    const response = await api.get('/assets/equipment-types');
    return response.data;
  },
  getBases: async () => {
    const response = await api.get('/assets/bases');
    return response.data;
  },
  getUsers: async (params?: { baseId?: string }) => {
    const response = await api.get('/assets/users', { params });
    return response.data;
  }
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: async (params: {
    startDate?: string;
    endDate?: string;
    baseId?: string;
    equipmentTypeId?: string;
  }) => {
    const response = await api.get('/dashboard/metrics', { params });
    return response.data;
  }
};

// Purchases API
export const purchaseAPI = {
  create: async (data: {
    assetId: string;
    quantity: number;
    unitCost?: number;
    totalCost?: number;
    purchaseDate: string;
    supplierInfo?: string;
    receivingBaseId: string;
    purchaseOrderNumber?: string;
  }) => {
    const response = await api.post('/purchases', data);
    return response.data;
  },
  getPurchases: async (params: {
    page?: number;
    limit?: number;
    baseId?: string;
    equipmentTypeId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/purchases', { params });
    return response.data;
  }
};

// Transfers API
export const transferAPI = {
  create: async (data: {
    assetId: string;
    quantity: number;
    sourceBaseId: string;
    destinationBaseId: string;
    transferDate: string;
    reason?: string;
  }) => {
    const response = await api.post('/transfers', data);
    return response.data;
  },
  getTransfers: async (params: {
    page?: number;
    limit?: number;
    baseId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/transfers', { params });
    return response.data;
  }
};

// Assignments API
export const assignmentAPI = {
  create: async (data: {
    assetId: string;
    assignedToUserId: string;
    assignmentDate: string;
    baseOfAssignmentId: string;
    purpose?: string;
    expectedReturnDate?: string;
  }) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },
  returnAsset: async (assignmentId: string) => {
    const response = await api.patch(`/assignments/${assignmentId}/return`);
    return response.data;
  },
  getAssignments: async (params: {
    page?: number;
    limit?: number;
    baseId?: string;
    isActive?: boolean;
    userId?: string;
  }) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  }
};

// Expenditures API
export const expenditureAPI = {
  create: async (data: {
    assetId: string;
    quantityExpended: number;
    expenditureDate: string;
    baseId: string;
    reason?: string;
  }) => {
    const response = await api.post('/expenditures', data);
    return response.data;
  },
  getExpenditures: async (params: {
    page?: number;
    limit?: number;
    baseId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/expenditures', { params });
    return response.data;
  }
};

export default api;
