import axiosClient from './axiosClient';

export const accountingApi = {
  // Tài khoản Kế toán Thông tư 200/133
  seedAccounts: () => axiosClient.post('/accounting/seed-accounts'),
  getAccounts: (params) => axiosClient.get('/accounting/accounts', { params }),

  // Hóa đơn Bán hàng & Mua hàng
  getInvoices: (params) => axiosClient.get('/accounting/invoices', { params }),
  getInvoiceById: (id) => axiosClient.get(`/accounting/invoices/${id}`),
  createInvoice: (data) => axiosClient.post('/accounting/invoices', data),
  postInvoice: (id) => axiosClient.post(`/accounting/invoices/${id}/post`),
  deleteInvoice: (id) => axiosClient.delete(`/accounting/invoices/${id}`),

  // Phiếu Thu / Phiếu Chi
  getPayments: (params) => axiosClient.get('/accounting/payments', { params }),
  createPayment: (data) => axiosClient.post('/accounting/payments', data),

  // 1-Click Invoice Generation from SO / PO
  createInvoiceFromOrder: (orderId) => axiosClient.post(`/accounting/invoices/from-order/${orderId}`),
  createInvoiceFromPurchase: (purchaseId) => axiosClient.post(`/accounting/invoices/from-purchase/${purchaseId}`),

  // Sổ Bút toán Kế toán Nợ/Có kép
  getJournalEntries: (params) => axiosClient.get('/accounting/journal-entries', { params }),

  // Báo cáo Tài chính Real-time (P&L, Trial Balance, Partner Balances)
  getProfitAndLossReport: () => axiosClient.get('/accounting/reports/profit-and-loss'),
  getTrialBalanceReport: () => axiosClient.get('/accounting/reports/trial-balance'),
  getPartnerBalancesReport: () => axiosClient.get('/accounting/reports/partner-balances'),
};

export default accountingApi;
