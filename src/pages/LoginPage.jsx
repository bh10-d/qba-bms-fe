import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Alert, Tag, notification } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  LoginOutlined,
  MailOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

// Determine if we are in local development mode or explicit demo login mode
const isDevMode = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

// Demo test accounts are ONLY populated in local development mode
const TEST_ACCOUNTS = isDevMode
  ? [
      { role: 'ADMIN', email: 'admin@qbabms.com', color: 'magenta', desc: 'Quản trị viên' },
      { role: 'MANAGER', email: 'manager@qbabms.com', color: 'cyan', desc: 'Quản lý kho & kế toán' },
      { role: 'STAFF', email: 'staff@qbabms.com', color: 'green', desc: 'Nhân viên tác nghiệp' },
      { role: 'USER', email: 'user@qbabms.com', color: 'orange', desc: 'Người dùng cơ bản' },
      { role: 'SUPERADMIN (Dev)', email: 'superadmin@qbabms.com', color: 'red', desc: 'Developer Debug' },
    ]
  : [];

const DEFAULT_PASSWORD = isDevMode ? 'Password123!' : '';

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('session_expired');
  const from = location.state?.from?.pathname || '/dashboard';

  const [showSessionNotice, setShowSessionNotice] = useState(Boolean(sessionExpired));

  const handleQuickSelect = (accEmail) => {
    if (!isDevMode) return;
    setErrorMessage('');
    setShowSessionNotice(false);
    form.setFieldsValue({
      email: accEmail,
      password: DEFAULT_PASSWORD,
    });
    notification.info({ message: 'Đã chọn tài khoản thử nghiệm', description: accEmail });
  };

  const onFinish = async (values) => {
    setErrorMessage('');
    setShowSessionNotice(false);
    setIsSubmitting(true);

    try {
      await login(values.email, values.password);
      notification.success({ message: 'Đăng nhập thành công!' });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans">
      {/* Solid Clean Corporate Card */}
      <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">

        {/* Left Column - Solid Indigo Professional Side Banner */}
        <div className="lg:col-span-5 bg-indigo-600 p-8 md:p-10 flex flex-col justify-between text-white">
          {/* Top Tagline */}
          <div className="text-[11px] font-mono font-bold tracking-widest text-indigo-200 uppercase">
            QBA PLATFORM ENTERPRISE
          </div>

          {/* Center Content */}
          <div className="my-auto py-6">
            <div className="mb-6 flex items-center gap-3">
              <img src="/logonen.png" alt="QBA Enterprise Logo" className="h-16 max-w-[240px] object-contain drop-shadow-sm bg-white/10 p-2 rounded-xl border border-white/20" />
            </div>

            <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">
              QBA BMS Logistics
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight mb-3">
              Enterprise Resource Management
            </h1>
            <p className="text-xs text-indigo-100/90 leading-relaxed font-normal">
              Hệ thống quản lý phụ tùng, dòng xe, phân hệ kế toán tài chính và phân quyền đa cấp
            </p>
          </div>

          {/* Bottom Footer */}
          <div className="text-[11px] text-indigo-200/80 font-mono">
            © 2026 QBA Enterprise System
          </div>
        </div>

        {/* Right Column - Clean White Form Section */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 flex flex-col justify-between text-slate-800">
          <div>
            {/* Header Title */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                Đăng Nhập Quản Trị BMS
              </h2>
              <p className="text-xs text-slate-500">
                Nhập thông tin tài khoản để xác thực và lấy Token truy cập hệ thống
              </p>
            </div>

            {errorMessage ? (
              <Alert
                message="Đăng nhập không thành công"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage('')}
                className="mb-4 rounded-xl"
              />
            ) : (
              showSessionNotice && (
                <Alert
                  message="Phiên làm việc hết hạn"
                  description="Vui lòng đăng nhập lại để tiếp tục thao tác."
                  type="warning"
                  showIcon
                  closable
                  onClose={() => setShowSessionNotice(false)}
                  className="mb-4 rounded-xl"
                />
              )
            )}

            {/* Login Form */}
            <Form
              form={form}
              name="login_form"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              initialValues={isDevMode ? { email: 'admin@qbabms.com', password: DEFAULT_PASSWORD } : {}}
            >
              <Form.Item
                label={
                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <MailOutlined className="text-indigo-600" /> Email Đăng Nhập
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập Email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
                className="mb-3"
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400 mr-1" />}
                  placeholder="Nhập email tài khoản"
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <KeyOutlined className="text-indigo-600" /> Mật Khẩu
                  </span>
                }
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                className="mb-5"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-1" />}
                  placeholder="Nhập mật khẩu"
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>

              <Form.Item className="mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  icon={<LoginOutlined />}
                  block
                  className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl border-0 shadow-xs"
                >
                  Đăng Nhập
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Quick Select Test Accounts Box - Only rendered in DEV environment */}
          {isDevMode && TEST_ACCOUNTS.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <KeyOutlined className="text-indigo-600" />
                <span>Tài khoản thử nghiệm sẵn có (Dev Mode Only)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEST_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.role}
                    onClick={() => handleQuickSelect(acc.email)}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <Tag color={acc.color} className="font-bold m-0 text-[9px] px-1 py-0 uppercase">
                        {acc.role}
                      </Tag>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-800 truncate">{acc.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
