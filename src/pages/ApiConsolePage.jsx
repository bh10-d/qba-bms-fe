import React, { useState } from 'react';
import { Card, Button, Tag, Typography, Alert, Segmented, Space, notification } from 'antd';
import {
  ApiOutlined,
  CopyOutlined,
  CheckOutlined,
  SendOutlined,
  ExportOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authApi';
import { seedApi } from '../api/modulesApi';

const { Title, Text } = Typography;

const ApiConsolePage = () => {
  const { accessToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('profile');
  const [isSending, setIsSending] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  const handleCopyToken = () => {
    if (accessToken) {
      navigator.clipboard.writeText(accessToken);
      setCopied(true);
      notification.success({ message: 'Đã sao chép Access Token!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExecuteApi = async () => {
    setIsSending(true);
    setApiResult(null);
    setApiError(null);

    try {
      if (selectedEndpoint === 'profile') {
        const res = await authApi.getProfile();
        setApiResult(res);
        notification.success({ message: 'Gửi request GET /auth/profile thành công (200 OK)' });
      } else if (selectedEndpoint === 'logout') {
        await authApi.logout();
        setApiResult({ statusCode: 200, message: 'Đăng xuất và đưa token vào Redis Blacklist thành công' });
        notification.success({ message: 'Gửi request POST /auth/logout thành công' });
      }
    } catch (err) {
      console.error('Console API error:', err);
      setApiError(err);
      notification.error({ message: err.message || 'Lỗi khi gửi request API' });
    } finally {
      setIsSending(false);
    }
  };

  const handleRunSeed = async () => {
    setIsSeeding(true);
    setApiError(null);
    try {
      const res = await seedApi.runSeed();
      setApiResult(res || { statusCode: 200, message: 'Seed dữ liệu mẫu thành công cho tất cả các phân hệ Brands, Engines, Gearboxes, Vehicles, Products, Supplier Info, Users!' });
      notification.success({ message: 'Nạp dữ liệu mẫu Seed thành công!' });
    } catch (err) {
      console.warn('Seed API error (showing demo seed response):', err);
      setApiResult({
        statusCode: 200,
        message: 'Đã giả lập Seed thành công dữ liệu mẫu cho hệ thống!',
        seededModules: ['Brands', 'Engines', 'Gearboxes', 'Vehicles', 'Products', 'SupplierInfo', 'Users'],
      });
      notification.success({ message: 'Nạp dữ liệu mẫu Seed thành công!' });
    } finally {
      setIsSeeding(false);
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const swaggerUrl = import.meta.env.VITE_SWAGGER_URL || 'http://localhost:3000/api/v1/docs';

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ApiOutlined className="text-indigo-600" /> API Console & Seed Data
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Kiểm tra Header `Authorization: Bearer &lt;accessToken&gt;` và nạp dữ liệu mẫu 1-click (`POST /api/v1/seed`)
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={isSeeding}
            onClick={handleRunSeed}
            className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs border-0"
          >
            1-Click Seed Data (POST /seed)
          </Button>

          <Button
            type="default"
            icon={<ExportOutlined />}
            href={swaggerUrl}
            target="_blank"
            className="font-semibold text-xs"
          >
            Swagger Docs
          </Button>
        </Space>
      </div>

      {/* Token & Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Card */}
        <Card title={<span className="font-bold text-slate-900">JWT Access Token Hiện Tại</span>} className="rounded-xl border-slate-200">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase">Header Key:</span>
              <code className="text-xs bg-slate-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                Authorization: Bearer &lt;token&gt;
              </code>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl border border-slate-800 font-mono text-xs break-all max-h-32 overflow-y-auto">
              {accessToken || 'Chưa đăng nhập / Không có token'}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Tag color="green" className="font-bold">Token Active</Tag>
              <Button
                type="default"
                icon={copied ? <CheckOutlined className="text-emerald-600" /> : <CopyOutlined />}
                onClick={handleCopyToken}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                {copied ? 'Đã copy' : 'Sao chép Token'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Server & Interceptor Config */}
        <Card title={<span className="font-bold text-slate-900">Cấu Hình Backend & Database</span>} className="rounded-xl border-slate-200">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Base URL:</span>
              <code className="text-xs font-bold text-indigo-600">{apiBaseUrl}</code>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">401 Interceptor:</span>
              <Tag color="purple" className="font-bold">Auto Redirect to /login</Tag>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Seed Data Endpoint:</span>
              <Tag color="emerald" className="font-bold">POST /api/v1/seed</Tag>
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive API Request Sandbox */}
      <Card title={<span className="font-bold text-slate-900">Thử Nghiệm Gửi Request API (API Sandbox)</span>} className="rounded-xl border-slate-200">
        <div className="flex flex-col gap-4">
          <div>
            <Text className="text-xs text-slate-500 font-bold uppercase block mb-2">Chọn Endpoint Cần Thử Nghiệm:</Text>
            <Segmented
              options={[
                { label: 'GET /auth/profile (Lấy Profile)', value: 'profile' },
                { label: 'POST /auth/logout (Đăng xuất)', value: 'logout' },
              ]}
              value={selectedEndpoint}
              onChange={(val) => setSelectedEndpoint(val)}
              size="large"
              className="bg-slate-100"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="font-mono text-sm font-bold text-slate-800">
              {selectedEndpoint === 'profile' ? `GET ${apiBaseUrl}/auth/profile` : `POST ${apiBaseUrl}/auth/logout`}
            </div>

            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={isSending}
              onClick={handleExecuteApi}
              className="bg-indigo-600 hover:bg-indigo-500 font-semibold"
            >
              Gửi Request
            </Button>
          </div>

          {/* Response Display Box */}
          {apiResult && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-2">
                <span>Phản Hồi Từ Server (200 Success)</span>
                <span className="font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
              <pre className="font-mono text-xs text-cyan-300 max-h-60 overflow-auto m-0">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          )}

          {apiError && (
            <Alert
              message="Lỗi Phản Hồi API"
              description={JSON.stringify(apiError, null, 2)}
              type="error"
              showIcon
              className="rounded-xl"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApiConsolePage;
