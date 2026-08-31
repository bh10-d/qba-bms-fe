import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Card,
  Space,
  Typography,
  Tag,
  Select,
  InputNumber,
  Popconfirm,
  notification,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
  App
} from 'antd';
import {
  ShoppingOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  DollarOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  FieldTimeOutlined,
  RiseOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { purchasesApi, productsApi, supplierInfoApi } from '../api/modulesApi';
import PurchaseDetailDrawer from '../components/PurchaseDetailDrawer';
import CreatePurchaseModal from '../components/CreatePurchaseModal';

const { Title, Text } = Typography;

const PurchasesPage = () => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer details state
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modal Create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [form] = Form.useForm();

  // Dynamic Item Lines State for Create Form
  const [items, setItems] = useState([{ productId: undefined, quantity: 1, unitPrice: 0 }]);

  const fetchPurchases = useCallback(async (page = 1, limit = 10, search = '', status = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await purchasesApi.getAll(params);
      const rawData = res?.data || res;

      const itemsList = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.items) ? rawData.items : []));

      const totalCount = rawData?.total ?? rawData?.totalCount ?? itemsList.length;

      setPurchases(itemsList);
      setPagination({ page, limit, total: totalCount });
    } catch (err) {
      console.warn('Fetch purchases error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await purchasesApi.getStats();
      const data = res?.data?.data || res?.data || res;
      setStats(data);
    } catch (err) {
      console.warn('Fetch stats error:', err);
    }
  };

  const fetchProductsAndSuppliers = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([productsApi.getAll(), supplierInfoApi.getAll()]);
      const prods = prodRes?.data || prodRes;
      const sups = supRes?.data || supRes;
      if (Array.isArray(prods)) setProductsList(prods);
      if (Array.isArray(sups)) setSuppliersList(sups);
    } catch (err) {
      console.warn('Fetch references error:', err);
    }
  };

  useEffect(() => {
    fetchPurchases(1, 10, '', '');
    fetchStats();
    fetchProductsAndSuppliers();
  }, [fetchPurchases]);

  const handleSearch = () => {
    fetchPurchases(1, pagination.limit, searchText, statusFilter);
  };

  const handleOpenDrawer = (record) => {
    setSelectedPurchase(record);
    setDrawerOpen(true);
  };

  const handleConfirmPurchase = async (record) => {
    try {
      await purchasesApi.confirm(record.id);
      notification.success({
        title: t('common.success'),
        description: record.poNumber || record.id,
      });
      fetchPurchases(pagination.page, pagination.limit);
      fetchStats();
      if (selectedPurchase?.id === record.id) {
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Confirm purchase error:', err);
      notification.error({
        title: t('common.error'),
        description: t('common.error'),
      });
    }
  };

  const handleCancelPurchase = async (record) => {
    try {
      await purchasesApi.cancel(record.id);
      notification.info({
        title: t('common.info'),
        description: record.poNumber || record.id,
      });
      fetchPurchases(pagination.page, pagination.limit);
      fetchStats();
      if (selectedPurchase?.id === record.id) {
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Cancel purchase error:', err);
    }
  };

  const columns = [
    {
      title: t('purchases.reference'),
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (po, record) => (
        <span className="font-mono font-extrabold text-indigo-700 text-xs">
          {po || record.code || `PO-${record.id}`}
        </span>
      ),
    },
    {
      title: t('suppliers.name'),
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (supplier, record) => {
        const name = supplier || record.supplier?.name || 'Supplier';
        return (
          <Tooltip title={name} placement="topLeft">
            <span className="font-bold text-slate-800 text-xs truncate block max-w-[220px]">
              {name}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('purchases.amount'),
      key: 'totalAmount',
      render: (_, record) => {
        const total = record.totalAmount ?? record.total ?? 0;
        return (
          <span className="font-extrabold text-emerald-600 text-sm font-mono flex items-center gap-1">
            <DollarOutlined /> {Number(total).toLocaleString()} đ
          </span>
        );
      },
    },
    {
      title: t('purchases.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'CONFIRMED' || status === 'DONE' ? 'green' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              size="small"
              aria-label={t('common.view')}
              icon={<EyeOutlined className="text-indigo-600" />}
              onClick={() => handleOpenDrawer(record)}
            >
              {t('common.view')}
            </Button>
          </Tooltip>

          {record.status === 'DRAFT' && (
            <Popconfirm
              title={t('purchases.confirmOrder')}
              onConfirm={() => handleConfirmPurchase(record)}
              okText={t('common.save')}
              cancelText={t('common.cancel')}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                aria-label={t('purchases.confirmOrder')}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs border-0 font-bold"
              >
                {t('common.save')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ShoppingOutlined className="text-indigo-600" /> {t('purchases.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            {t('purchases.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={() => { fetchPurchases(); fetchStats(); }} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('purchases.createNew')}
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={t('common.error')}
          action={
            <Button size="small" type="primary" danger onClick={() => fetchPurchases(pagination.page, pagination.limit, searchText, statusFilter)} loading={loading}>
              {t('common.reload')}
            </Button>
          }
          className="rounded-xl mb-4"
        />
      )}

      {/* Filter & Table Unified Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <Input
              placeholder={t('purchases.searchPlaceholder')}
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              className="rounded-xl flex-1 text-xs"
            />
            <Button onClick={handleSearch} type="primary" className="bg-indigo-600 text-xs font-bold border-0">
              {t('common.search')}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{t('common.filter')}:</span>
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                fetchPurchases(1, pagination.limit, searchText, val);
              }}
              style={{ width: 170 }}
              options={[
                { value: '', label: t('common.all') },
                { value: 'CONFIRMED', label: 'CONFIRMED' },
                { value: 'DRAFT', label: 'DRAFT' },
                { value: 'DONE', label: 'DONE' },
                { value: 'CANCELLED', label: 'CANCELLED' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        <Table
          size="middle"
          columns={columns}
          dataSource={purchases}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <ShoppingOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('purchases.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchPurchases(p, l),
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* 2-Column Detail Drawer with Chatter Audit Logs */}
      <PurchaseDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        purchase={selectedPurchase}
        onConfirm={handleConfirmPurchase}
        onCancel={handleCancelPurchase}
        onRefresh={() => {
          fetchPurchases(pagination.page, pagination.limit);
          fetchStats();
        }}
      />

      {/* Odoo RFQ Creation Modal */}
      <CreatePurchaseModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchPurchases(1, pagination.limit);
          fetchStats();
        }}
      />
    </div>
  );
};

export default PurchasesPage;
