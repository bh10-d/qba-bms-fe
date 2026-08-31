import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Tag, Input, Badge, Button, Breadcrumb, Tooltip, Segmented } from 'antd';
import { useTranslation } from 'react-i18next';
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
  InboxOutlined,
  GlobalOutlined
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
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = getRoleCode(user);
  const roleColor = ROLE_COLORS[currentRole] || 'blue';
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  // Auto-determine default open submenu based on active route
  const defaultSubmenuKey = useMemo(() => {
    const p = location.pathname;
    if (['/dashboard/purchases', '/dashboard/orders', '/dashboard/inventory', '/dashboard/suppliers'].includes(p)) {
      return 'sub-operations';
    }
    if (['/dashboard/products', '/dashboard/vehicles', '/dashboard/brands', '/dashboard/engines', '/dashboard/gearboxes'].includes(p)) {
      return 'sub-masterdata';
    }
    if (['/dashboard/accounting', '/dashboard/labels'].includes(p)) {
      return 'sub-finance';
    }
    if (['/dashboard/users', '/dashboard/roles', '/dashboard/api-console', '/dashboard/profile'].includes(p)) {
      return 'sub-admin';
    }
    return '';
  }, [location.pathname]);

  const [openKeys, setOpenKeys] = useState(() => (defaultSubmenuKey ? [defaultSubmenuKey] : []));

  useEffect(() => {
    if (defaultSubmenuKey && !openKeys.includes(defaultSubmenuKey) && !menuSearch) {
      setOpenKeys([defaultSubmenuKey]);
    }
  }, [defaultSubmenuKey]);

  // Memoized Sidebar Menu Items grouped into compact Submenus
  const menuItems = useMemo(() => {
    const rawStructure = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: t('menu.dashboard'),
        roles: ['USER'],
      },
      {
        key: 'sub-operations',
        icon: <ShoppingOutlined />,
        label: t('menu.operations'),
        children: [
          {
            key: '/dashboard/purchases',
            icon: <ShoppingOutlined />,
            label: t('menu.purchases'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/orders',
            icon: <ShoppingCartOutlined />,
            label: t('menu.orders'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/inventory',
            icon: <InboxOutlined />,
            label: t('menu.inventory'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/suppliers',
            icon: <ShopOutlined />,
            label: t('menu.suppliers'),
            roles: ['MANAGER'],
          },
        ],
      },
      {
        key: 'sub-masterdata',
        icon: <BoxPlotOutlined />,
        label: t('menu.masterdata'),
        children: [
          {
            key: '/dashboard/products',
            icon: <BoxPlotOutlined />,
            label: t('menu.products'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/vehicles',
            icon: <CarOutlined />,
            label: t('menu.vehicles'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/brands',
            icon: <TagsOutlined />,
            label: t('menu.brands'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/engines',
            icon: <ThunderboltOutlined />,
            label: t('menu.engines'),
            roles: ['USER'],
          },
          {
            key: '/dashboard/gearboxes',
            icon: <SettingOutlined />,
            label: t('menu.gearboxes'),
            roles: ['USER'],
          },
        ],
      },
      {
        key: 'sub-finance',
        icon: <BookOutlined />,
        label: t('menu.financeTools'),
        children: [
          {
            key: '/dashboard/accounting',
            icon: <BookOutlined />,
            label: t('menu.accounting'),
            roles: ['MANAGER'],
          },
          {
            key: '/dashboard/labels',
            icon: <QrcodeOutlined />,
            label: t('menu.labels'),
            roles: ['STAFF'],
          },
        ],
      },
      {
        key: 'sub-admin',
        icon: <TeamOutlined />,
        label: t('menu.systemAdmin'),
        children: [
          {
            key: '/dashboard/users',
            icon: <TeamOutlined />,
            label: t('menu.users'),
            roles: ['ADMIN'],
          },
          {
            key: '/dashboard/roles',
            icon: <KeyOutlined />,
            label: t('menu.roles'),
            roles: ['ADMIN'],
          },
          {
            key: '/dashboard/api-console',
            icon: <ApiOutlined />,
            label: t('menu.apiConsole'),
            roles: ['SUPERADMIN'],
          },
          {
            key: '/dashboard/profile',
            icon: <UserOutlined />,
            label: t('menu.profile'),
            roles: ['USER'],
          },
        ],
      },
    ];

    // 1. Filter by role permissions
    const roleFiltered = rawStructure
      .map((node) => {
        if (!node.children) {
          if (!node.roles) return node;
          return hasRole(node.roles) ? node : null;
        }
        const validChildren = node.children.filter((child) => {
          if (!child.roles) return true;
          return hasRole(child.roles);
        });
        if (validChildren.length === 0) return null;
        return { ...node, children: validChildren };
      })
      .filter(Boolean);

    // 2. Filter by search query if user typed
    if (!menuSearch.trim()) {
      return roleFiltered;
    }

    const q = menuSearch.toLowerCase().trim();
    return roleFiltered
      .map((node) => {
        if (!node.children) {
          const match = String(node.label || '').toLowerCase().includes(q) || String(node.key || '').toLowerCase().includes(q);
          return match ? node : null;
        }
        const matchedChildren = node.children.filter((child) =>
          String(child.label || '').toLowerCase().includes(q) ||
          String(child.key || '').toLowerCase().includes(q)
        );
        if (matchedChildren.length === 0) return null;
        return { ...node, children: matchedChildren };
      })
      .filter(Boolean);
  }, [hasRole, menuSearch, t]);

  const userDropdownItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: t('header.profile'),
        onClick: () => navigate('/dashboard/profile'),
      },
      {
        key: 'language',
        icon: <GlobalOutlined />,
        label: `${i18n.language?.startsWith('en') ? '🇬🇧 English' : '🇻🇳 Tiếng Việt'} (Settings)`,
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
        label: t('header.logout'),
        onClick: logout,
      },
    ],
    [isSuperAdmin, navigate, logout, t, i18n.language]
  );

  const breadcrumbTitle = useMemo(() => {
    switch (location.pathname) {
      case '/dashboard/brands':
        return t('menu.brands');
      case '/dashboard/engines':
        return t('menu.engines');
      case '/dashboard/gearboxes':
        return t('menu.gearboxes');
      case '/dashboard/vehicles':
        return t('menu.vehicles');
      case '/dashboard/products':
        return t('menu.products');
      case '/dashboard/orders':
        return t('menu.orders');
      case '/dashboard/purchases':
        return t('menu.purchases');
      case '/dashboard/inventory':
        return t('menu.inventory');
      case '/dashboard/suppliers':
        return t('menu.suppliers');
      case '/dashboard/accounting':
        return t('menu.accounting');
      case '/dashboard/labels':
        return t('menu.labels');
      case '/dashboard/roles':
        return t('menu.roles');
      case '/dashboard/users':
        return t('menu.users');
      case '/dashboard/api-console':
        return t('menu.apiConsole');
      case '/dashboard/profile':
        return t('menu.profile');
      default:
        return t('menu.dashboard');
    }
  }, [location.pathname, t]);

  return (
    <Layout className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={275}
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
                  <div className="text-[11px] text-slate-500 truncate">{t('header.subTitle')}</div>
                </div>
              )}
            </div>

            <Tooltip title={collapsed ? t('common.reload') : t('common.close')} placement="right">
              <Button
                type="text"
                size="small"
                icon={collapsed ? <MenuUnfoldOutlined className="text-indigo-600 text-base" /> : <MenuFoldOutlined className="text-slate-500 hover:text-indigo-600 text-base" />}
                onClick={() => setCollapsed(!collapsed)}
                className={`flex items-center justify-center rounded-lg hover:bg-slate-100 shrink-0 ${collapsed ? 'w-9 h-8 bg-indigo-50/80 border border-indigo-100' : 'w-8 h-8'}`}
              />
            </Tooltip>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-1">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              openKeys={openKeys}
              onOpenChange={(keys) => setOpenKeys(keys)}
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
                  {isSuperAdmin ? t('header.backendConnected') : t('header.systemActive')}
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
          className="border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs"
        >
          <div className="flex items-center gap-4">
            <Breadcrumb
              items={[
                { title: <span className="text-slate-500 font-medium">{t('header.portal')}</span> },
                { title: <span className="text-slate-800 font-bold">{breadcrumbTitle}</span> },
              ]}
              className="text-xs hidden sm:block"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Dropdown */}
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
              <div className="flex items-center gap-2.5 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
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
        <Content className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto min-h-[calc(100vh-64px)]">
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
