import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Card,
  Space,
  Typography,
  Tooltip,
  Tabs,
  InputNumber,
  Descriptions,
  Drawer,
  Popconfirm,
  Badge,
  notification,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  DollarOutlined,
  BookOutlined,
  BankOutlined,
  SyncOutlined,
  EyeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  BarChartOutlined,
  PieChartOutlined,
  SwapOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth, getRoleCode } from '../context/AuthContext';
import { accountingApi } from '../api/accountingApi';

const { Title, Text } = Typography;

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const n = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(n) ? 0 : n;
};

const AccountingPage = () => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const currentRole = getRoleCode(user);
  const isSuperAdmin = currentRole === 'SUPERADMIN';
  const isWriteAllowed = hasRole(['SUPERADMIN', 'ADMIN', 'MANAGER']);

  // Main Tabs State
  const [activeTab, setActiveTab] = useState('invoices');

  // Data States (Only real API data)
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  // Reports States
  const [pnlReport, setPnlReport] = useState(null);
  const [trialBalanceReport, setTrialBalanceReport] = useState(null);
  const [partnerBalancesReport, setPartnerBalancesReport] = useState(null);

  const [loading, setLoading] = useState(false);

  // Modals & Drawer State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [invoiceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [invPagination, setInvPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [payPagination, setPayPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [jePagination, setJePagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchInvoices = async (p = 1, lim = 10) => {
    try {
      const invRes = await accountingApi.getInvoices({ page: p, limit: lim });
      const rawData = invRes?.data !== undefined ? invRes.data : invRes;
      const invList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = invRes?.total ?? rawData?.total ?? invList.length;
      setInvoices(invList);
      setInvPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('fetchInvoices error:', err);
    }
  };

  const fetchPayments = async (p = 1, lim = 10) => {
    try {
      const payRes = await accountingApi.getPayments({ page: p, limit: lim });
      const rawData = payRes?.data !== undefined ? payRes.data : payRes;
      const payList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = payRes?.total ?? rawData?.total ?? payList.length;
      setPayments(payList);
      setPayPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('fetchPayments error:', err);
    }
  };

  const fetchJournalEntries = async (p = 1, lim = 10) => {
    try {
      const jeRes = await accountingApi.getJournalEntries({ page: p, limit: lim });
      const rawData = jeRes?.data !== undefined ? jeRes.data : jeRes;
      const jeList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = jeRes?.total ?? rawData?.total ?? jeList.length;
      setJournalEntries(jeList);
      setJePagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('fetchJournalEntries error:', err);
    }
  };

  // Fetch Accounting Data from Backend
  const fetchAllAccountingData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchInvoices(1, 10),
        fetchPayments(1, 10),
        fetchJournalEntries(1, 10),
      ]);

      const accRes = await accountingApi.getAccounts().catch(() => null);
      const accData = accRes?.data || accRes;
      const accList = Array.isArray(accData) ? accData : (Array.isArray(accData?.data) ? accData.data : []);
      setAccounts(accList);

      // Fetch Financial Reports
      const pnlRes = await accountingApi.getProfitAndLossReport().catch(() => null);
      setPnlReport(pnlRes?.data || pnlRes || null);

      const tbRes = await accountingApi.getTrialBalanceReport().catch(() => null);
      setTrialBalanceReport(tbRes?.data || tbRes || null);

      const pbRes = await accountingApi.getPartnerBalancesReport().catch(() => null);
      setPartnerBalancesReport(pbRes?.data || pbRes || null);
    } catch (err) {
      console.error('Accounting API fetch error:', err);
      setInvoices([]);
      setPayments([]);
      setAccounts([]);
      setJournalEntries([]);
      setPnlReport(null);
      setTrialBalanceReport(null);
      setPartnerBalancesReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAccountingData();
  }, []);

  const formatVND = (num) => {
    const val = safeNumber(num);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleSeedAccounts = async () => {
    try {
      await accountingApi.seedAccounts();
      notification.success({ title: t('common.success'), message: t('common.success'), description: t('accounting.seedAccounts') });
      fetchAllAccountingData();
    } catch (err) {
      notification.error({ title: t('common.error'), message: t('common.error'), description: err.message });
    }
  };

  const handleCreateInvoice = async (values) => {
    setSubmitting(true);
    try {
      await accountingApi.createInvoice(values);
      notification.success({ title: t('common.success'), message: t('common.success') });
      setIsInvoiceModalOpen(false);
      invoiceForm.resetFields();
      fetchAllAccountingData();
    } catch (err) {
      notification.error({ title: t('common.error'), message: t('common.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePayment = async (values) => {
    setSubmitting(true);
    try {
      await accountingApi.createPayment(values);
      notification.success({ title: t('common.success'), message: t('common.success') });
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      fetchAllAccountingData();
    } catch (err) {
      notification.error({ title: t('common.error'), message: t('common.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostInvoice = async (id) => {
    try {
      await accountingApi.postInvoice(id);
      notification.success({ title: t('common.success'), message: t('common.success') });
      fetchAllAccountingData();
    } catch (err) {
      notification.error({ title: t('common.error'), message: t('common.error'), description: err.message });
    }
  };

  // Values taken 100% directly from BE API pnlReport response
  const revenueValue = safeNumber(pnlReport?.totalRevenue ?? pnlReport?.revenue ?? 0);
  const cogsValue = safeNumber(pnlReport?.cogs ?? pnlReport?.costOfGoodsSold ?? pnlReport?.cost_of_goods_sold ?? pnlReport?.expenses ?? 0);
  const grossProfitValue = safeNumber(pnlReport?.grossProfit ?? 0);
  const netProfitValue = safeNumber(pnlReport?.netProfit ?? 0);

  // Dynamic Trial Balance Rows derived from backend accounts if trialBalanceReport endpoint is not populated
  const trialBalanceRows = Array.isArray(trialBalanceReport?.rows) && trialBalanceReport.rows.length > 0
    ? trialBalanceReport.rows
    : (Array.isArray(trialBalanceReport) && trialBalanceReport.length > 0
      ? trialBalanceReport
      : accounts.map((acc) => ({
          accountCode: acc.code || acc.accountCode || 'N/A',
          accountName: acc.name || acc.accountName || 'N/A',
          debit: acc.type === 'ASSET' || acc.type === 'EXPENSE' ? safeNumber(acc.balance) : 0,
          credit: acc.type === 'LIABILITY' || acc.type === 'EQUITY' || acc.type === 'REVENUE' ? safeNumber(acc.balance) : 0,
        }))
    );

  // 1. Invoices Table Columns
  const invoiceColumns = [
    {
      title: t('accounting.invoiceNumber'),
      key: 'invoiceNumber',
      render: (_, record) => {
        const invNo = record.invoiceNumber || record.invoiceNo || record.code || `INV-${record.id?.slice(0, 6)}`;
        return <span className="font-mono font-bold text-indigo-600">{invNo}</span>;
      },
    },
    {
      title: t('accounting.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'OUT_INVOICE' ? 'green' : 'blue'} className="font-bold">
          {type === 'OUT_INVOICE' ? 'BÁN HÀNG' : 'MUA HÀNG'}
        </Tag>
      ),
    },
    {
      title: t('accounting.partner'),
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (text) => <span className="font-bold text-slate-900 text-sm">{text || 'N/A'}</span>,
    },
    {
      title: t('accounting.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val) => <span className="font-mono font-bold text-slate-900">{formatVND(val)}</span>,
    },
    {
      title: t('accounting.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'DRAFT') color = 'warning';
        if (status === 'POSTED') color = 'processing';
        if (status === 'PAID') color = 'success';
        return <Badge status={color} text={<span className="font-bold text-xs">{status || 'DRAFT'}</span>} />;
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined className="text-indigo-600" />}
              onClick={() => {
                setSelectedInvoice(record);
                setIsDetailDrawerOpen(true);
              }}
            />
          </Tooltip>

          {record.status === 'DRAFT' && isWriteAllowed && (
            <Tooltip title="Ghi sổ (Post)">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined className="text-emerald-600" />}
                onClick={() => handlePostInvoice(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 2. Payments Table Columns
  const paymentColumns = [
    {
      title: t('accounting.voucherNo'),
      key: 'paymentNo',
      render: (_, r) => <span className="font-mono font-bold text-emerald-600">{r.paymentNo || r.code || `PAY-${r.id?.slice(0, 6)}`}</span>,
    },
    {
      title: t('accounting.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'RECEIPT' ? 'green' : 'volcano'} className="font-bold">
          {type === 'RECEIPT' ? 'PHIẾU THU' : 'PHIẾU CHI'}
        </Tag>
      ),
    },
    {
      title: t('accounting.partner'),
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (txt) => <span className="font-bold text-slate-800">{txt || 'Khách lẻ / NCC'}</span>,
    },
    {
      title: t('accounting.totalAmount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => <span className="font-mono font-bold text-emerald-700">{formatVND(val)}</span>,
    },
    {
      title: t('accounting.paymentMethod'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (m) => <Tag color="blue" className="font-bold">{m || 'BANK'}</Tag>,
    },
    {
      title: t('accounting.voucherDate'),
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (d) => <span className="text-xs text-slate-500 font-mono">{d ? String(d).split('T')[0] : 'N/A'}</span>,
    },
  ];

  // 3. Journal Entries Table Columns
  const journalColumns = [
    {
      title: t('accounting.voucherNo'),
      dataIndex: 'entryNo',
      key: 'entryNo',
      render: (num, r) => <span className="font-mono font-bold text-indigo-700">{num || `JE-${r.id?.slice(0, 6)}`}</span>,
    },
    {
      title: t('accounting.voucherDate'),
      dataIndex: 'entryDate',
      key: 'entryDate',
      render: (d) => <span className="text-xs text-slate-500 font-mono">{d ? String(d).split('T')[0] : 'N/A'}</span>,
    },
    {
      title: t('accounting.debit'),
      dataIndex: 'debitAccountCode',
      key: 'debitAccountCode',
      render: (code) => <Tag color="cyan" className="font-mono font-bold">{code || '111'}</Tag>,
    },
    {
      title: t('accounting.credit'),
      dataIndex: 'creditAccountCode',
      key: 'creditAccountCode',
      render: (code) => <Tag color="magenta" className="font-mono font-bold">{code || '511'}</Tag>,
    },
    {
      title: t('accounting.totalAmount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => <span className="font-mono font-bold text-slate-900">{formatVND(val)}</span>,
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      render: (txt) => <span className="text-xs text-slate-600">{txt || 'Ghi sổ kế toán'}</span>,
    },
  ];

  // 4. Chart of Accounts Table Columns
  const accountColumns = [
    {
      title: t('accounting.accountCode'),
      dataIndex: 'code',
      key: 'code',
      render: (code) => <span className="font-mono font-bold text-indigo-600 text-sm">{code}</span>,
    },
    {
      title: t('accounting.accountName'),
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-bold text-slate-900">{name}</span>,
    },
    {
      title: t('accounting.accountType'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="purple" className="font-bold">{type}</Tag>,
    },
    {
      title: t('accounting.balance'),
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => <span className="font-mono font-bold text-slate-800">{formatVND(val)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <BookOutlined className="text-indigo-600" /> {t('accounting.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('accounting.reports')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<SyncOutlined />} onClick={fetchAllAccountingData} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>

          <Button
            type="default"
            icon={<DatabaseOutlined />}
            onClick={handleSeedAccounts}
            className="text-xs font-semibold border-indigo-200 text-indigo-600"
          >
            {t('accounting.seedAccounts')}
          </Button>

          {isWriteAllowed && (
            <>
              <Button
                type="default"
                icon={<DollarOutlined />}
                onClick={() => setIsPaymentModalOpen(true)}
                className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {t('accounting.createPayment')}
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsInvoiceModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm border-0 text-xs"
              >
                {t('accounting.createInvoice')}
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Financial Overview Stats Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('accounting.revenue')}</span>}
              value={revenueValue}
              suffix="đ"
              formatter={(v) => safeNumber(v).toLocaleString('vi-VN')}
              prefix={<RiseOutlined className="text-emerald-600 mr-1.5" />}
              styles={{ content: { color: '#059669', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('accounting.cogs')}</span>}
              value={cogsValue}
              suffix="đ"
              formatter={(v) => safeNumber(v).toLocaleString('vi-VN')}
              prefix={<DollarOutlined className="text-amber-600 mr-1.5" />}
              styles={{ content: { color: '#d97706', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('accounting.grossProfit')}</span>}
              value={grossProfitValue}
              suffix="đ"
              formatter={(v) => safeNumber(v).toLocaleString('vi-VN')}
              prefix={<BarChartOutlined className="text-indigo-600 mr-1.5" />}
              styles={{ content: { color: '#4f46e5', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('accounting.netProfit')}</span>}
              value={netProfitValue}
              suffix="đ"
              formatter={(v) => safeNumber(v).toLocaleString('vi-VN')}
              prefix={<PieChartOutlined className="text-purple-600 mr-1.5" />}
              styles={{ content: { color: '#7c3aed', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'invoices',
              label: (
                <span className="font-bold flex items-center gap-1.5">
                  <FileTextOutlined /> {t('accounting.invoices')} ({invoices.length})
                </span>
              ),
              children: (
                <Table
                  size="middle"
                  columns={invoiceColumns}
                  dataSource={invoices}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: invPagination.page,
                    pageSize: invPagination.limit,
                    total: invPagination.total,
                    onChange: (p, l) => fetchInvoices(p, l),
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
                  }}
                  className="overflow-x-auto"
                />
              ),
            },
            {
              key: 'payments',
              label: (
                <span className="font-bold flex items-center gap-1.5">
                  <DollarOutlined /> {t('accounting.payments')} ({payments.length})
                </span>
              ),
              children: (
                <Table
                  size="middle"
                  columns={paymentColumns}
                  dataSource={payments}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: payPagination.page,
                    pageSize: payPagination.limit,
                    total: payPagination.total,
                    onChange: (p, l) => fetchPayments(p, l),
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
                  }}
                  className="overflow-x-auto"
                />
              ),
            },
            {
              key: 'journal',
              label: (
                <span className="font-bold flex items-center gap-1.5">
                  <SwapOutlined /> {t('accounting.journalEntries')} ({journalEntries.length})
                </span>
              ),
              children: (
                <Table
                  size="middle"
                  columns={journalColumns}
                  dataSource={journalEntries}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: jePagination.page,
                    pageSize: jePagination.limit,
                    total: jePagination.total,
                    onChange: (p, l) => fetchJournalEntries(p, l),
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
                  }}
                  className="overflow-x-auto"
                />
              ),
            },
            {
              key: 'accounts',
              label: (
                <span className="font-bold flex items-center gap-1.5">
                  <BookOutlined /> {t('accounting.chartOfAccounts')} ({accounts.length})
                </span>
              ),
              children: (
                <Table
                  size="middle"
                  columns={accountColumns}
                  dataSource={accounts}
                  rowKey="id"
                  loading={loading}
                  pagination={{ defaultPageSize: 10, showSizeChanger: true }}
                  className="overflow-x-auto"
                />
              ),
            },
            {
              key: 'reports',
              label: (
                <span className="font-bold flex items-center gap-1.5 text-indigo-600">
                  <BarChartOutlined /> {t('accounting.reports')}
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4 py-2">
                  <Tabs
                    type="card"
                    items={[
                      {
                        key: 'pnl',
                        label: <span className="font-bold">{t('accounting.pnl')}</span>,
                        children: (
                          <Card className="rounded-xl border-slate-200">
                            <Descriptions title={t('accounting.pnl')} bordered column={1}>
                              <Descriptions.Item label={t('accounting.revenue')}>
                                <span className="font-mono font-bold text-emerald-600 text-base">{formatVND(revenueValue)}</span>
                              </Descriptions.Item>
                              <Descriptions.Item label={t('accounting.cogs')}>
                                <span className="font-mono font-bold text-amber-600 text-base">{formatVND(cogsValue)}</span>
                              </Descriptions.Item>
                              <Descriptions.Item label={t('accounting.grossProfit')}>
                                <span className="font-mono font-extrabold text-indigo-600 text-base">{formatVND(grossProfitValue)}</span>
                              </Descriptions.Item>
                              <Descriptions.Item label={t('accounting.netProfit')}>
                                <span className="font-mono font-extrabold text-purple-600 text-base">{formatVND(netProfitValue)}</span>
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        ),
                      },
                      {
                        key: 'trialBalance',
                        label: <span className="font-bold">{t('accounting.trialBalance')}</span>,
                        children: (
                          <Table
                            size="small"
                            dataSource={trialBalanceRows}
                            rowKey={(r) => r.accountCode || r.code || r.id || String(Math.random())}
                            pagination={false}
                            columns={[
                              { title: t('accounting.accountCode'), dataIndex: 'accountCode', key: 'accountCode', render: (c) => <Tag color="cyan">{c}</Tag> },
                              { title: t('accounting.accountName'), dataIndex: 'accountName', key: 'accountName' },
                              { title: t('accounting.debit'), dataIndex: 'debit', key: 'debit', render: (v) => formatVND(v) },
                              { title: t('accounting.credit'), dataIndex: 'credit', key: 'credit', render: (v) => formatVND(v) },
                            ]}
                          />
                        ),
                      },
                      {
                        key: 'partnerBalances',
                        label: <span className="font-bold">{t('accounting.partnerBalances')}</span>,
                        children: (
                          <Table
                            size="small"
                            dataSource={Array.isArray(partnerBalancesReport?.rows) ? partnerBalancesReport.rows : (Array.isArray(partnerBalancesReport) ? partnerBalancesReport : [])}
                            rowKey={(r) => r.partnerName || r.partnerId || r.id || String(Math.random())}
                            pagination={false}
                            columns={[
                              { title: t('accounting.partner'), dataIndex: 'partnerName', key: 'partnerName' },
                              { title: t('accounting.debit'), dataIndex: 'receivable', key: 'receivable', render: (v) => formatVND(v) },
                              { title: t('accounting.credit'), dataIndex: 'payable', key: 'payable', render: (v) => formatVND(v) },
                            ]}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{t('accounting.createInvoice')}</span>}
        open={isInvoiceModalOpen}
        onCancel={() => setIsInvoiceModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={invoiceForm} layout="vertical" onFinish={handleCreateInvoice}>
          <Form.Item label={t('accounting.type')} name="type" rules={[{ required: true, message: t('common.required') }]} initialValue="OUT_INVOICE">
            <Select
              options={[
                { label: 'Hóa đơn Bán hàng (OUT_INVOICE)', value: 'OUT_INVOICE' },
                { label: 'Hóa đơn Mua hàng (IN_INVOICE)', value: 'IN_INVOICE' },
              ]}
            />
          </Form.Item>

          <Form.Item label={t('accounting.partner')} name="partnerName" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="Tên Khách Hàng / Nhà Cung Cấp" />
          </Form.Item>

          <Form.Item label={t('accounting.totalAmount')} name="totalAmount" rules={[{ required: true, message: t('common.required') }]}>
            <InputNumber className="w-full" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsInvoiceModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-500 font-bold">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Create Payment Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{t('accounting.createPayment')}</span>}
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleCreatePayment}>
          <Form.Item label={t('accounting.type')} name="type" rules={[{ required: true, message: t('common.required') }]} initialValue="RECEIPT">
            <Select
              options={[
                { label: 'Phiếu Thu (RECEIPT)', value: 'RECEIPT' },
                { label: 'Phiếu Chi (PAYMENT)', value: 'PAYMENT' },
              ]}
            />
          </Form.Item>

          <Form.Item label={t('accounting.partner')} name="partnerName" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="Tên Khách Hàng / NCC" />
          </Form.Item>

          <Form.Item label={t('accounting.totalAmount')} name="amount" rules={[{ required: true, message: t('common.required') }]}>
            <InputNumber className="w-full" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>

          <Form.Item label={t('accounting.paymentMethod')} name="paymentMethod" initialValue="BANK">
            <Select
              options={[
                { label: 'Chuyển Khoản Ngân Hàng (BANK)', value: 'BANK' },
                { label: 'Tiền Mặt (CASH)', value: 'CASH' },
              ]}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsPaymentModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-emerald-600 hover:bg-emerald-500 font-bold">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Invoice Details Drawer */}
      <Drawer
        title={<span className="font-bold text-slate-900 text-lg">{t('accounting.invoiceNumber')}</span>}
        placement="right"
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        size="large"
      >
        {selectedInvoice && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-900 text-sm">{selectedInvoice.partnerName}</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">MST: {selectedInvoice.partnerTaxCode || '0101234567'}</div>
            </div>

            <Descriptions column={1} bordered className="rounded-xl overflow-hidden">
              <Descriptions.Item label={t('accounting.totalAmount')}>
                <span className="font-mono font-extrabold text-base text-emerald-600">{formatVND(selectedInvoice.totalAmount)}</span>
              </Descriptions.Item>
              <Descriptions.Item label={t('accounting.status')}>
                <Tag color="green" className="font-bold">{selectedInvoice.status || 'DRAFT'}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 && (
              <Table
                dataSource={selectedInvoice.items}
                rowKey={(item) => item.productCode || item.productName}
                pagination={false}
                size="small"
                columns={[
                  { title: t('products.name'), dataIndex: 'productName', key: 'productName' },
                  { title: t('purchases.quantity'), dataIndex: 'quantity', key: 'quantity', align: 'center' },
                  { title: t('products.unitPrice'), dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => formatVND(v) },
                ]}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AccountingPage;
