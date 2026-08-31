import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme, notification } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardOverview from './pages/DashboardOverview';
import BrandsPage from './pages/BrandsPage';
import EnginesPage from './pages/EnginesPage';
import GearboxesPage from './pages/GearboxesPage';
import VehiclesPage from './pages/VehiclesPage';
import ProductsPage from './pages/ProductsPage';
import SupplierInfoPage from './pages/SupplierInfoPage';
import LabelWizardPage from './pages/LabelWizardPage';
import AccountingPage from './pages/AccountingPage';
import PurchasesPage from './pages/PurchasesPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import RolesManagementPage from './pages/RolesManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ApiConsolePage from './pages/ApiConsolePage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Configure global AntD Notification duration (1.5s) and placement (topRight)
notification.config({
  placement: 'topRight',
  duration: 1.5,
  top: 75,
  maxCount: 3,
});

// Static theme configuration outside component to prevent CSS-in-JS recalculations on route changes
const ANTD_THEME_CONFIG = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#4f46e5',
    borderRadius: 10,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorTextHeading: '#0f172a',
    colorText: '#334155',
    colorBorderSecondary: '#e2e8f0',
  },
  components: {
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
    },
    Table: {
      borderRadius: 10,
      headerBg: '#f1f5f9',
      headerColor: '#0f172a',
    },
    Button: {
      borderRadius: 8,
      fontWeight: 600,
    },
  },
};

function App() {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={ANTD_THEME_CONFIG}>
        <AntdApp>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected BMS Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="brands" element={<BrandsPage />} />
                  <Route path="engines" element={<EnginesPage />} />
                  <Route path="gearboxes" element={<GearboxesPage />} />
                  <Route path="vehicles" element={<VehiclesPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="purchases" element={<PurchasesPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  
                  {/* Manager Level >= 60 */}
                  <Route
                    path="suppliers"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER']}>
                        <SupplierInfoPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Manager Level >= 60 */}
                  <Route
                    path="accounting"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER']}>
                        <AccountingPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Staff Level >= 40 */}
                  <Route
                    path="labels"
                    element={
                      <ProtectedRoute allowedRoles={['STAFF']}>
                        <LabelWizardPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Admin Level >= 80 */}
                  <Route
                    path="roles"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <RolesManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Admin Level >= 80 */}
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <UserManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* SuperAdmin Level >= 100 */}
                  <Route
                    path="api-console"
                    element={
                      <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                        <ApiConsolePage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* Fallback & Default Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default App;
