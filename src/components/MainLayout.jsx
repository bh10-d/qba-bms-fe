import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Tag, Input, Badge, Button, Breadcrumb, Tooltip } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ApiOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CarOutlined,
  BoxPlotOutlined,
  ShopOutlined,
  QrcodeOutlined,
  KeyOutlined,
  BookOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useAuth, getRoleCode } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const ROLE_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = getRoleCode(user);
  const roleColor = ROLE_COLORS[currentRole] || 'blue';
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  // Memoized Sidebar Menu Items filtered strictly by dynamic role levels
  const menuItems = useMemo(() => {
    const rawItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng Quan (Dashboard)',
        roles: ['USER'], // Level >= 20
      },
      { type: 'divider' },
      {
        key: '/dashboard/brands',
        icon: <TagsOutlined />,
        label: 'Thương Hiệu (Brands)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/engines',
        icon: <ThunderboltOutlined />,
        label: 'Động Cơ (Engines)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/gearboxes',
        icon: <SettingOutlined />,
        label: 'Hộp Số (Gearboxes)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/vehicles',
        icon: <CarOutlined />,
        label: 'Dòng Xe (Vehicles)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/products',
        icon: <BoxPlotOutlined />,
        label: 'Phụ Tùng / Sản Phẩm',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/orders',
        icon: <ShoppingCartOutlined />,
        label: 'Đơn Bán Hàng (Sales Orders)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/purchases',
        icon: <ShoppingOutlined />,
        label: 'Đơn Mua Hàng (Purchases)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/inventory',
        icon: <InboxOutlined />,
        label: 'Quản Lý Kho (Inventory)',
        roles: ['USER'], // Level >= 20
      },
      {
        key: '/dashboard/suppliers',
        icon: <ShopOutlined />,
        label: 'Nhà Cung Cấp (Suppliers)',
        roles: ['MANAGER'], // Level >= 60 (Manager, Admin, SuperAdmin)
      },
      {
        key: '/dashboard/accounting',
        icon: <BookOutlined />,
        label: 'Kế Toán & Hóa Đơn (TT200)',
        roles: ['MANAGER'], // Level >= 60 (Manager, Admin, SuperAdmin)
      },
      {
        key: '/dashboard/labels',
        icon: <QrcodeOutlined />,
        label: 'Wizard Tạo Tem Nhãn',
        roles: ['STAFF'], // Level >= 40 (Staff, Manager, Admin, SuperAdmin)
      },
      { type: 'divider' },
      {
        key: '/dashboard/roles',
        icon: <KeyOutlined />,
        label: 'Quản Lý Vai Trò (Roles)',
        roles: ['ADMIN'], // Level >= 80 (Admin, SuperAdmin)
      },
      {
        key: '/dashboard/users',
        icon: <TeamOutlined />,
        label: 'Quản Lý Người Dùng',
        roles: ['ADMIN'], // Level >= 80 (Admin, SuperAdmin)
      },
      {
        key: '/dashboard/api-console',
        icon: <ApiOutlined />,
        label: 'API & Seed Console (Dev)',
        roles: ['SUPERADMIN'], // Level >= 100
      },
      {
        key: '/dashboard/profile',
        icon: <UserOutlined />,
        label: 'Hồ Sơ Cá Nhân',
        roles: ['USER'], // Level >= 20
      },
    ];

    return rawItems.filter((item) => {
      if (!item.roles) return true;
      return hasRole(item.roles);
    });
  }, [hasRole]);

  const userDropdownItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Thông tin cá nhân',
        onClick: () => navigate('/dashboard/profile'),
      },
      ...(isSuperAdmin
        ? [
          {
            key: 'api',
            icon: <ApiOutlined />,
            label: 'API Console (Dev Debug)',
            onClick: () => navigate('/dashboard/api-console'),
          },
        ]
        : []),
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        danger: true,
        label: 'Đăng xuất',
        onClick: logout,
      },
    ],
    [isSuperAdmin, navigate, logout]
  );

  const breadcrumbTitle = useMemo(() => {
    switch (location.pathname) {
      case '/dashboard/brands':
        return 'Quản Lý Thương Hiệu';
      case '/dashboard/engines':
        return 'Quản Lý Động Cơ';
      case '/dashboard/gearboxes':
        return 'Quản Lý Hộp Số';
      case '/dashboard/vehicles':
        return 'Quản Lý Dòng Xe';
      case '/dashboard/products':
        return 'Quản Lý Phụ Tùng / Sản Phẩm';
      case '/dashboard/orders':
        return 'Quản Lý Đơn Bán Hàng & Báo Giá';
      case '/dashboard/purchases':
        return 'Quản Lý Đơn Mua Hàng NCC';
      case '/dashboard/inventory':
        return 'Quản Lý Kho & Tồn Kho Real-time';
      case '/dashboard/suppliers':
        return 'Quản Lý Nhà Cung Cấp';
      case '/dashboard/accounting':
        return 'Phân Hệ Kế Toán & Tài Chính';
      case '/dashboard/labels':
        return 'Wizard Tạo Tem Nhãn Sản Phẩm';
      case '/dashboard/roles':
        return 'Quản Lý Vai Trò Hệ Thống';
      case '/dashboard/users':
        return 'Quản Lý Người Dùng';
      case '/dashboard/api-console':
        return 'API Console & Debug Tool';
      case '/dashboard/profile':
        return 'Hồ Sơ Cá Nhân';
      default:
        return 'Tổng Quan Báo Cáo';
    }
  }, [location.pathname]);

  return (
    <Layout className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={250}
        style={{
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100,
        }}
        className="border-r border-slate-200 shadow-2xs"
      >
        <div className="h-full flex flex-col justify-between">
          {/* Top Fixed Logo Area & Inner Toggle Button */}
          <div className={`shrink-0 border-b border-slate-100 bg-white transition-all ${collapsed ? 'py-3 px-2 flex flex-col items-center gap-2 justify-center' : 'h-16 px-3 flex items-center justify-between'}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src="/icon-square.png" alt="QBA Logo" className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 border border-slate-200 shrink-0 shadow-2xs" />
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                    QBA BMS Portal
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">Hệ Thống Quản Lý Enterprise</div>
                </div>
              )}
            </div>

            <Tooltip title={collapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"} placement="right">
              <Button
                type="text"
                size="small"
                icon={collapsed ? <MenuUnfoldOutlined className="text-indigo-600 text-base" /> : <MenuFoldOutlined className="text-slate-500 hover:text-indigo-600 text-base" />}
                onClick={() => setCollapsed(!collapsed)}
                className={`flex items-center justify-center rounded-lg hover:bg-slate-100 shrink-0 ${collapsed ? 'w-9 h-8 bg-indigo-50/80 border border-indigo-100' : 'w-8 h-8'}`}
              />
            </Tooltip>
          </div>

          {/* Middle Scrollable Menu */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ border: 0 }}
              className="font-medium text-slate-600 text-xs"
            />
          </div>

          {/* Bottom Fixed Connection Card */}
          {!collapsed && (
            <div className="p-3 shrink-0 border-t border-slate-100 bg-slate-50/80 m-2 rounded-xl">
              <div className="flex items-center gap-2 mb-0.5">
                <CheckCircleOutlined className="text-emerald-500 text-xs" />
                <span className="text-xs font-bold text-slate-800">
                  {isSuperAdmin ? 'Backend Connected' : 'Hệ Thống Hoạt Động'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {isSuperAdmin ? 'v1.0.0 • NestJS & Redis' : 'QBA BMS Enterprise Portal'}
              </div>
            </div>
          )}
        </div>
      </Sider>

      {/* Main Layout Container */}
      <Layout className="bg-slate-50">
        {/* Top Header */}
        <Header
          style={{ background: '#ffffff', height: '64px', lineHeight: '64px' }}
          className="border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs"
        >
          <div className="flex items-center gap-4">
            <Breadcrumb
              items={[
                { title: <span className="text-slate-500 font-medium">BMS Portal</span> },
                { title: <span className="text-slate-800 font-bold">{breadcrumbTitle}</span> },
              ]}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* <div className="hidden md:block w-64">
              <Input
                placeholder="Tìm kiếm dữ liệu..."
                prefix={<SearchOutlined className="text-slate-400" />}
                className="rounded-full bg-slate-50 border-slate-200 text-xs"
              />
            </div> */}

            {/* <Tooltip title="Thông báo hệ thống">
              <Badge count={2} size="small">
                <Button type="text" shape="circle" icon={<BellOutlined />} className="text-slate-600" />
              </Badge>
            </Tooltip> */}

            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

            {/* User Profile Dropdown */}
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
              <div className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                <Avatar style={{ backgroundColor: '#4f46e5' }} size="small" icon={<UserOutlined />}>
                  {user?.name?.[0] || user?.fullName?.[0] || 'U'}
                </Avatar>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                    {user?.fullName || user?.name || user?.email}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {user?.email}
                  </span>
                </div>
                <Tag color={roleColor} className="m-0 text-[10px] font-bold py-0 px-1.5 uppercase">
                  {currentRole}
                </Tag>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Area */}
        <Content className="p-6 lg:p-8 max-w-[1800px] w-full mx-auto min-h-[calc(100vh-64px)]">
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
