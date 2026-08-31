import React from 'react';
import { Card, Avatar, Tag, Descriptions, Button, Typography, Alert } from 'antd';
import { UserOutlined, MailOutlined, KeyOutlined, LogoutOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth, getRoleCode } from '../context/AuthContext';

const { Title, Text } = Typography;

const ROLE_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const ProfilePage = () => {
  const { user, accessToken, logout } = useAuth();
  const currentRole = getRoleCode(user);
  const roleColor = ROLE_COLORS[currentRole] || 'blue';
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar size={60} style={{ backgroundColor: '#4f46e5' }} icon={<UserOutlined className="text-xl" />}>
            {user?.name?.[0] || user?.fullName?.[0] || 'U'}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 m-0">
                {user?.fullName || user?.name || user?.email}
              </h2>
              <Tag color={roleColor} className="font-bold text-xs uppercase m-0 py-0.5 px-2">
                {currentRole}
              </Tag>
            </div>
            <Text className="text-slate-500 text-xs flex items-center gap-1 mt-1">
              <MailOutlined /> {user?.email}
            </Text>
          </div>
        </div>

        <Button type="default" danger icon={<LogoutOutlined />} onClick={logout} className="font-semibold">
          Đăng xuất tài khoản
        </Button>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={<span className="font-bold text-slate-900">Thông Tin Hồ Sơ Cá Nhân</span>} className="rounded-xl border-slate-200">
          <Descriptions column={1} bordered className="rounded-xl overflow-hidden">
            <Descriptions.Item label="Họ và Tên">{user?.fullName || user?.name || 'Chưa cập nhật'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Vai trò người dùng">
              <Tag color={roleColor} className="font-bold uppercase">
                {currentRole}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái tài khoản">
              <Tag color="success" className="font-bold">HOẠT ĐỘNG (ACTIVE)</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {isSuperAdmin ? (
          /* Developer / Debug Info for SUPERADMIN */
          <Card title={<span className="font-bold text-slate-900">Thông Tin Xác Thực JWT (SuperAdmin Dev Debug)</span>} className="rounded-xl border-slate-200">
            <Alert
              title="Xác Thực JWT Bearer Active"
              description="Phiên đăng nhập của bạn được duy trì bằng JWT Bearer Token. Khi đăng xuất, Token sẽ bị chặn bởi Redis Blacklist trên server."
              type="success"
              showIcon
              className="mb-4 rounded-xl"
            />

            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                <KeyOutlined /> Raw Access Token Debug Output:
              </span>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl border border-slate-800 font-mono text-xs break-all max-h-40 overflow-y-auto">
                {accessToken || 'No token active'}
              </div>
            </div>
          </Card>
        ) : (
          /* Standard Business Security Info for ADMIN down to USER */
          <Card title={<span className="font-bold text-slate-900">Bảo Mật & Phiên Đăng Nhập</span>} className="rounded-xl border-slate-200">
            <div className="flex flex-col gap-4">
              <Alert
                title="Tài Khoản Đã Được Bảo Vệ"
                description="Phiên làm việc của bạn được mã hóa an toàn. Vui lòng đăng xuất khi rời khỏi máy tính công cộng."
                type="info"
                showIcon
                className="rounded-xl"
              />

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <CheckCircleOutlined className="text-emerald-600" /> Trạng thái bảo mật
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Xác thực Token mã hóa 256-bit.</div>
                </div>
                <Tag color="green" className="font-bold">AN TOÀN</Tag>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
