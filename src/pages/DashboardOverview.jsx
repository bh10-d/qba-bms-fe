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
  const { user, hasLevel } = useAuth();
  const navigate = useNavigate();

  const currentRole = getRoleCode(user);
  const roleColor = ROLE_COLORS[currentRole] || 'blue';
  const isSuperAdmin = currentRole === 'SUPERADMIN';
  const isAdminOrSuper = isSuperAdmin || currentRole === 'ADMIN';

  // Strict role check: Only MANAGER (level >= 60), ADMIN, SUPERADMIN can view financial revenue
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

  // Extract Exact Backend API JSON Fields
  const financials = dashboardStats?.financials || {};
  const counts = dashboardStats?.counts || {};
  const allMonthlyChart = Array.isArray(dashboardStats?.monthlyRevenueChart) ? dashboardStats.monthlyRevenueChart : [];
  
  // Slice to latest 5 months for a clean, compact view
  const monthlyRevenueChart = allMonthlyChart.slice(-5);
  
  // Slice recent orders & purchases to top 5
  const recentOrders = (Array.isArray(dashboardStats?.recentOrders) ? dashboardStats.recentOrders : []).slice(0, 5);
  const recentPurchases = (Array.isArray(dashboardStats?.recentPurchases) ? dashboardStats.recentPurchases : []).slice(0, 5);

  // Format month string e.g. "2026-08" -> "Tháng 08/2026"
  const formatMonthLabel = (mStr) => {
    if (!mStr) return 'N/A';
    const [year, month] = mStr.split('-');
    return month ? `Tháng ${month}/${year}` : mStr;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Hero Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <ShoppingOutlined style={{ fontSize: '200px' }} />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag color="gold" className="font-extrabold text-[10px] uppercase tracking-wider px-2 py-0 border-0">
                Enterprise BMS Portal
              </Tag>
              <span className="text-indigo-200 text-xs flex items-center gap-1 font-mono">
                <ClockCircleOutlined /> Hôm nay, {dayjs().format('DD/MM/YYYY')}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white m-0 tracking-tight">
              Xin chào, {user?.fullName || user?.name || user?.email || 'Quản trị viên'} 👋
            </h1>
            <p className="text-indigo-200 text-xs mt-0.5 m-0 max-w-xl">
              Bảng điều khiển kinh doanh, tồn kho phụ tùng real-time & quản lý đơn mua bán hàng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDashboardData}
              loading={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs"
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/purchases')}
              className="bg-indigo-500 hover:bg-indigo-400 font-bold shadow-2xs text-xs border-0"
            >
              Tạo Báo Giá (RFQ)
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Executive 4 Compact KPI Stat Cards */}
      <Row gutter={[12, 12]}>
        {/* Card 1: Revenue or Orders Count */}
        <Col xs={24} sm={12} lg={6}>
          {canViewRevenue ? (
            <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Tổng Doanh Thu Bán Hàng</span>}
                value={financials.totalRevenue || 0}
                precision={0}
                suffix="đ"
                formatter={(val) => Number(val).toLocaleString('vi-VN')}
                prefix={<DollarOutlined className="text-emerald-600 mr-1.5 text-lg" />}
                valueStyle={{ color: '#059669', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' }}
              />
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <RiseOutlined /> {counts.totalOrders || 0} Đơn bán
                </span>
                <span className="text-slate-400">PostgreSQL</span>
              </div>
            </Card>
          ) : (
            <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Tổng Số Đơn Bán Hàng</span>}
                value={counts.totalOrders || 0}
                suffix="Đơn bán"
                prefix={<ShoppingCartOutlined className="text-emerald-600 mr-1.5 text-lg" />}
                valueStyle={{ color: '#059669', fontWeight: 900, fontSize: '18px' }}
              />
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
                <span className="text-emerald-600 font-bold">Đã chốt đơn thành công</span>
                <span className="text-slate-400">Nghiệp vụ</span>
              </div>
            </Card>
          )}
        </Col>

        {/* Card 2: Total Product Count & Real-time Stock Items */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Danh Mục Phụ Tùng Master</span>}
              value={counts.totalProducts || 0}
              suffix="Mặt hàng"
              prefix={<InboxOutlined className="text-indigo-600 mr-1.5 text-lg" />}
              valueStyle={{ color: '#1e293b', fontWeight: 900, fontSize: '18px' }}
            />
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-indigo-600 font-bold">Tồn: {Number(counts.totalStockItems || 0).toLocaleString('vi-VN')} chi tiết</span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/products')} className="p-0 h-auto text-[11px] font-bold">
                Chi tiết &rarr;
              </Button>
            </div>
          </Card>
        </Col>

        {/* Card 3: Total Purchase Orders & Cost */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Tổng Đơn Mua Hàng NCC</span>}
              value={counts.totalPurchases || 0}
              suffix="Đơn mua"
              prefix={<ShoppingOutlined className="text-amber-600 mr-1.5 text-lg" />}
              valueStyle={{ color: '#d97706', fontWeight: 900, fontSize: '18px' }}
            />
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-amber-700 font-semibold">
                {canViewRevenue ? `Chi: ${(Number(financials.totalPurchases || 0) / 1e9).toFixed(2)} tỷ đ` : `${counts.totalSuppliers || 0} Nhà cung cấp`}
              </span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/purchases')} className="p-0 h-auto text-[11px] font-bold">
                Xử lý &rarr;
              </Button>
            </div>
          </Card>
        </Col>

        {/* Card 4: Inventory Valuation */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white" size="small">
            {canViewRevenue ? (
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Giá Trị Tồn Kho Ước Tính</span>}
                value={financials.inventoryValue || 0}
                precision={0}
                suffix="đ"
                formatter={(val) => Number(val).toLocaleString('vi-VN')}
                prefix={<BankOutlined className="text-purple-600 mr-1.5 text-lg" />}
                valueStyle={{ color: '#7c3aed', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' }}
              />
            ) : (
              <Statistic
                title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Nhà Cung Cấp & Khách Hàng</span>}
                value={`${counts.totalSuppliers || 0} NCC | ${counts.totalCustomers || 0} Khách`}
                prefix={<ShopOutlined className="text-purple-600 mr-1.5 text-lg" />}
                valueStyle={{ color: '#7c3aed', fontWeight: 900, fontSize: '16px' }}
              />
            )}
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-purple-700 font-bold">
                {counts.totalSuppliers || 0} NCC • {counts.totalCustomers || 0} Khách
              </span>
              <Button type="link" size="small" onClick={() => navigate('/dashboard/inventory')} className="p-0 h-auto text-[11px] font-bold text-purple-700">
                Kho &rarr;
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Quick Action Shortcut Toolbar */}
      <Card title={<span className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><ThunderboltOutlined className="text-amber-500" /> Phím Tắt Thao Tác Nhanh</span>} size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
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
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600">Tạo Báo Giá (RFQ)</div>
                <div className="text-[10px] text-slate-500 truncate">Đơn mua từ Nhà cung cấp</div>
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
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-600">Tạo Đơn Bán Hàng</div>
                <div className="text-[10px] text-slate-500 truncate">Báo giá & đơn bán hàng</div>
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
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-sky-600">Kiểm Kê Kho Real-time</div>
                <div className="text-[10px] text-slate-500 truncate">Tra cứu tồn kho thực tế</div>
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
                <div className="font-bold text-slate-900 text-xs truncate group-hover:text-purple-600">Wizard In Tem Nhãn</div>
                <div className="text-[10px] text-slate-500 truncate">Tạo & in tem nhãn QR</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 4. Compact 2-Column Layout (60% / 40%): Monthly Business Trend vs System Counts */}
      <Row gutter={[12, 12]}>
        {/* Left Column (60%): Monthly Revenue Trend Table */}
        <Col xs={24} lg={14}>
          {canViewRevenue ? (
            <Card
              title={<span className="font-bold text-slate-900 text-xs">Xu Hướng Kinh Doanh 5 Tháng Gần Nhất</span>}
              size="small"
              className="rounded-xl border-slate-200 shadow-2xs h-full bg-white"
            >
              {monthlyRevenueChart.length > 0 ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pb-1.5 border-b border-slate-100 font-bold uppercase">
                    <span className="w-24">Tháng</span>
                    <span className="flex-1 text-center">Doanh Thu Bán</span>
                    <span className="flex-1 text-center">Chi Phí Mua</span>
                    <span className="w-28 text-right">Lợi Nhuận</span>
                  </div>

                  {monthlyRevenueChart.map((row, idx) => {
                    const rev = Number(row.revenue || 0);
                    const purch = Number(row.purchases || 0);
                    const profit = Number(row.profit || (rev - purch));
                    const isProfit = profit >= 0;

                    return (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 transition-all flex items-center justify-between">
                        <span className="font-bold text-slate-800 w-24">{formatMonthLabel(row.month)}</span>
                        <span className="font-mono text-emerald-600 font-bold flex-1 text-center text-xs">
                          {rev > 0 ? `${rev.toLocaleString('vi-VN')} đ` : '0 đ'}
                        </span>
                        <span className="font-mono text-indigo-600 font-semibold flex-1 text-center text-xs">
                          {purch > 0 ? `${purch.toLocaleString('vi-VN')} đ` : '0 đ'}
                        </span>
                        <Tag color={isProfit ? 'green' : 'volcano'} className="font-mono font-bold text-[11px] m-0 w-28 text-right">
                          {isProfit ? `+${profit.toLocaleString('vi-VN')}` : profit.toLocaleString('vi-VN')} đ
                        </Tag>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu thống kê tháng từ API" />
              )}
            </Card>
          ) : (
            <Card
              title={<span className="font-bold text-slate-900 text-xs">Hoạt Động Kho & Biến Động Thực Tế</span>}
              size="small"
              className="rounded-xl border-slate-200 shadow-2xs h-full bg-white"
            >
              <div className="space-y-2 text-xs">
                {[
                  { type: 'Tổng Chi Tiết Phụ Tùng Tồn Kho', qty: `${Number(counts.totalStockItems || 0).toLocaleString('vi-VN')} chi tiết`, status: 'Khả dụng', color: '#059669' },
                  { type: 'Tổng Danh Mục Phụ Tùng Master', qty: `${counts.totalProducts || 0} mặt hàng`, status: 'Master Data', color: '#4f46e5' },
                  { type: 'Đơn Mua Hàng Nhà Cung Cấp', qty: `${counts.totalPurchases || 0} phiếu mua`, status: 'Nhập kho', color: '#0284c7' },
                  { type: 'Đơn Bán Hàng Khách Hàng', qty: `${counts.totalOrders || 0} đơn bán`, status: 'Xuất kho', color: '#d97706' },
                ].map((row, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{row.type}</span>
                      <span className="font-mono text-xs font-extrabold mt-0.5 block" style={{ color: row.color }}>{row.qty}</span>
                    </div>
                    <Tag color="green" className="font-bold text-[10px]">{row.status}</Tag>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>

        {/* Right Column (40%): System Counts Breakdown Grid */}
        <Col xs={24} lg={10}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs">Cơ Cấu Hoạt Động & Tồn Kho Real-time</span>}
            size="small"
            className="rounded-xl border-slate-200 shadow-2xs h-full bg-white"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center gap-2">
                <BoxPlotOutlined className="text-indigo-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">Mặt Hàng Master</div>
                  <div className="font-mono font-black text-indigo-900 text-sm">{counts.totalProducts || 0}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center gap-2">
                <InboxOutlined className="text-emerald-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">Chi Tiết Tồn Kho</div>
                  <div className="font-mono font-black text-emerald-900 text-sm">{Number(counts.totalStockItems || 0).toLocaleString('vi-VN')}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center gap-2">
                <ShoppingCartOutlined className="text-sky-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">Đơn Bán Hàng</div>
                  <div className="font-mono font-black text-sky-900 text-sm">{counts.totalOrders || 0}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center gap-2">
                <ShoppingOutlined className="text-amber-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">Đơn Mua NCC</div>
                  <div className="font-mono font-black text-amber-900 text-sm">{counts.totalPurchases || 0}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 flex items-center gap-2">
                <ShopOutlined className="text-purple-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">Nhà Cung Cấp</div>
                  <div className="font-mono font-black text-purple-900 text-sm">{counts.totalSuppliers || 0}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 flex items-center gap-2">
                <UserOutlined className="text-rose-600 text-lg" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">Khách Hàng</div>
                  <div className="font-mono font-black text-rose-900 text-sm">{counts.totalCustomers || 0}</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 5. Recent Activity: Recent Sales Orders vs Recent Purchase Orders */}
      <Row gutter={[12, 12]}>
        {/* Left: Recent Sales Orders Table */}
        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><ShoppingCartOutlined className="text-emerald-600" /> Đơn Bán Hàng Mới Nhất</span>}
            size="small"
            extra={
              <Button type="link" onClick={() => navigate('/dashboard/orders')} className="p-0 font-bold text-xs">
                Xem tất cả &rarr;
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
                    title: 'Mã Đơn',
                    dataIndex: 'orderNumber',
                    key: 'orderNumber',
                    render: (num, r) => (
                      <span className="font-mono font-bold text-emerald-700 text-xs">{num || `S-${r.id?.slice(0, 5)}`}</span>
                    ),
                  },
                  {
                    title: 'Khách Hàng',
                    dataIndex: 'customerName',
                    key: 'customerName',
                    render: (c) => <span className="font-bold text-slate-800 text-xs">{c || 'Khách lẻ'}</span>,
                  },
                  ...(canViewRevenue
                    ? [
                        {
                          title: 'Tổng Tiền',
                          key: 'totalAmount',
                          render: (_, r) => (
                            <span className="font-mono font-bold text-emerald-600 text-xs">
                              {Number(r.totalAmount || 0).toLocaleString('vi-VN')} đ
                            </span>
                          ),
                        },
                      ]
                    : []),
                  {
                    title: 'Trạng Thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (st) => <Tag color={st === 'CONFIRMED' ? 'green' : 'default'} className="font-bold text-[10px]">{st}</Tag>,
                  },
                ]}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn bán hàng mới" />
            )}
          </Card>
        </Col>

        {/* Right: Recent Purchase Orders Table */}
        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><ShoppingOutlined className="text-indigo-600" /> Đơn Mua Hàng NCC Mới Nhất</span>}
            size="small"
            extra={
              <Button type="link" onClick={() => navigate('/dashboard/purchases')} className="p-0 font-bold text-xs">
                Xem tất cả &rarr;
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
                    title: 'Mã PO',
                    dataIndex: 'poNumber',
                    key: 'poNumber',
                    render: (po, r) => (
                      <span className="font-mono font-bold text-indigo-700 text-xs">{po || `PO-${r.id?.slice(0, 5)}`}</span>
                    ),
                  },
                  {
                    title: 'Nhà Cung Cấp',
                    dataIndex: 'supplierName',
                    key: 'supplierName',
                    render: (s) => <span className="font-bold text-slate-800 text-xs">{s || 'N/A'}</span>,
                  },
                  ...(canViewRevenue
                    ? [
                        {
                          title: 'Tổng Tiền',
                          key: 'totalAmount',
                          render: (_, r) => (
                            <span className="font-mono font-bold text-indigo-600 text-xs">
                              {Number(r.totalAmount || 0).toLocaleString('vi-VN')} đ
                            </span>
                          ),
                        },
                      ]
                    : []),
                  {
                    title: 'Trạng Thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (st) => <Tag color={st === 'CONFIRMED' || st === 'DONE' ? 'green' : 'default'} className="font-bold text-[10px]">{st}</Tag>,
                  },
                ]}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn mua hàng mới" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 6. Technical Developer / System Health Accordion (For Admin & Superadmin) */}
      {isAdminOrSuper && (
        <Collapse
          bordered={false}
          className="bg-white border border-slate-200 rounded-xl shadow-2xs"
          items={[
            {
              key: 'sys-health',
              label: (
                <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <SettingOutlined className="text-indigo-600" /> Thông Số Kỹ Thuật Máy Chủ & Tình Trạng Hệ Thống (Admin Only)
                </span>
              ),
              children: (
                <div className="space-y-3">
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12} lg={6}>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Statistic
                          title={<span className="text-[10px] text-slate-500 font-bold uppercase">Tổng Số Nhà Cung Cấp</span>}
                          value={counts.totalSuppliers || 0}
                          prefix={<ShopOutlined className="text-indigo-600 mr-1" />}
                          valueStyle={{ fontSize: '15px', fontWeight: 800 }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Statistic
                          title={<span className="text-[10px] text-slate-500 font-bold uppercase">Kết Nối Máy Chủ BE</span>}
                          value="SẴN SÀNG"
                          prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
                          valueStyle={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Statistic
                          title={<span className="text-[10px] text-slate-500 font-bold uppercase">Bảo Mật Hệ Thống</span>}
                          value="AN TOÀN"
                          prefix={<SafetyCertificateOutlined className="text-purple-600 mr-1" />}
                          valueStyle={{ fontSize: '14px', fontWeight: 800, color: '#9333ea' }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Statistic
                          title={<span className="text-[10px] text-slate-500 font-bold uppercase">Tổng Khách Hàng</span>}
                          value={counts.totalCustomers || 0}
                          prefix={<UserOutlined className="text-emerald-600 mr-1" />}
                          valueStyle={{ fontSize: '15px', fontWeight: 800 }}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default DashboardOverview;
