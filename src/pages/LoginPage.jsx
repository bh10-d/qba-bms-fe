import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Alert, notification } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  MailOutlined,
  KeyOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { t } = useTranslation();
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

  const onFinish = async (values) => {
    setErrorMessage('');
    setShowSessionNotice(false);
    setIsSubmitting(true);

    try {
      await login(values.email, values.password);
      notification.success({ title: t('common.success'), message: t('auth.loginSuccess') });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left Column Banner - Executive Navy/Slate background with high-contrast pure white logo card */}
        <div className="lg:col-span-5 bg-slate-900 p-8 md:p-10 flex flex-col justify-between text-white">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-300 uppercase bg-indigo-500/10 border border-indigo-400/20 px-2.5 py-1 rounded-md">
              QBA PLATFORM ENTERPRISE
            </span>
          </div>

          <div className="my-auto py-6">
            {/* Enterprise Logo Pure White Card for Maximum Contrast and Crisp Brand Display */}
            <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-slate-100 inline-flex items-center justify-center">
              <img
                src="/logonen.png"
                alt="QBA Enterprise Logo"
                className="h-14 max-w-[220px] object-contain"
              />
            </div>

            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
              QBA BMS Logistics
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-2 tracking-tight">
              Enterprise Resource Management
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-4 border-t border-slate-800">
            <span>© 2026 QBA Enterprise</span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <SafetyCertificateOutlined className="text-indigo-400" /> SSL Secured
            </span>
          </div>
        </div>

        {/* Right Column Form */}
        <div className="lg:col-span-7 bg-white p-8 md:p-12 flex flex-col justify-between text-slate-800">
          <div>
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                {t('auth.loginTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {errorMessage ? (
              <Alert
                message={t('common.error')}
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage('')}
                className="mb-5 rounded-xl text-xs"
              />
            ) : (
              showSessionNotice && (
                <Alert
                  message={t('common.warning')}
                  description={t('session_expired')}
                  type="warning"
                  showIcon
                  closable
                  onClose={() => setShowSessionNotice(false)}
                  className="mb-5 rounded-xl text-xs"
                />
              )
            )}

            <Form
              form={form}
              name="login_form"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label={
                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <MailOutlined className="text-indigo-600" /> {t('auth.email')}
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: t('common.required') },
                  { type: 'email', message: t('common.error') },
                ]}
                className="mb-4"
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400 mr-1" />}
                  placeholder={t('auth.email')}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500 text-xs font-semibold"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <KeyOutlined className="text-indigo-600" /> {t('auth.password')}
                  </span>
                }
                name="password"
                rules={[{ required: true, message: t('common.required') }]}
                className="mb-6"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-1" />}
                  placeholder={t('auth.password')}
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500 text-xs font-semibold"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  icon={<LoginOutlined />}
                  block
                  className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl border-0 shadow-sm"
                >
                  {t('auth.loginButton')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
