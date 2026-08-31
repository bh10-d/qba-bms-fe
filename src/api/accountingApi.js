import axiosClient from './axiosClient';

export const accountingApi = {
  // Tài khoản Kế toán Thông tư 200/133
  seedAccounts: () => axiosClient.post('/accounting/seed-accounts'),
  getAccounts: () => axiosClient.get('/accounting/accounts'),

  // Hóa đơn Bán hàng & Mua hàng
  getInvoices: () => axiosClient.get('/accounting/invoices'),
  getInvoiceById: (id) => axiosClient.get(`/accounting/invoices/${id}`),
  createInvoice: (data) => axiosClient.post('/accounting/invoices', data),
  postInvoice: (id) => axiosClient.post(`/accounting/invoices/${id}/post`),
  deleteInvoice: (id) => axiosClient.delete(`/accounting/invoices/${id}`),

  // Phiếu Thu / Phiếu Chi
  getPayments: () => axiosClient.get('/accounting/payments'),
  createPayment: (data) => axiosClient.post('/accounting/payments', data),

  // 1-Click Invoice Generation from SO / PO
  createInvoiceFromOrder: (orderId) => axiosClient.post(`/accounting/invoices/from-order/${orderId}`),
  createInvoiceFromPurchase: (purchaseId) => axiosClient.post(`/accounting/invoices/from-purchase/${purchaseId}`),

  // Sổ Bút toán Kế toán Nợ/Có kép
  getJournalEntries: () => axiosClient.get('/accounting/journal-entries'),

  // Báo cáo Tài chính Real-time (P&L, Trial Balance, Partner Balances)
  getProfitAndLossReport: () => axiosClient.get('/accounting/reports/profit-and-loss'),
  getTrialBalanceReport: () => axiosClient.get('/accounting/reports/trial-balance'),
  getPartnerBalancesReport: () => axiosClient.get('/accounting/reports/partner-balances'),
};

export default accountingApi;
