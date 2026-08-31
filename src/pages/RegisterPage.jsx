import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Alert, notification } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined, UserAddOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      notification.success({ message: 'Đăng ký tài khoản thành công!', description: 'Vui lòng đăng nhập bằng tài khoản mới.' });
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
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
          <div className="text-[11px] font-mono font-bold tracking-widest text-indigo-200 uppercase">
            QBA PLATFORM ENTERPRISE
          </div>

          <div className="my-auto py-6">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-xs">
              <SafetyCertificateOutlined className="text-2xl text-white" />
            </div>

            <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">
              Khởi Tạo Tài Khoản Mới
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight mb-3">
              Đăng Ký Thành Viên BMS Portal
            </h1>
            <p className="text-xs text-indigo-100/90 leading-relaxed font-normal">
              Tham gia hệ thống quản lý enterprise với các tính năng phân quyền level thông minh.
            </p>
          </div>

          <div className="text-[11px] text-indigo-200/80 font-mono">
            © 2026 QBA Enterprise System
          </div>
        </div>

        {/* Right Column - Clean White Form Section */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 flex flex-col justify-between text-slate-800">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                <UserAddOutlined className="text-indigo-600" /> Đăng Ký Tài Khoản
              </h2>
              <p className="text-xs text-slate-500">
                Khai báo thông tin cá nhân để tạo tài khoản truy cập hệ thống
              </p>
            </div>

            {errorMessage && (
              <Alert
                message="Đăng ký không thành công"
                description={errorMessage}
                type="error"
                showIcon
                className="mb-4 rounded-xl"
              />
            )}

            <Form
              form={form}
              name="register_form"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label={
                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <UserOutlined className="text-indigo-600" /> Họ và Tên
                  </span>
                }
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                className="mb-3"
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400 mr-1" />}
                  placeholder="Nguyễn Văn A"
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>

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
                  prefix={<MailOutlined className="text-slate-400 mr-1" />}
                  placeholder="user@qbabms.com"
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
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                ]}
                className="mb-3"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-1" />}
                  placeholder="••••••••"
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <LockOutlined className="text-indigo-600" /> Xác Nhận Mật Khẩu
                  </span>
                }
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
                className="mb-5"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-1" />}
                  placeholder="Nhập lại mật khẩu"
                  className="h-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>

              <Form.Item className="mb-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  icon={<UserAddOutlined />}
                  block
                  className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl border-0 shadow-xs"
                >
                  Tạo Tài Khoản
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1">
              Đăng nhập ngay
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
