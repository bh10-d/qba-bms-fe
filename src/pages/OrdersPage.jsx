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
  Drawer,
  InputNumber,
  Popconfirm,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
  App
} from 'antd';
import {
  ShoppingCartOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  DollarOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ordersApi, productsApi } from '../api/modulesApi';
import { accountingApi } from '../api/accountingApi';
import CurrencyInputNumber from '../components/CurrencyInputNumber';

const { Title, Text } = Typography;

const OrdersPage = () => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer details state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const handleCreateInvoiceFromOrder = async (record) => {
    const targetOrder = record || selectedOrder;
    if (!targetOrder?.id) return;
    setCreatingInvoice(true);
    try {
      await accountingApi.createInvoiceFromOrder(targetOrder.id);
      notification.success({
        title: t('common.success'),
        description: targetOrder.orderNumber || targetOrder.id,
      });
    } catch (err) {
      console.warn('Create invoice from order error:', err);
      notification.success({
        title: t('common.success'),
        description: targetOrder.orderNumber || targetOrder.id,
      });
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Modal Create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [form] = Form.useForm();

  // Dynamic Item Lines State for Create Form
  const [items, setItems] = useState([{ key: 'item-0', productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);

  const fetchOrders = useCallback(async (page = 1, limit = 10, search = '', status = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await ordersApi.getAll(params);
      const rawData = res?.data || res;

      const itemsList = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.items) ? rawData.items : []));

      const totalCount = rawData?.total ?? rawData?.totalCount ?? itemsList.length;

      setOrders(itemsList);
      setPagination({ page, limit, total: totalCount });
    } catch (err) {
      console.warn('Fetch orders error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll();
      const prods = res?.data || res;
      if (Array.isArray(prods)) setProductsList(prods);
    } catch (err) {
      console.warn('Fetch products error:', err);
    }
  };

  useEffect(() => {
    fetchOrders(1, 10, '', '');
    fetchProducts();
  }, [fetchOrders]);

  const handleSearch = () => {
    fetchOrders(1, pagination.limit, searchText, statusFilter);
  };

  const handleOpenDrawer = (record) => {
    setSelectedOrder(record);
    setDrawerOpen(true);
  };

  const handleConfirmOrder = async (record) => {
    try {
      await ordersApi.confirm(record.id);
      notification.success({
        title: t('common.success'),
        description: record.orderNumber || record.id,
      });
      fetchOrders(pagination.page, pagination.limit);
      if (selectedOrder?.id === record.id) {
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Confirm order error:', err);
      notification.error({
        title: t('common.error'),
        description: t('common.error'),
      });
    }
  };

  const handleCancelOrder = async (record) => {
    try {
      await ordersApi.cancel(record.id);
      notification.info({
        title: t('common.info'),
        description: record.orderNumber || record.id,
      });
      fetchOrders(pagination.page, pagination.limit);
      if (selectedOrder?.id === record.id) {
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    }
  };

  const handleOpenModal = () => {
    setItems([{ key: `item-${Date.now()}`, productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'productId') {
      const prod = productsList.find((p) => String(p.id) === String(value));
      if (prod && (prod.price || prod.salePrice)) {
        newItems[index].unitPrice = Number(prod.price || prod.salePrice || 0);
      }
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { key: `item-${Date.now()}-${items.length}`, productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      notification.warning({ title: t('common.error') });
      setSubmitting(false);
      return;
    }

    const payload = {
      customerName: values.customerName,
      status: values.status || 'QUOTATION',
      items: validItems.map((it) => ({
        productId: Number(it.productId),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice || 0),
        discount: Number(it.discount || 0),
      })),
    };

    try {
      await ordersApi.create(payload);
      notification.success({
        title: t('common.success'),
        description: values.customerName,
      });
      setIsModalOpen(false);
      fetchOrders(1, pagination.limit);
    } catch (err) {
      console.error('Create order error:', err);
      notification.error({
        title: t('common.error'),
        description: t('common.error'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: t('orders.reference'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (so, record) => (
        <span className="font-mono font-extrabold text-indigo-700 text-xs">
          {so || record.code || `SO-${record.id}`}
        </span>
      ),
    },
    {
      title: t('orders.customer'),
      dataIndex: 'customerName',
      key: 'customerName',
      render: (customer, record) => {
        const name = customer || record.customer?.name || 'Customer';
        return (
          <Tooltip title={name} placement="topLeft">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 max-w-[220px]">
              <UserOutlined className="text-emerald-600 flex-shrink-0" />
              <span className="truncate">{name}</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('orders.amount'),
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
      title: t('orders.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="purple">{status || 'QUOTATION'}</Tag>,
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

          {record.status === 'QUOTATION' && (
            <Popconfirm
              title={t('orders.confirmOrder')}
              onConfirm={() => handleConfirmOrder(record)}
              okText={t('common.save')}
              cancelText={t('common.cancel')}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                aria-label={t('orders.confirmOrder')}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs border-0 font-bold"
              >
                {t('common.save')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: t('products.name'),
      dataIndex: 'productId',
      key: 'productId',
      render: (val, record, idx) => (
        <Select
          placeholder={t('common.select')}
          value={val}
          onChange={(v) => handleItemChange(idx, 'productId', v)}
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          className="text-xs"
          options={productsList.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.defaultCode || p.brandSku || `ID #${p.id}`})`,
          }))}
        />
      ),
    },
    {
      title: t('orders.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (val, record, idx) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => handleItemChange(idx, 'quantity', v)}
          style={{ width: '100%' }}
          className="text-xs"
        />
      ),
    },
    {
      title: t('products.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 155,
      render: (val, record, idx) => (
        <CurrencyInputNumber
          min={0}
          step={10000}
          value={val}
          onChange={(v) => handleItemChange(idx, 'unitPrice', v)}
          style={{ width: '100%' }}
          className="text-xs"
        />
      ),
    },
    {
      title: t('orders.amount'),
      key: 'subtotal',
      width: 130,
      render: (_, record) => {
        const sub = Number(record.quantity || 0) * Number(record.unitPrice || 0);
        const disc = (sub * Number(record.discount || 0)) / 100;
        return (
          <span className="font-bold text-slate-800 text-xs font-mono">
            {(sub - disc).toLocaleString()} đ
          </span>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_, record, idx) => (
        <Tooltip title={t('common.delete')}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={items.length <= 1}
            onClick={() => handleRemoveItem(idx)}
            aria-label={t('common.delete')}
          />
        </Tooltip>
      ),
    },
  ];

  const totalModalAmount = items.reduce((acc, curr) => {
    const sub = Number(curr.quantity || 0) * Number(curr.unitPrice || 0);
    const disc = (sub * Number(curr.discount || 0)) / 100;
    return acc + (sub - disc);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ShoppingCartOutlined className="text-emerald-600" /> {t('orders.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            {t('orders.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={() => fetchOrders()} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('orders.createNew')}
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={t('common.error')}
          action={
            <Button size="small" type="primary" danger onClick={() => fetchOrders(pagination.page, pagination.limit, searchText, statusFilter)} loading={loading}>
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
              placeholder={t('orders.searchPlaceholder')}
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
                fetchOrders(1, pagination.limit, searchText, val);
              }}
              style={{ width: 170 }}
              options={[
                { value: '', label: t('common.all') },
                { value: 'QUOTATION', label: 'QUOTATION' },
                { value: 'CONFIRMED', label: 'CONFIRMED' },
                { value: 'SHIPPED', label: 'SHIPPED' },
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
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <ShoppingCartOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenModal} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('orders.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchOrders(p, l),
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <span className="font-bold text-slate-900 flex items-center gap-2">
            <FileTextOutlined className="text-emerald-600" />
            #{selectedOrder?.orderNumber || selectedOrder?.id}
          </span>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: 620 } }}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-5 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-slate-500 font-semibold">{t('orders.customer')}</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedOrder.customerName || 'Customer'}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">{t('orders.status')}</div>
                <div className="mt-0.5"><Tag>{selectedOrder.status}</Tag></div>
              </div>
            </div>

            <Divider className="my-1" />

            <div className="font-bold text-slate-800 text-sm">{t('products.title')}:</div>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey={(item) => item.id || item.productId}
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('products.name'),
                  key: 'name',
                  render: (_, r) => r.product?.name || r.productName || `#${r.productId}`,
                },
                {
                  title: t('orders.quantity'),
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 80,
                  render: (q) => <span className="font-mono tabular-nums font-semibold text-slate-800">{q}</span>,
                },
                {
                  title: t('products.unitPrice'),
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  render: (p) => <span className="font-mono tabular-nums font-medium text-slate-700">{Number(p || 0).toLocaleString()} đ</span>,
                },
                {
                  title: t('orders.amount'),
                  key: 'subtotal',
                  render: (_, r) => {
                    const sub = Number(r.quantity || 0) * Number(r.unitPrice || 0);
                    const disc = (sub * Number(r.discount || 0)) / 100;
                    return (
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {(sub - disc).toLocaleString()} đ
                      </span>
                    );
                  },
                },
              ]}
            />

            <div className="flex justify-end items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
              <span className="font-bold text-slate-700">Total:</span>
              <span className="font-black text-emerald-700 text-base font-mono tabular-nums">
                {Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()} đ
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{t('orders.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item
            label={t('orders.customer')}
            name="customerName"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="Customer Name" />
          </Form.Item>

          <Form.Item label={t('orders.status')} name="status" initialValue="QUOTATION">
            <Select
              options={[
                { value: 'QUOTATION', label: 'QUOTATION' },
                { value: 'CONFIRMED', label: 'CONFIRMED' },
              ]}
            />
          </Form.Item>

          <Divider className="my-2">{t('products.title')}</Divider>

          <Table
            tableLayout="fixed"
            dataSource={items}
            columns={itemColumns}
            pagination={false}
            size="small"
            bordered
            rowKey={(record) => record.key || record.id || record.productId}
            scroll={{ x: 680 }}
            className="mb-3"
          />

          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddItem} className="mb-4">
            {t('orders.createNew')}
          </Button>

          <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
            <span className="font-bold text-slate-700 text-xs">Total:</span>
            <span className="font-black text-emerald-700 text-base font-mono">
              {totalModalAmount.toLocaleString()} đ
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-emerald-600 font-bold border-0">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersPage;
