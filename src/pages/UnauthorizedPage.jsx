import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button, Card, Tag } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))]">
      <Card className="w-full max-w-lg shadow-xl border-slate-200 bg-white/95 backdrop-blur-xl rounded-2xl p-2">
        <Result
          status="403"
          title={<span className="text-slate-900 text-2xl font-bold">403 - Không Có Quyền Truy Cập</span>}
          subTitle={
            <div className="text-slate-600 text-sm space-y-2 mt-2">
              <p>
                Tài khoản <strong className="text-slate-900">{user?.email}</strong> hiện có vai trò{' '}
                <Tag color="orange" className="font-bold uppercase m-0">{user?.role || 'USER'}</Tag>.
              </p>
              <p>Bạn không đủ thẩm quyền để truy cập vào đường dẫn này.</p>
            </div>
          }
          extra={[
            <Button
              key="back"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            >
              Quay lại
            </Button>,
            <Button
              key="home"
              type="primary"
              icon={<HomeOutlined />}
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-500 font-semibold"
            >
              Trang Chủ
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
