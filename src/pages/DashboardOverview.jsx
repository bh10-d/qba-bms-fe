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
  Empty,
  Space
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
  BoxPlotOutlined,
  WarningOutlined,
  FileTextOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, getRoleCode } from '../context/AuthContext';
import { dashboardApi, productsApi, purchasesApi } from '../api/modulesApi';
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
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  const canViewRevenue = hasLevel(60);

  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [allPurchasesList, setAllPurchasesList] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getStats();
      const resData = res?.data || res;
      setDashboardStats(resData?.data || resData);

      // Fetch Low stock products & pending POs & all POs for cost sum
      const [pRes, poRes, allPoRes] = await Promise.allSettled([
        productsApi.getAll({ limit: 50 }),
        purchasesApi.getAll({ status: 'CONFIRMED' }),
        purchasesApi.getAll({ limit: 100 }),
      ]);

      if (pRes.status === 'fulfilled') {
        const d = pRes.value?.data || pRes.value;
        const list = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setLowStockProducts(list.filter((p) => (p.currentStock ?? p.qtyOnHand ?? 0) < 10).slice(0, 5));
      }

      if (poRes.status === 'fulfilled') {
        const d = poRes.value?.data || poRes.value;
        const list = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setPendingPurchases(list.slice(0, 5));
      }

      if (allPoRes.status === 'fulfilled') {
        const d = allPoRes.value?.data !== undefined ? allPoRes.value.data : allPoRes.value;
        const list = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : (Array.isArray(d?.items) ? d.items : []));
        setAllPurchasesList(list);
      }
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
  const monthlyRevenueChart = allMonthlyChart.slice(-6);

  const recentOrders = (Array.isArray(dashboardStats?.recentOrders) ? dashboardStats.recentOrders : []).slice(0, 5);
  const recentPurchases = (Array.isArray(dashboardStats?.recentPurchases) ? dashboardStats.recentPurchases : []).slice(0, 5);

  const rawPurchaseCost = financials.totalPurchaseCost ?? financials.totalPurchasesCost ?? financials.totalPurchaseAmount ?? financials.totalPurchasesAmount ?? dashboardStats?.totalPurchaseCost ?? dashboardStats?.totalPurchaseAmount;
  const computedFromPoList = allPurchasesList.reduce((acc, po) => acc + Number(po.totalAmount ?? po.amountTotal ?? po.total ?? 0), 0);
  const realTotalPurchaseCost = (rawPurchaseCost !== undefined && rawPurchaseCost !== null && Number(rawPurchaseCost) > 0)
    ? Number(rawPurchaseCost)
    : (computedFromPoList > 0 ? computedFromPoList : (pendingPurchases.length > 0 ? pendingPurchases : recentPurchases).reduce((acc, po) => acc + Number(po.totalAmount ?? po.total ?? 0), 0));

  const formatMonthLabel = (mStr) => {
    if (!mStr) return 'N/A';
    const [year, month] = mStr.split('-');
    return month ? `${month}/${year}` : mStr;
  };

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val || 0));
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
              {t('dashboard.welcome')}, {user?.fullName || user?.name || user?.email || 'Quản trị viên'}
            </h1>
            <p className="text-indigo-200 text-xs mt-0.5 m-0 max-w-xl">
              {t('dashboard.overviewTitle')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <Space wrap className="z-10">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/dashboard/orders')}
              className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-2xs text-xs border-0"
            >
              Tạo Báo Giá Bán
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/purchases')}
              className="bg-indigo-500 hover:bg-indigo-400 font-bold shadow-2xs text-xs border-0"
            >
              Tạo Đơn Mua PO
            </Button>
            <Button
              icon={<SlidersOutlined />}
              onClick={() => navigate('/dashboard/inventory')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs"
            >
              Điều Chỉnh Kho
            </Button>
          </Space>
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
              styles={{ content: { color: '#1e293b', fontWeight: 900, fontSize: '18px' } }}
            />
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-amber-600 font-bold">{formatVND(realTotalPurchaseCost)}</span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/purchases')} className="p-0 h-auto text-[11px] font-bold">
                {t('common.details')} &rarr;
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">{t('dashboard.totalSuppliers')}</span>}
              value={counts.totalSuppliers || 0}
              prefix={<ShopOutlined className="text-purple-600 mr-1.5 text-lg" />}
              styles={{ content: { color: '#1e293b', fontWeight: 900, fontSize: '18px' } }}
            />
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-purple-600 font-bold">Danh bạ NCC</span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/suppliers')} className="p-0 h-auto text-[11px] font-bold">
                {t('common.details')} &rarr;
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Monthly Revenue Trend Chart & Low Stock Alert */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RiseOutlined className="text-emerald-600" /> Biểu Đồ Doanh Thu & Chi Phí Nhập Hàng
              </span>
            }
            className="rounded-xl border-slate-200 shadow-xs h-full"
          >
            {monthlyRevenueChart.length > 0 ? (
              <div className="flex flex-col gap-4 py-2">
                {monthlyRevenueChart.map((m) => {
                  const rev = m.revenue || 0;
                  const cost = m.purchaseCost || 0;
                  const maxVal = Math.max(...monthlyRevenueChart.map((item) => Math.max(item.revenue || 0, item.purchaseCost || 0)), 1);
                  const revPercent = Math.min(Math.round((rev / maxVal) * 100), 100);
                  const costPercent = Math.min(Math.round((cost / maxVal) * 100), 100);

                  return (
                    <div key={m.month} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-slate-800">{formatMonthLabel(m.month)}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-600">Bán: {formatVND(rev)}</span>
                          <span className="font-mono text-amber-600">Mua: {formatVND(cost)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Progress percent={revPercent} strokeColor="#059669" showInfo={false} size="small" />
                        <Progress percent={costPercent} strokeColor="#d97706" showInfo={false} size="small" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Đang cập nhật dữ liệu doanh thu" />
            )}
          </Card>
        </Col>

        {/* Low Stock Alert Widget */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <WarningOutlined className="text-amber-500" /> Cảnh Báo Tồn Kho Sắp Hết (&lt; 10 Cái)
              </span>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/dashboard/products')} className="p-0 text-xs font-bold">
                Tất cả &rarr;
              </Button>
            }
            className="rounded-xl border-slate-200 shadow-xs h-full"
          >
            {lowStockProducts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Mã: {p.defaultCode || p.barcode || 'N/A'}</span>
                    </div>
                    <Tag color="red" className="font-bold text-xs shrink-0">
                      Tồn: {p.currentStock ?? p.qtyOnHand ?? 0} {p.unit || 'Cái'}
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                <CheckCircleOutlined className="text-emerald-500 text-2xl mb-1 block" />
                Tất cả sản phẩm đều đủ số lượng tồn kho khả dụng
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 4. Pending POs & Recent Orders */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingOutlined className="text-indigo-600" /> Đơn Mua Hàng Chờ Tiếp Nhận (Pending POs)
              </span>
            }
            className="rounded-xl border-slate-200 shadow-xs"
          >
            <Table
              dataSource={pendingPurchases.length > 0 ? pendingPurchases : recentPurchases}
              rowKey={(r, idx) => r.id || idx}
              pagination={false}
              size="small"
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn mua hàng (PO)" />,
              }}
              columns={[
                { title: 'Mã PO', dataIndex: 'poNumber', key: 'poNumber', render: (po, r) => <span className="font-mono font-bold text-indigo-700 text-xs">{po || r.name || 'N/A'}</span> },
                { title: 'Nhà Cung Cấp', dataIndex: 'supplierName', key: 'supplierName', render: (s, r) => <span className="font-bold text-xs text-slate-800">{s || r.supplier?.name || 'N/A'}</span> },
                { title: 'Trạng Thái', dataIndex: 'status', key: 'status', render: (st) => st ? <Tag color="amber" className="font-bold text-[10px]">{st}</Tag> : <span className="text-[10px] text-slate-400">N/A</span> },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingCartOutlined className="text-emerald-600" /> Đơn Bán Hàng Mới Nhất
              </span>
            }
            className="rounded-xl border-slate-200 shadow-xs"
          >
            <Table
              dataSource={recentOrders}
              rowKey={(r, idx) => r.id || idx}
              pagination={false}
              size="small"
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn bán hàng (SO)" />,
              }}
              columns={[
                { title: 'Mã Đơn SO', dataIndex: 'orderNumber', key: 'orderNumber', render: (so, r) => <span className="font-mono font-bold text-indigo-700 text-xs">{so || r.name || 'N/A'}</span> },
                { title: 'Khách Hàng', dataIndex: 'customerName', key: 'customerName', render: (c, r) => <span className="font-bold text-xs text-slate-800">{c || r.customer?.name || r.partnerName || 'N/A'}</span> },
                { title: 'Tổng Tiền', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (v, r) => <span className="font-mono font-bold text-emerald-600 text-xs">{formatVND(v ?? r.total)}</span> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardOverview;
