import React from 'react';
import { Card, Avatar, Tag, Descriptions, Button, Typography, Alert, Radio, Space } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  KeyOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth, getRoleCode } from '../context/AuthContext';

const { Text } = Typography;

const ROLE_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, accessToken, logout } = useAuth();
  const currentRole = getRoleCode(user);
  const roleColor = ROLE_COLORS[currentRole] || 'blue';
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar size={64} style={{ backgroundColor: '#4f46e5' }} icon={<UserOutlined className="text-2xl" />}>
            {user?.name?.[0] || user?.fullName?.[0] || 'U'}
          </Avatar>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 m-0">
                {user?.fullName || user?.name || user?.email}
              </h2>
              <Tag color={roleColor} className="font-extrabold text-xs uppercase m-0 py-0.5 px-2.5 rounded-md">
                {currentRole}
              </Tag>
            </div>
            <Text className="text-slate-500 text-xs flex items-center gap-1.5 mt-1 font-medium">
              <MailOutlined className="text-slate-400" /> {user?.email}
            </Text>
          </div>
        </div>

        <Button type="default" danger icon={<LogoutOutlined />} onClick={logout} className="font-bold text-xs rounded-xl px-4 py-2">
          {t('profile.logout')}
        </Button>
      </div>

      {/* Grid Layout: Profile Details & System Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Account Information */}
        <Card
          title={
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <UserOutlined className="text-indigo-600" />
              <span>{t('profile.title')}</span>
            </div>
          }
          className="rounded-2xl border-slate-200 shadow-2xs"
        >
          <Descriptions column={1} bordered className="rounded-xl overflow-hidden text-xs">
            <Descriptions.Item label={<span className="font-bold text-slate-700">{t('profile.fullName')}</span>}>
              {user?.fullName || user?.name || 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label={<span className="font-bold text-slate-700">{t('profile.email')}</span>}>
              {user?.email}
            </Descriptions.Item>
            <Descriptions.Item label={<span className="font-bold text-slate-700">{t('profile.role')}</span>}>
              <Tag color={roleColor} className="font-bold uppercase">
                {currentRole}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="font-bold text-slate-700">{t('profile.status')}</span>}>
              <Tag color="success" className="font-bold">
                {t('profile.active')}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Card 2: Language & Preferences (Main Setting Hub) */}
        <Card
          title={
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <GlobalOutlined className="text-indigo-600" />
              <span>{t('profile.settingsTitle')}</span>
            </div>
          }
          className="rounded-2xl border-slate-200 shadow-2xs"
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-bold text-slate-800 text-xs mb-1">
                {t('profile.languageSelect')}
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">
                {t('profile.languageHint')}
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <Radio.Group onChange={handleLanguageChange} value={currentLang} className="w-full">
                  <Space direction="vertical" className="w-full">
                    <div className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${currentLang === 'vi' ? 'bg-indigo-50/70 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <Radio value="vi" className="font-semibold text-xs text-slate-800">
                        {t('profile.viLabel')}
                      </Radio>
                      {currentLang === 'vi' && (
                        <Tag color="indigo" className="m-0 text-[10px] font-bold uppercase">Active</Tag>
                      )}
                    </div>

                    <div className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${currentLang === 'en' ? 'bg-indigo-50/70 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <Radio value="en" className="font-semibold text-xs text-slate-800">
                        {t('profile.enLabel')}
                      </Radio>
                      {currentLang === 'en' && (
                        <Tag color="indigo" className="m-0 text-[10px] font-bold uppercase">Active</Tag>
                      )}
                    </div>
                  </Space>
                </Radio.Group>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Security Information */}
        <div className="lg:col-span-2">
          {isSuperAdmin ? (
            <Card
              title={
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <SafetyCertificateOutlined className="text-emerald-600" />
                  <span>Thông Tin Xác Thực JWT (SuperAdmin Dev Debug)</span>
                </div>
              }
              className="rounded-2xl border-slate-200 shadow-2xs"
            >
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
            <Card
              title={
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <SafetyCertificateOutlined className="text-emerald-600" />
                  <span>{t('profile.securityTitle')}</span>
                </div>
              }
              className="rounded-2xl border-slate-200 shadow-2xs"
            >
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircleOutlined className="text-emerald-600" /> {t('profile.securityStatus')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Xác thực Token mã hóa 256-bit an toàn.</div>
                  </div>
                  <Tag color="green" className="font-bold text-xs">{t('profile.securitySafe')}</Tag>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
