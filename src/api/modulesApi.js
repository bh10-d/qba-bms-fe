import axiosClient from './axiosClient';

// Roles API (/api/v1/roles)
export const rolesApi = {
  getAll: (params) => axiosClient.get('/roles', { params }),
  getById: (id) => axiosClient.get(`/roles/${id}`),
  create: (data) => axiosClient.post('/roles', data),
  update: (id, data) => axiosClient.patch(`/roles/${id}`, data),
  delete: (id) => axiosClient.delete(`/roles/${id}`),
};

// Brands API (/api/v1/brands)
export const brandsApi = {
  getAll: (params) => axiosClient.get('/brands', { params }),
  getById: (id) => axiosClient.get(`/brands/${id}`),
  create: (data) => axiosClient.post('/brands', data),
  update: (id, data) => axiosClient.patch(`/brands/${id}`, data),
  delete: (id) => axiosClient.delete(`/brands/${id}`),
};

// Engines API (/api/v1/engines)
export const enginesApi = {
  getAll: (params) => axiosClient.get('/engines', { params }),
  getById: (id) => axiosClient.get(`/engines/${id}`),
  create: (data) => axiosClient.post('/engines', data),
  update: (id, data) => axiosClient.patch(`/engines/${id}`, data),
  delete: (id) => axiosClient.delete(`/engines/${id}`),
};

// Gearboxes API (/api/v1/gearboxes)
export const gearboxesApi = {
  getAll: (params) => axiosClient.get('/gearboxes', { params }),
  getById: (id) => axiosClient.get(`/gearboxes/${id}`),
  create: (data) => axiosClient.post('/gearboxes', data),
  update: (id, data) => axiosClient.patch(`/gearboxes/${id}`, data),
  delete: (id) => axiosClient.delete(`/gearboxes/${id}`),
};

// Vehicles API (/api/v1/vehicles)
export const vehiclesApi = {
  getAll: (params) => axiosClient.get('/vehicles', { params }),
  getById: (id) => axiosClient.get(`/vehicles/${id}`),
  create: (data) => axiosClient.post('/vehicles', data),
  update: (id, data) => axiosClient.patch(`/vehicles/${id}`, data),
  delete: (id) => axiosClient.delete(`/vehicles/${id}`),
};

// Products API (/api/v1/products)
export const productsApi = {
  getAll: (params) => axiosClient.get('/products', { params }),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (data) => axiosClient.post('/products', data),
  update: (id, data) => axiosClient.patch(`/products/${id}`, data),
  delete: (id) => axiosClient.delete(`/products/${id}`),
};

// Supplier Info API (/api/v1/supplier-info)
export const supplierInfoApi = {
  getAll: (params) => axiosClient.get('/supplier-info', { params }),
  getById: (id) => axiosClient.get(`/supplier-info/${id}`),
  create: (data) => axiosClient.post('/supplier-info', data),
  update: (id, data) => axiosClient.patch(`/supplier-info/${id}`, data),
  delete: (id) => axiosClient.delete(`/supplier-info/${id}`),
};

// Labels API (/api/v1/labels)
export const labelsApi = {
  createLabel: (data) => axiosClient.post('/labels', data),
};

// Seed API (/api/v1/seed)
export const seedApi = {
  runSeed: () => axiosClient.post('/seed'),
};

// Attachments API (/api/v1/attachments)
export const attachmentsApi = {
  upload: (file, resModel = 'general', resId = '0') => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/attachments/upload?resModel=${encodeURIComponent(resModel)}&resId=${encodeURIComponent(resId)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Users API (/api/v1/users)
export const usersApi = {
  getAll: (params) => axiosClient.get('/users', { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post('/users', data),
  update: (id, data) => axiosClient.patch(`/users/${id}`, data),
  toggleLock: (id) => axiosClient.patch(`/users/${id}/toggle-lock`),
  delete: (id) => axiosClient.delete(`/users/${id}`),
};

// Accounting & Finance API (/api/v1/accounting)
export { accountingApi } from './accountingApi';

// Purchases API (/api/v1/purchases)
export const purchasesApi = {
  getStats: () => axiosClient.get('/purchases/stats'),
  getAll: (params) => axiosClient.get('/purchases', { params }),
  getById: (id) => axiosClient.get(`/purchases/${id}`),
  create: (data) => axiosClient.post('/purchases', data),
  confirm: (id) => axiosClient.post(`/purchases/${id}/confirm`),
  receive: (id) => axiosClient.post(`/purchases/${id}/receive`),
  cancel: (id) => axiosClient.post(`/purchases/${id}/cancel`),
};

// Audit Logs & Chatter API (/api/v1/audit-logs)
export const auditLogsApi = {
  getAll: (params) => axiosClient.get('/audit-logs', { params }),
  getByPoNumber: (poNumber) => axiosClient.get(`/audit-logs/purchase/${poNumber}`),
  getByEntity: (resModel, resId) => axiosClient.get('/audit-logs', { params: { resModel, resId } }),
};

// Sales Orders API (/api/v1/orders)
export const ordersApi = {
  getAll: (params) => axiosClient.get('/orders', { params }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  create: (data) => axiosClient.post('/orders', data),
  confirm: (id) => axiosClient.post(`/orders/${id}/confirm`),
  ship: (id) => axiosClient.post(`/orders/${id}/ship`),
  done: (id) => axiosClient.post(`/orders/${id}/done`),
  cancel: (id) => axiosClient.post(`/orders/${id}/cancel`),
  exportPdf: (id) => axiosClient.get(`/orders/${id}/pdf`, { responseType: 'blob' }),
};

// Inventory & Real-time Stock API (/api/v1/inventory)
export const inventoryApi = {
  getValuation: () => axiosClient.get('/inventory/valuation'),
  getStockMoves: (params) => axiosClient.get('/inventory/stock-moves', { params }),
  getProductStock: (productId) => axiosClient.get(`/inventory/product/${productId}`),
  adjustStock: (data) => axiosClient.post('/inventory/adjust', data),
};

// Stock Pickings API (/api/v1/inventory/pickings)
export const stockPickingsApi = {
  getByOrigin: (origin) => axiosClient.get(`/inventory/pickings/origin/${origin}`),
  getByNumber: (pickingNumber) => axiosClient.get(`/inventory/pickings/number/${pickingNumber}`),
  getAll: (params) => axiosClient.get('/inventory/pickings', { params }),
};

// Dashboard API (/api/v1/dashboard)
export const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard'),
};
