import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Tag,
  Space,
  Typography,
  Timeline,
  Avatar,
  Select,
  Tooltip
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { auditLogsApi } from '../api/modulesApi';

const { Title, Text } = Typography;

const ACTION_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  STAGE_CHANGE: 'purple',
  CONFIRM: 'cyan',
};

const cleanChatterText = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);

  let clean = text
    .replace(/-&gt;/g, ' → ')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Strip raw HTML tags if present (e.g. <p>, <div>, <br/>)
  clean = clean.replace(/<[^>]*>?/gm, '');

  return clean
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const AuditLogsPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [modelFilter, setModelFilter] = useState(undefined);

  const fetchLogs = useCallback(async (p = 1, lim = 10, search = searchText, model = modelFilter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;
      if (model) params.resModel = model;

      const res = await auditLogsApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setLogs(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchText, modelFilter]);

  useEffect(() => {
    fetchLogs(1, 10, '', undefined);
  }, []);

  const columns = [
    {
      title: 'Thời Gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => (
        <span className="font-mono text-slate-500 text-xs">
          {date ? new Date(date).toLocaleString('vi-VN') : 'Mới cập nhật'}
        </span>
      ),
    },
    {
      title: 'Người Thực Hiện',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 160,
      render: (name, record) => (
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
          <Avatar size={22} icon={<UserOutlined />} className="bg-indigo-100 text-indigo-700" />
          <span>{name || record.userName || record.userEmail || 'Hệ thống'}</span>
        </div>
      ),
    },
    {
      title: 'Hành Động',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (act) => (
        <Tag color={ACTION_COLORS[act] || 'blue'} className="font-bold text-[10px] m-0">
          {act || 'UPDATE'}
        </Tag>
      ),
    },
    {
      title: 'Đối Tượng (Model)',
      dataIndex: 'resModel',
      key: 'resModel',
      width: 160,
      render: (model, record) => (
        <div className="flex items-center gap-1">
          <Tag color="geekblue" className="font-mono font-bold text-[10px]">
            {model || 'General'}
          </Tag>
          {record.resId && <span className="font-mono text-[11px] text-slate-500">#{record.resId}</span>}
        </div>
      ),
    },
    {
      title: 'Nội Dung Nhật Ký Trao Đổi / Biến Động',
      key: 'details',
      render: (_, record) => {
        const rawBody = record.body || record.message || record.note;
        const body = cleanChatterText(rawBody);
        const tracking = Array.isArray(record.trackingValues) ? record.trackingValues : [];

        return (
          <div className="flex flex-col gap-1.5 py-1">
            {body && <div className="text-xs text-slate-800 font-medium whitespace-pre-wrap">{body}</div>}

            {tracking.length > 0 && (
              <div className="flex flex-col gap-1 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {tracking.map((tr, i) => (
                  <div key={i} className="text-[11px] flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-700">{tr.field || tr.fieldName}:</span>
                    <span className="text-red-500 line-through">{cleanChatterText(String(tr.oldValue ?? 'N/A'))}</span>
                    <SwapOutlined className="text-slate-400 text-[10px]" />
                    <span className="text-emerald-600 font-bold">{cleanChatterText(String(tr.newValue ?? 'N/A'))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <HistoryOutlined className="text-indigo-600" /> Nhật Ký Chatterbox Odoo (Audit Logs)
          </h2>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Theo dõi toàn bộ lịch sử 28,179 giao dịch, cập nhật giá trị và phản hồi trao đổi trong hệ thống
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchLogs(pagination.page, pagination.limit, searchText, modelFilter)}
          loading={loading}
          className="text-xs font-semibold"
        >
          {t('common.reload')}
        </Button>
      </div>

      {/* Filter Bar */}
      <Card size="small" className="rounded-xl border-slate-200 shadow-xs bg-white">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Input
            placeholder="Tìm theo nội dung, người thực hiện, mã chứng từ..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => {
              const val = e.target.value;
              setSearchText(val);
              fetchLogs(1, pagination.limit, val, modelFilter);
            }}
            allowClear
            className="max-w-md rounded-xl text-xs"
          />

          <Select
            placeholder="Lọc theo Model đối tượng"
            value={modelFilter}
            onChange={(val) => {
              setModelFilter(val);
              fetchLogs(1, pagination.limit, searchText, val);
            }}
            allowClear
            className="w-52 rounded-xl text-xs"
            options={[
              { value: 'Product', label: 'Product (Phụ tùng)' },
              { value: 'PurchaseOrder', label: 'PurchaseOrder (Mua hàng)' },
              { value: 'SaleOrder', label: 'SaleOrder (Đơn bán)' },
              { value: 'AccountInvoice', label: 'AccountInvoice (Hóa đơn)' },
              { value: 'StockPicking', label: 'StockPicking (Lệnh kho)' },
            ]}
          />
        </div>
      </Card>

      {/* Audit Logs Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey={(r) => r.id || `${r.createdAt}-${r.authorName}`}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchLogs(p, l, searchText, modelFilter),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
          className="overflow-x-auto"
        />
      </Card>
    </div>
  );
};

export default AuditLogsPage;
