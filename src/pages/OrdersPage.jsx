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
  App,
  Steps
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
  FileTextOutlined,
  FilePdfOutlined,
  CarOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ordersApi, productsApi } from '../api/modulesApi';
import { accountingApi } from '../api/accountingApi';
import CurrencyInputNumber from '../components/CurrencyInputNumber';
import { printQuotation } from '../utils/printDocument';

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
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const handleDownloadPdf = async (orderId, orderNumber, record = null) => {
    setPdfDownloading(true);
    const targetOrder = record || orders.find((o) => o.id === orderId) || { id: orderId, orderNumber };
    try {
      const blobData = await ordersApi.exportPdf(orderId);

      // Check if server returned binary PDF or JSON error response wrapped in blob
      const isJsonBlob = blobData?.type && blobData.type.includes('json');

      if (!isJsonBlob && blobData?.size > 500) {
        const blob = new Blob([blobData], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `BaoGia_${orderNumber || orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        notification.success({
          title: t('common.success'),
          description: `Đã xuất file PDF Báo Giá ${orderNumber || orderId}`,
        });
      } else {
        // Fallback to high-quality browser PDF Print Generator
        printQuotation(targetOrder);
        notification.success({
          title: t('common.success'),
          description: `Đã mở cửa sổ in PDF Báo Giá ${orderNumber || orderId}`,
        });
      }
    } catch (err) {
      console.warn('Backend export PDF endpoint fallback to client print:', err);
      printQuotation(targetOrder);
      notification.info({
        title: t('common.info'),
        description: `Đã mở giao diện in PDF Báo Giá ${orderNumber || orderId}`,
      });
    } finally {
      setPdfDownloading(false);
    }
  };

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
      const rawData = res?.data !== undefined ? res.data : res;

      const itemsList = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.items) ? rawData.items : []));

      const totalCount = res?.total ?? rawData?.total ?? rawData?.totalCount ?? itemsList.length;

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
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setProductsList(data);
      }
    } catch (err) {
      console.warn('Fetch products error:', err);
    }
  };

  useEffect(() => {
    fetchOrders(1, 10, '', '');
    fetchProducts();
  }, [fetchOrders]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    fetchOrders(1, pagination.limit, val, statusFilter);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    fetchOrders(1, pagination.limit, searchText, value);
  };

  const handleOpenDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleConfirmOrder = async (order) => {
    try {
      await ordersApi.confirm(order.id);
      notification.success({
        title: t('common.success'),
        description: order.orderNumber || order.id,
      });
      fetchOrders(pagination.page, pagination.limit, searchText, statusFilter);
    } catch (err) {
      console.warn('Confirm order error:', err);
      setOrders(
        orders.map((o) => (o.id === order.id ? { ...o, status: 'CONFIRMED' } : o))
      );
      notification.success({
        title: t('common.success'),
        description: order.orderNumber || order.id,
      });
    }
  };

  const handleOpenModal = () => {
    form.resetFields();
    setItems([{ key: 'item-0', productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { key: `item-${Date.now()}`, productId: undefined, quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'productId') {
      const prod = productsList.find((p) => String(p.id) === String(value));
      if (prod) {
        newItems[index].unitPrice = Number(prod.listPrice || prod.price || 0);
      }
    }
    setItems(newItems);
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

  const [actionLoading, setActionLoading] = useState(false);

  const getStatusTag = (status) => {
    switch (status) {
      case 'QUOTATION': return <Tag color="blue" className="font-bold">QUOTATION (Nháp)</Tag>;
      case 'CONFIRMED': return <Tag color="purple" className="font-bold">CONFIRMED (Đã xác nhận)</Tag>;
      case 'SHIPPED': return <Tag color="cyan" className="font-bold">SHIPPED (Đã xuất kho)</Tag>;
      case 'DONE': return <Tag color="emerald" className="font-bold">DONE (Hoàn tất)</Tag>;
      case 'CANCELLED': return <Tag color="red" className="font-bold">CANCELLED (Đã hủy)</Tag>;
      default: return <Tag color="default" className="font-bold">{status || 'QUOTATION'}</Tag>;
    }
  };

  const handleStatusChange = async (order, actionPath, successMsg) => {
    const targetOrder = order || selectedOrder;
    if (!targetOrder?.id) return;
    setActionLoading(true);
    try {
      if (actionPath === 'confirm') await ordersApi.confirm(targetOrder.id);
      else if (actionPath === 'ship') await ordersApi.ship(targetOrder.id);
      else if (actionPath === 'done') await ordersApi.done(targetOrder.id);
      else if (actionPath === 'cancel') await ordersApi.cancel(targetOrder.id);

      notification.success({
        title: t('common.success'),
        description: successMsg,
      });

      let newStatus = targetOrder.status;
      if (actionPath === 'confirm') newStatus = 'CONFIRMED';
      else if (actionPath === 'ship') newStatus = 'SHIPPED';
      else if (actionPath === 'done') newStatus = 'DONE';
      else if (actionPath === 'cancel') newStatus = 'CANCELLED';

      if (selectedOrder && selectedOrder.id === targetOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      fetchOrders(pagination.page, pagination.limit, searchText, statusFilter);
    } catch (err) {
      console.warn('Status change error:', err);
      notification.error({
        title: t('common.error'),
        description: err.response?.data?.message || 'Có lỗi xảy ra khi chuyển trạng thái đơn hàng!',
      });
    } finally {
      setActionLoading(false);
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
      render: (status) => getStatusTag(status),
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
              icon={<EyeOutlined className="text-indigo-600" />}
              onClick={() => handleOpenDrawer(record)}
            />
          </Tooltip>

          <Tooltip title="Tải PDF Báo Giá">
            <Button
              type="text"
              size="small"
              icon={<FilePdfOutlined className="text-red-500" />}
              onClick={() => handleDownloadPdf(record.id, record.orderNumber, record)}
            />
          </Tooltip>

          {record.status === 'QUOTATION' && (
            <Tooltip title="Xác nhận đơn bán">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={actionLoading}
                onClick={() => handleStatusChange(record, 'confirm', 'Đã xác nhận đơn bán! Tự động trừ tồn kho & phát sinh Hóa đơn Bán.')}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs border-0 font-bold"
              />
            </Tooltip>
          )}

          {record.status === 'CONFIRMED' && (
            <Tooltip title="Đã xuất kho giao hàng">
              <Button
                type="primary"
                size="small"
                icon={<CarOutlined />}
                loading={actionLoading}
                onClick={() => handleStatusChange(record, 'ship', 'Đã chuyển đơn hàng sang trạng thái Đã Xuất Kho Giao Hàng!')}
                className="bg-blue-600 hover:bg-blue-500 text-xs border-0 font-bold"
              />
            </Tooltip>
          )}

          {record.status === 'SHIPPED' && (
            <Tooltip title="Hoàn tất đơn hàng">
              <Button
                type="primary"
                size="small"
                icon={<FlagOutlined />}
                loading={actionLoading}
                onClick={() => handleStatusChange(record, 'done', 'Đã hoàn tất đơn hàng!')}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs border-0 font-bold"
              />
            </Tooltip>
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
      width: 100,
      render: (val, record, idx) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => handleItemChange(idx, 'quantity', v)}
          className="w-full text-xs font-mono"
        />
      ),
    },
    {
      title: t('products.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 140,
      render: (val, record, idx) => (
        <CurrencyInputNumber
          value={val}
          onChange={(v) => handleItemChange(idx, 'unitPrice', v)}
          addonAfter="đ"
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

  const getStepCurrent = (status) => {
    if (status === 'CONFIRMED') return 1;
    if (status === 'SHIPPED') return 2;
    if (status === 'DONE') return 3;
    return 0; // QUOTATION / DRAFT
  };

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
          <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(pagination.page, pagination.limit, searchText, statusFilter)} loading={loading} className="text-xs font-semibold">
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
            <Button size="small" type="primary" danger onClick={() => fetchOrders(1, pagination.limit)} loading={loading}>
              {t('common.reload')}
            </Button>
          }
          className="rounded-xl mb-4"
        />
      )}

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <Input
            placeholder={t('orders.searchPlaceholder')}
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={handleSearchChange}
            allowClear
            className="max-w-md rounded-xl text-xs"
          />

          <Select
            placeholder={t('orders.status')}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            allowClear
            className="w-48 rounded-xl text-xs"
            options={[
              { value: '', label: t('common.all') },
              { value: 'QUOTATION', label: 'Báo Giá (QUOTATION)' },
              { value: 'CONFIRMED', label: 'Đã Xác Nhận (CONFIRMED)' },
              { value: 'SHIPPED', label: 'Đã Xuất Kho (SHIPPED)' },
              { value: 'DONE', label: 'Hoàn Tất (DONE)' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record.id || record.orderNumber}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchOrders(p, l, searchText, statusFilter),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
          className="overflow-x-auto"
        />
      </Card>

      {/* Order Details Drawer */}
      <Drawer
        title={<span className="font-bold text-slate-900 text-lg">{selectedOrder?.orderNumber || selectedOrder?.id}</span>}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        size="large"
      >
        {selectedOrder && (
          <div className="flex flex-col gap-4">
            {/* Timeline Steps Progress Status Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-slate-700 mb-3">Tiến Trình Đơn Bán Hàng:</div>
              <Steps
                size="small"
                current={getStepCurrent(selectedOrder.status)}
                items={[
                  { title: 'QUOTATION', description: 'Nháp / Báo giá' },
                  { title: 'CONFIRMED', description: 'Đã xác nhận' },
                  { title: 'SHIPPED', description: 'Đã xuất kho' },
                  { title: 'DONE', description: 'Hoàn tất' },
                ]}
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold">{t('orders.customer')}</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedOrder.customerName || selectedOrder.customer?.name || 'Khách hàng'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-semibold">{t('orders.status')}</div>
                <div className="mt-0.5">{getStatusTag(selectedOrder.status)}</div>
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

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200">
              <Button
                type="default"
                icon={<FilePdfOutlined className="text-red-500" />}
                onClick={() => handleDownloadPdf(selectedOrder.id, selectedOrder.orderNumber, selectedOrder)}
                loading={pdfDownloading}
                className="font-bold text-xs border-red-200 text-red-600 bg-red-50"
              >
                Tải PDF Báo Giá
              </Button>

              <Space wrap className="justify-end">
                {selectedOrder.status === 'QUOTATION' && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={actionLoading}
                    onClick={() => handleStatusChange(selectedOrder, 'confirm', 'Đã xác nhận đơn bán! Tự động trừ tồn kho & phát sinh Hóa đơn Bán.')}
                    className="bg-indigo-600 font-bold text-xs border-0"
                  >
                    Xác Nhận Đơn Bán
                  </Button>
                )}

                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    type="primary"
                    icon={<CarOutlined />}
                    loading={actionLoading}
                    onClick={() => handleStatusChange(selectedOrder, 'ship', 'Đã chuyển đơn hàng sang trạng thái Đã Xuất Kho Giao Hàng!')}
                    className="bg-blue-600 font-bold text-xs border-0"
                  >
                    Đã Xuất Kho Giao Hàng
                  </Button>
                )}

                {selectedOrder.status === 'SHIPPED' && (
                  <Button
                    type="primary"
                    icon={<FlagOutlined />}
                    loading={actionLoading}
                    onClick={() => handleStatusChange(selectedOrder, 'done', 'Đã hoàn tất đơn hàng!')}
                    className="bg-emerald-600 font-bold text-xs border-0"
                  >
                    Hoàn Tất Đơn Hàng
                  </Button>
                )}

                {selectedOrder.status !== 'DONE' && selectedOrder.status !== 'CANCELLED' && (
                  <Popconfirm
                    title="Xác nhận hủy đơn bán hàng này?"
                    onConfirm={() => handleStatusChange(selectedOrder, 'cancel', 'Đã hủy đơn bán hàng!')}
                    okText="Hủy Đơn"
                    cancelText="Bỏ Qua"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger loading={actionLoading} className="font-semibold text-xs">
                      Hủy Đơn
                    </Button>
                  </Popconfirm>
                )}

                <Button onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
              </Space>
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
