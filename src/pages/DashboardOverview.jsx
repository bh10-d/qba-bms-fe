import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Typography,
  Progress,
  Collapse,
  Empty
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  RiseOutlined,
  DollarOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  BankOutlined,
  BoxPlotOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, getRoleCode } from '../context/AuthContext';
import { dashboardApi } from '../api/modulesApi';
import dayjs from 'dayjs';

const { Text } = Typography;

const ROLE_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const DashboardOverview = () => {
  const { t } = useTranslation();
  const { user, hasLevel } = useAuth();
  const navigate = useNavigate();

  const currentRole = getRoleCode(user);
  const roleColor = ROLE_COLORS[currentRole] || 'blue';
  const isSuperAdmin = currentRole === 'SUPERADMIN';
  const isAdminOrSuper = isSuperAdmin || currentRole === 'ADMIN';

  const canViewRevenue = hasLevel(60);

  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getStats();
      const resData = res?.data || res;
      setDashboardStats(resData?.data || resData);
    } catch (err) {
      console.warn('Fetch dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const financials = dashboardStats?.financials || {};
  const counts = dashboardStats?.counts || {};
  const allMonthlyChart = Array.isArray(dashboardStats?.monthlyRevenueChart) ? dashboardStats.monthlyRevenueChart : [];

  const monthlyRevenueChart = allMonthlyChart.slice(-5);

  const recentOrders = (Array.isArray(dashboardStats?.recentOrders) ? dashboardStats.recentOrders : []).slice(0, 5);
  const recentPurchases = (Array.isArray(dashboardStats?.recentPurchases) ? dashboardStats.recentPurchases : []).slice(0, 5);

  const formatMonthLabel = (mStr) => {
    if (!mStr) return 'N/A';
    const [year, month] = mStr.split('-');
    return month ? `${month}/${year}` : mStr;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Hero Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <ShoppingOutlined style={{ fontSize: '200px' }} />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag color="gold" className="font-extrabold text-[10px] uppercase tracking-wider px-2 py-0 border-0">
                Enterprise BMS Portal
              </Tag>
              <span className="text-indigo-200 text-xs flex items-center gap-1 font-mono">
                <ClockCircleOutlined /> {dayjs().format('DD/MM/YYYY')}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white m-0 tracking-tight">
              {t('dashboard.welcome')}, {user?.fullName || user?.name || user?.email || 'Quản trị viên'} 👋
            </h1>
            <p className="text-indigo-200 text-xs mt-0.5 m-0 max-w-xl">
              {t('dashboard.overviewTitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDashboardData}
              loading={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs"
            >
              {t('common.reload')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/purchases')}
              className="bg-indigo-500 hover:bg-indigo-400 font-bold shadow-2xs text-xs border-0"
            >
              {t('purchases.createNew')}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Executive Stat Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          {canViewRevenue ? (
            <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('dashboard.totalRevenue')}</span>}
                value={financials.totalRevenue || 0}
                precision={0}
                suffix="đ"
                formatter={(val) => Number(val).toLocaleString()}
                prefix={<DollarOutlined className="text-emerald-600 mr-1.5 text-lg" />}
                styles={{ content: { color: '#059669', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
              />
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <RiseOutlined /> {counts.totalOrders || 0} {t('orders.title')}
                </span>
              </div>
            </Card>
          ) : (
            <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('dashboard.totalOrders')}</span>}
                value={counts.totalOrders || 0}
                suffix={t('orders.title')}
                prefix={<ShoppingCartOutlined className="text-emerald-600 mr-1.5 text-lg" />}
                styles={{ content: { color: '#059669', fontWeight: 900, fontSize: '18px' } }}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('dashboard.totalProducts')}</span>}
              value={counts.totalProducts || 0}
              prefix={<InboxOutlined className="text-indigo-600 mr-1.5 text-lg" />}
              styles={{ content: { color: '#1e293b', fontWeight: 900, fontSize: '18px' } }}
            />
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-indigo-600 font-bold">{t('inventory.quantity')}: {Number(counts.totalStockItems || 0).toLocaleString()}</span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/products')} className="p-0 h-auto text-[11px] font-bold">
                {t('common.details')} &rarr;
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('dashboard.totalPurchases')}</span>}
              value={counts.totalPurchases || 0}
              prefix={<ShoppingOutlined className="text-amber-600 mr-1.5 text-lg" />}
              styles={{ content: { color: '#d97706', fontWeight: 900, fontSize: '18px' } }}
            />
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-amber-700 font-semibold">
                {canViewRevenue ? `${(Number(financials.totalPurchases || 0) / 1e9).toFixed(2)}B đ` : `${counts.totalSuppliers || 0} ${t('suppliers.title')}`}
              </span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/purchases')} className="p-0 h-auto text-[11px] font-bold">
                {t('common.view')} &rarr;
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            {canViewRevenue ? (
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('inventory.title')}</span>}
                value={financials.inventoryValue || 0}
                precision={0}
                suffix="đ"
                formatter={(val) => Number(val).toLocaleString()}
                prefix={<BankOutlined className="text-purple-600 mr-1.5 text-lg" />}
                styles={{ content: { color: '#7c3aed', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
              />
            ) : (
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('suppliers.title')}</span>}
                value={`${counts.totalSuppliers || 0}`}
                prefix={<ShopOutlined className="text-purple-600 mr-1.5 text-lg" />}
                styles={{ content: { color: '#7c3aed', fontWeight: 900, fontSize: '16px' } }}
              />
            )}
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-purple-700 font-bold">
                {counts.totalSuppliers || 0} NCC • {counts.totalCustomers || 0} Khách
              </span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/inventory')} className="p-0 h-auto text-[11px] font-bold text-purple-700">
                {t('menu.inventory')} &rarr;
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Quick Action Shortcut Toolbar */}
      <Card title={<span className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><ThunderboltOutlined className="text-amber-500" /> {t('dashboard.quickActions')}</span>} size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <div
              onClick={() => navigate('/dashboard/purchases')}
              className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                <ShoppingOutlined className="text-sm" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600">{t('purchases.createNew')}</div>
                <div className="text-[10px] text-slate-500 truncate">{t('purchases.title')}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div
              onClick={() => navigate('/dashboard/orders')}
              className="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <ShoppingCartOutlined className="text-sm" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-600">{t('orders.createNew')}</div>
                <div className="text-[10px] text-slate-500 truncate">{t('orders.title')}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div
              onClick={() => navigate('/dashboard/inventory')}
              className="p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition-all cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                <InboxOutlined className="text-sm" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-sky-600">{t('inventory.title')}</div>
                <div className="text-[10px] text-slate-500 truncate">{t('inventory.adjustStock')}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div
              onClick={() => navigate('/dashboard/labels')}
              className="p-3 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                <QrcodeOutlined className="text-sm" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-purple-600">{t('labels.title')}</div>
                <div className="text-[10px] text-slate-500 truncate">{t('labels.generate')}</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 4. Monthly Trend vs Activity */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs">{t('dashboard.overviewTitle')}</span>}
            size="small"
            className="rounded-xl border-slate-200 shadow-2xs h-full bg-white"
          >
            {monthlyRevenueChart.length > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] pb-1.5 border-b border-slate-100 font-bold uppercase">
                  <span className="w-24">Month</span>
                  <span className="flex-1 text-center">{t('dashboard.totalRevenue')}</span>
                  <span className="flex-1 text-center">{t('purchases.totalAmount')}</span>
                </div>

                {monthlyRevenueChart.map((row, idx) => {
                  const rev = Number(row.revenue || 0);
                  const purch = Number(row.purchases || 0);
                  return (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 transition-all flex items-center justify-between">
                      <span className="font-bold text-slate-800 w-24">{formatMonthLabel(row.month)}</span>
                      <span className="font-mono text-emerald-600 font-bold flex-1 text-center text-xs">
                        {rev > 0 ? `${rev.toLocaleString()} đ` : '0 đ'}
                      </span>
                      <span className="font-mono text-indigo-600 font-semibold flex-1 text-center text-xs">
                        {purch > 0 ? `${purch.toLocaleString()} đ` : '0 đ'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs">{t('inventory.title')}</span>}
            size="small"
            className="rounded-xl border-slate-200 shadow-2xs h-full bg-white"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center gap-2">
                <BoxPlotOutlined className="text-indigo-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{t('products.title')}</div>
                  <div className="font-mono font-black text-indigo-900 text-sm">{counts.totalProducts || 0}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center gap-2">
                <InboxOutlined className="text-emerald-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{t('inventory.quantity')}</div>
                  <div className="font-mono font-black text-emerald-900 text-sm">{Number(counts.totalStockItems || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center gap-2">
                <ShoppingCartOutlined className="text-sky-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{t('orders.title')}</div>
                  <div className="font-mono font-black text-sky-900 text-sm">{counts.totalOrders || 0}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center gap-2">
                <ShoppingOutlined className="text-amber-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{t('purchases.title')}</div>
                  <div className="font-mono font-black text-amber-900 text-sm">{counts.totalPurchases || 0}</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 5. Recent Activity */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><ShoppingCartOutlined className="text-emerald-600" /> {t('dashboard.recentOrders')}</span>}
            size="small"
            extra={
              <Button type="link" onClick={() => navigate('/dashboard/orders')} className="p-0 font-bold text-xs">
                {t('common.view')} &rarr;
              </Button>
            }
            className="rounded-xl border-slate-200 shadow-2xs bg-white"
          >
            {recentOrders.length > 0 ? (
              <Table
                dataSource={recentOrders}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: t('orders.reference'),
                    dataIndex: 'orderNumber',
                    key: 'orderNumber',
                    render: (num, r) => (
                      <span className="font-mono font-bold text-emerald-700 text-xs">{num || `S-${r.id?.slice(0, 5)}`}</span>
                    ),
                  },
                  {
                    title: t('orders.customer'),
                    dataIndex: 'customerName',
                    key: 'customerName',
                    render: (c) => <span className="font-bold text-slate-800 text-xs">{c || 'Retail'}</span>,
                  },
                  {
                    title: t('orders.amount'),
                    key: 'totalAmount',
                    render: (_, r) => (
                      <span className="font-mono font-bold text-emerald-600 text-xs">
                        {Number(r.totalAmount || 0).toLocaleString()} đ
                      </span>
                    ),
                  },
                  {
                    title: t('common.status'),
                    dataIndex: 'status',
                    key: 'status',
                    render: (st) => <Tag color={st === 'CONFIRMED' ? 'green' : 'default'} className="font-bold text-[10px]">{st}</Tag>,
                  },
                ]}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><ShoppingOutlined className="text-indigo-600" /> {t('dashboard.recentPurchases')}</span>}
            size="small"
            extra={
              <Button type="link" onClick={() => navigate('/dashboard/purchases')} className="p-0 font-bold text-xs">
                {t('common.view')} &rarr;
              </Button>
            }
            className="rounded-xl border-slate-200 shadow-2xs bg-white"
          >
            {recentPurchases.length > 0 ? (
              <Table
                dataSource={recentPurchases}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: t('purchases.reference'),
                    dataIndex: 'poNumber',
                    key: 'poNumber',
                    render: (po, r) => (
                      <span className="font-mono font-bold text-indigo-700 text-xs">{po || `PO-${r.id?.slice(0, 5)}`}</span>
                    ),
                  },
                  {
                    title: t('purchases.supplier'),
                    dataIndex: 'supplierName',
                    key: 'supplierName',
                    render: (s) => <span className="font-bold text-slate-800 text-xs">{s || 'N/A'}</span>,
                  },
                  {
                    title: t('purchases.amount'),
                    key: 'totalAmount',
                    render: (_, r) => (
                      <span className="font-mono font-bold text-indigo-600 text-xs">
                        {Number(r.totalAmount || 0).toLocaleString()} đ
                      </span>
                    ),
                  },
                  {
                    title: t('common.status'),
                    dataIndex: 'status',
                    key: 'status',
                    render: (st) => <Tag color={st === 'CONFIRMED' || st === 'DONE' ? 'green' : 'default'} className="font-bold text-[10px]">{st}</Tag>,
                  },
                ]}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardOverview;
