import React, { useState } from 'react';
import { Card, Tag, Button, Typography, Descriptions, Space, Alert, Tooltip } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
  CheckOutlined,
  ExportOutlined,
  CrownOutlined,
  BranchesOutlined,
  SolutionOutlined,
  LockOutlined,
  ApiOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth, getRoleCode } from '../context/AuthContext';

const { Paragraph, Text } = Typography;

const ROLE_TAG_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const DashboardPage = () => {
  const { user, accessToken, logout, fetchProfile, hasLevel } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [profileResponse, setProfileResponse] = useState(null);
  const [apiError, setApiError] = useState('');

  const currentRole = getRoleCode(user);
  const tagColor = ROLE_TAG_COLORS[currentRole] || 'blue';

  const handleCopyToken = () => {
    if (accessToken) {
      navigator.clipboard.writeText(accessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestProfileApi = async () => {
    setIsTestingApi(true);
    setApiError('');
    setProfileResponse(null);
    try {
      const profileData = await fetchProfile();
      setProfileResponse(profileData || user);
    } catch (err) {
      setApiError(err.message || 'Lỗi khi gọi API /auth/profile');
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar Light */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-xs">
            <SafetyCertificateOutlined className="text-xl text-indigo-600" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
              QBA BMS Portal
              <Tag color="processing" className="m-0 text-[10px] font-bold">API v1 Connected</Tag>
            </div>
            <div className="text-xs text-slate-500">Tích hợp Light UI Design, Ant Design & Tailwind CSS</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-900">{user?.fullName || user?.name || user?.email}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <Tag color={tagColor} className="font-bold text-xs py-1 px-3 rounded-full uppercase m-0 shadow-2xs">
            {currentRole}
          </Tag>

          <Button
            type="default"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            className="border-slate-200 bg-slate-50 hover:bg-rose-50 text-slate-900 font-semibold"
          >
            Đăng xuất
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-6 lg:p-8 flex flex-col gap-6">
        {/* Clean Corporate Solid Indigo Hero Banner */}
        <div className="rounded-xl p-6 bg-indigo-600 text-white shadow-sm border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 m-0">
              Xin chào, {user?.fullName || user?.name || user?.email}!
            </h2>
            <p className="text-indigo-100 text-sm mt-1.5 mb-0">
              Hệ thống xác thực thành công qua JWT Bearer Token. Vai trò hiện tại của bạn là{' '}
              <span className="bg-white/20 text-white font-bold px-2 py-0.5 rounded-md uppercase text-xs">
                {currentRole}
              </span>.
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<ExportOutlined />}
              href={import.meta.env.VITE_SWAGGER_URL || 'http://localhost:3000/api/v1/docs'}
              target="_blank"
              className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 font-bold shadow-md"
            >
              Swagger API Docs
            </Button>
          </Space>
        </div>

        {/* 2-Column Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: API & Token Info */}
          <Card 
            title={
              <span className="text-slate-900 font-bold flex items-center gap-2">
                <ApiOutlined className="text-indigo-600" /> Thông Tin API & Token Bearer
              </span>
            } 
            className="border-slate-200 bg-white rounded-2xl shadow-sm"
          >
            <div className="flex flex-col gap-4">
              <div>
                <Text className="text-xs text-slate-500 uppercase font-bold block mb-1">Base URL API:</Text>
                <code className="bg-slate-900 text-cyan-300 border border-slate-800 px-3 py-1.5 rounded-lg text-sm font-mono block">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}
                </code>
              </div>

              <div>
                <Text className="text-xs text-slate-500 uppercase font-bold block mb-1">Authorization Header:</Text>
                <code className="bg-slate-900 text-emerald-300 border border-slate-800 px-3 py-1.5 rounded-lg text-sm font-mono block">
                  Authorization: Bearer &lt;accessToken&gt;
                </code>
              </div>

              <div className="bg-slate-900 text-slate-100 border border-slate-800 p-3.5 rounded-xl shadow-inner">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="text-slate-200">JWT Access Token</span>
                  <Tooltip title="Sao chép Token">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={copied ? <CheckOutlined className="text-emerald-400" /> : <CopyOutlined />} 
                      onClick={handleCopyToken}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      {copied ? 'Đã chép' : 'Copy'}
                    </Button>
                  </Tooltip>
                </div>
                <div className="max-h-24 overflow-y-auto font-mono text-xs text-emerald-400 break-all leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {accessToken || 'Không có token'}
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined spinning={isTestingApi} />}
                loading={isTestingApi}
                onClick={handleTestProfileApi}
                block
                className="bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-md shadow-indigo-100 mt-1"
              >
                Thử kết nối API GET /auth/profile
              </Button>

              {profileResponse && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Text className="text-emerald-700 text-xs font-bold block mb-1">Response (200 OK):</Text>
                  <pre className="text-xs font-mono text-cyan-300 max-h-40 overflow-auto bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {JSON.stringify(profileResponse, null, 2)}
                  </pre>
                </div>
              )}

              {apiError && (
                <Alert message="Lỗi Kết Nối API" description={apiError} type="error" showIcon className="mt-2 rounded-xl" />
              )}
            </div>
          </Card>

          {/* Right: User Profile Details */}
          <Card 
            title={
              <span className="text-slate-900 font-bold flex items-center gap-2">
                <UserOutlined className="text-indigo-600" /> Hồ Sơ Người Dùng (Profile)
              </span>
            } 
            className="border-slate-200 bg-white rounded-2xl shadow-sm"
          >
            <Descriptions column={1} bordered className="bg-slate-50/50 rounded-xl overflow-hidden mb-4 border-slate-200">
              <Descriptions.Item label={<span className="text-slate-600 font-medium">ID người dùng</span>}>
                <Text className="text-slate-800 font-mono text-xs font-semibold">{user?.id || user?._id || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-slate-600 font-medium">Họ và Tên</span>}>
                <Text className="text-slate-900 font-bold">{user?.fullName || user?.name || 'Chưa cập nhật'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-slate-600 font-medium">Email</span>}>
                <Text className="text-slate-800">{user?.email}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-slate-600 font-medium">Quyền hạn (Role)</span>}>
                <Tag color={tagColor} className="font-bold uppercase m-0">{currentRole}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Text className="text-xs text-slate-500 uppercase font-bold block mb-2">Raw User JSON Object:</Text>
              <pre className="text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-800 p-3 rounded-xl max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </Card>
        </div>

        {/* Role Matrix Section Light */}
        <Card 
          title={
            <span className="text-slate-900 font-bold flex items-center gap-2 text-base">
              <SafetyCertificateOutlined className="text-indigo-600" /> Ma Trận Phân Quyền Hệ Thống (Role Matrix Visualizer)
            </span>
          } 
          className="border-slate-200 bg-white rounded-2xl shadow-sm"
        >
          <Paragraph className="text-slate-500 text-xs mb-4">
            Hiển thị các tính năng được mở khóa động dựa theo vai trò của tài khoản đang đăng nhập ({currentRole}).
          </Paragraph>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ADMIN Panel */}
            <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              hasLevel(80) 
                ? 'bg-purple-50/80 border-purple-200 shadow-sm' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-purple-900 flex items-center gap-1.5">
                    <CrownOutlined className="text-purple-600" /> ADMIN Panel
                  </span>
                  {hasLevel(80) ? (
                    <Tag color="magenta" className="font-bold m-0">Cho phép</Tag>
                  ) : (
                    <Tag color="default" className="m-0"><LockOutlined /> Khóa</Tag>
                  )}
                </div>
                <p className="text-xs text-slate-600">Toàn quyền hệ thống, xem log audit và phân quyền user.</p>
              </div>
              {hasLevel(80) ? (
                <Button type="primary" size="small" className="bg-purple-600 hover:bg-purple-500 font-semibold">
                  Mở Quyền Admin
                </Button>
              ) : (
                <span className="text-[11px] text-rose-600 italic font-medium">Yêu cầu quyền ADMIN</span>
              )}
            </div>

            {/* MANAGER Panel */}
            <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              hasLevel(60) 
                ? 'bg-cyan-50/80 border-cyan-200 shadow-sm' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-cyan-900 flex items-center gap-1.5">
                    <BranchesOutlined className="text-cyan-600" /> MANAGER Panel
                  </span>
                  {hasLevel(60) ? (
                    <Tag color="cyan" className="font-bold m-0">Cho phép</Tag>
                  ) : (
                    <Tag color="default" className="m-0"><LockOutlined /> Khóa</Tag>
                  )}
                </div>
                <p className="text-xs text-slate-600">Báo cáo phòng ban, quản lý nhân sự & phân công.</p>
              </div>
              {hasLevel(60) ? (
                <Button type="primary" size="small" className="bg-cyan-600 hover:bg-cyan-500 font-semibold">
                  Xem Báo Cáo Manager
                </Button>
              ) : (
                <span className="text-[11px] text-rose-600 italic font-medium">Yêu cầu MANAGER hoặc ADMIN</span>
              )}
            </div>

            {/* STAFF Panel */}
            <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              hasLevel(40) 
                ? 'bg-emerald-50/80 border-emerald-200 shadow-sm' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                    <SolutionOutlined className="text-emerald-600" /> STAFF Panel
                  </span>
                  {hasLevel(40) ? (
                    <Tag color="green" className="font-bold m-0">Cho phép</Tag>
                  ) : (
                    <Tag color="default" className="m-0"><LockOutlined /> Khóa</Tag>
                  )}
                </div>
                <p className="text-xs text-slate-600">Xử lý công việc, cập nhật trạng thái đơn hàng & ticket.</p>
              </div>
              {hasLevel(40) ? (
                <Button type="primary" size="small" className="bg-emerald-600 hover:bg-emerald-500 font-semibold">
                  Mở Tác Vụ Staff
                </Button>
              ) : (
                <span className="text-[11px] text-rose-600 italic font-medium">Yêu cầu STAFF trở lên</span>
              )}
            </div>

            {/* USER Panel */}
            <div className="p-4 rounded-xl border bg-amber-50/80 border-amber-200 flex flex-col justify-between gap-3 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                    <UserOutlined className="text-amber-600" /> USER Panel
                  </span>
                  <Tag color="orange" className="font-bold m-0">Cho phép</Tag>
                </div>
                <p className="text-xs text-slate-600">Dành cho tất cả người dùng trong hệ thống.</p>
              </div>
              <Button type="primary" size="small" className="bg-amber-600 hover:bg-amber-500 font-semibold">
                Trang Cá Nhân
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
