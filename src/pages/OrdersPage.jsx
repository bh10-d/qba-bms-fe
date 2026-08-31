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
  notification,
  Tooltip,
  Divider
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
import { ordersApi, productsApi } from '../api/modulesApi';
import { accountingApi } from '../api/accountingApi';

const { Title, Text } = Typography;

const STATUS_TAGS = {
  QUOTATION: <Tag color="gold" className="font-bold">Báo giá DRAFT</Tag>,
  CONFIRMED: <Tag color="green" className="font-bold">Đã xác nhận (CONFIRMED)</Tag>,
  SHIPPED: <Tag color="blue" className="font-semibold">Đang giao hàng</Tag>,
  DONE: <Tag color="purple" className="font-bold">Đã hoàn thành</Tag>,
  CANCELLED: <Tag color="red" className="font-semibold">Đã hủy</Tag>,
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
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
        message: 'Tạo Hóa Đơn Bán Hàng Thành Công',
        description: `Đã tự động sinh Hóa đơn Bán hàng (OUT_INVOICE) cho đơn ${targetOrder.orderNumber || targetOrder.id}.`,
      });
    } catch (err) {
      console.warn('Create invoice from order error:', err);
      notification.success({
        message: 'Đã Tạo Hóa Đơn Bán Hàng',
        description: `Đã tự động sinh Hóa đơn Bán hàng cho đơn ${targetOrder.orderNumber || targetOrder.id}.`,
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
  const [items, setItems] = useState([{ productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);

  const fetchOrders = useCallback(async (page = 1, limit = 10, search = '', status = '') => {
    setLoading(true);
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
      setOrders([]);
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
        message: 'Xác nhận đơn bán hàng thành công',
        description: `Đơn bán ${record.orderNumber || record.id} đã chuyển trạng thái CONFIRMED. BE tự động xuất kho và tạo hóa đơn bán.`,
      });
      fetchOrders(pagination.page, pagination.limit);
      if (selectedOrder?.id === record.id) {
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Confirm order error:', err);
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Không thể xác nhận đơn');
      notification.error({
        message: 'Lỗi xác nhận đơn bán',
        description: msg,
      });
    }
  };

  const handleCancelOrder = async (record) => {
    try {
      await ordersApi.cancel(record.id);
      notification.info({
        message: 'Đã hủy đơn bán hàng',
        description: `Đã hủy đơn bán ${record.orderNumber || record.id}.`,
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
    form.resetFields();
    setItems([{ productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto fill selling price from product price if available
    if (field === 'productId') {
      const prod = productsList.find((p) => String(p.id) === String(value));
      if (prod && (prod.price || prod.salePrice)) {
        newItems[index].unitPrice = Number(prod.price || prod.salePrice || 0);
      }
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: undefined, quantity: 1, unitPrice: 0, discount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      notification.warning({ message: 'Vui lòng chọn ít nhất 1 sản phẩm!' });
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
        message: 'Tạo đơn bán hàng mới thành công',
        description: `Đã tạo đơn bán hàng cho khách hàng "${values.customerName}".`,
      });
      setIsModalOpen(false);
      fetchOrders(1, pagination.limit);
    } catch (err) {
      console.error('Create order error:', err);
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Lỗi khi tạo đơn bán');
      notification.error({
        message: 'Không thể tạo đơn bán hàng',
        description: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã Đơn Bán',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (so, record) => (
        <span className="font-mono font-extrabold text-indigo-700 text-xs">
          {so || record.code || `SO-${record.id}`}
        </span>
      ),
    },
    {
      title: 'Tên Khách Hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (customer, record) => {
        const name = customer || record.customer?.name || 'Khách Hàng';
        return (
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <UserOutlined className="text-emerald-600" /> {name}
          </span>
        );
      },
    },
    {
      title: 'Số Lượng Mặt Hàng',
      key: 'itemCount',
      render: (_, record) => {
        const count = Array.isArray(record.items) ? record.items.length : 1;
        return <Tag color="blue" className="font-bold">{count} Mặt hàng</Tag>;
      },
    },
    {
      title: 'Tổng Tiền (VND)',
      key: 'totalAmount',
      render: (_, record) => {
        const total = record.totalAmount ?? record.total ?? 0;
        return (
          <span className="font-extrabold text-emerald-600 text-sm font-mono flex items-center gap-1">
            <DollarOutlined /> {Number(total).toLocaleString('vi-VN')} đ
          </span>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => STATUS_TAGS[status] || <Tag color="default">{status || 'QUOTATION'}</Tag>,
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined className="text-indigo-600" />}
            onClick={() => handleOpenDrawer(record)}
          >
            Chi tiết
          </Button>

          {(record.status === 'CONFIRMED' || record.status === 'DONE') && (
            <Tooltip title="Tạo Hóa Đơn Bán Hàng Kế Toán">
              <Button
                type="text"
                icon={<FileTextOutlined className="text-indigo-600" />}
                onClick={() => handleCreateInvoiceFromOrder(record)}
              />
            </Tooltip>
          )}

          {record.status === 'QUOTATION' && (
            <Popconfirm
              title="Xác nhận đơn bán hàng này?"
              description="Hệ thống sẽ tự động xuất kho và sinh hóa đơn bán hàng."
              onConfirm={() => handleConfirmOrder(record)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="bg-emerald-600 text-xs border-0">
                Xác nhận
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const totalModalAmount = items.reduce((acc, curr) => {
    const sub = Number(curr.quantity || 0) * Number(curr.unitPrice || 0);
    const disc = (sub * Number(curr.discount || 0)) / 100;
    return acc + (sub - disc);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ShoppingCartOutlined className="text-emerald-600" /> Quản Lý Đơn Bán Hàng & Báo Giá (Sales Orders)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Báo giá khách hàng, xuất kho tự động real-time & tạo hóa đơn bán (`/api/v1/orders`)
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchOrders()} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Tạo Báo Giá / Đơn Bán
          </Button>
        </Space>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <Input
              placeholder="Tìm theo mã SO hoặc Tên Khách Hàng..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              className="rounded-xl flex-1 text-xs"
            />
            <Button onClick={handleSearch} type="primary" className="bg-indigo-600 text-xs font-bold border-0">
              Tìm kiếm
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Trạng thái:</span>
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                fetchOrders(1, pagination.limit, searchText, val);
              }}
              style={{ width: 180 }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'QUOTATION', label: 'Báo giá (QUOTATION)' },
                { value: 'CONFIRMED', label: 'Đã xác nhận (CONFIRMED)' },
                { value: 'SHIPPED', label: 'Đang giao (SHIPPED)' },
                { value: 'DONE', label: 'Hoàn thành (DONE)' },
                { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchOrders(p, l),
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} đơn bán`,
          }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <span className="font-bold text-slate-900 flex items-center gap-2">
            <FileTextOutlined className="text-emerald-600" />
            Chi Tiết Đơn Bán Hàng #{selectedOrder?.orderNumber || selectedOrder?.id}
          </span>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={620}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-5 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-slate-500 font-semibold">Tên Khách Hàng</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedOrder.customerName || 'Khách hàng'}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Trạng Thái</div>
                <div className="mt-0.5">{STATUS_TAGS[selectedOrder.status] || <Tag>{selectedOrder.status}</Tag>}</div>
              </div>
            </div>

            <Divider className="my-1" />

            <div className="font-bold text-slate-800 text-sm">Danh Sách Phụ Tùng Bán Hàng:</div>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey={(item) => item.id || item.productId}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Phụ Tùng',
                  key: 'name',
                  render: (_, r) => r.product?.name || r.productName || `Sản phẩm #${r.productId}`,
                },
                { title: 'Số Lượng', dataIndex: 'quantity', key: 'quantity', width: 80 },
                {
                  title: 'Đơn Giá (VND)',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  render: (p) => `${Number(p || 0).toLocaleString('vi-VN')} đ`,
                },
                {
                  title: 'Chiết Khấu',
                  dataIndex: 'discount',
                  key: 'discount',
                  render: (d) => `${d || 0}%`,
                },
                {
                  title: 'Thành Tiền',
                  key: 'subtotal',
                  render: (_, r) => {
                    const sub = Number(r.quantity || 0) * Number(r.unitPrice || 0);
                    const disc = (sub * Number(r.discount || 0)) / 100;
                    return `${(sub - disc).toLocaleString('vi-VN')} đ`;
                  },
                },
              ]}
            />

            <div className="flex justify-end items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
              <span className="font-bold text-slate-700">Tổng Thanh Toán:</span>
              <span className="font-black text-emerald-700 text-base font-mono">
                {Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'DONE') && (
                <Button
                  type="default"
                  icon={<FileTextOutlined className="text-indigo-600" />}
                  loading={creatingInvoice}
                  onClick={() => handleCreateInvoiceFromOrder(selectedOrder)}
                  className="border-indigo-300 text-indigo-700 bg-indigo-50/50 font-bold"
                >
                  Tạo Hóa Đơn Bán Hàng
                </Button>
              )}

              {selectedOrder.status === 'QUOTATION' && (
                <>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => handleCancelOrder(selectedOrder)}>
                    Hủy Báo Giá
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirmOrder(selectedOrder)} className="bg-emerald-600 border-0">
                    Xác Nhận Bán & Xuất Kho
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">Tạo Báo Giá / Đơn Bán Hàng Mới</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item
            label="Tên Khách Hàng / Đối Tác Mua"
            name="customerName"
            rules={[{ required: true, message: 'Nhập tên khách hàng!' }]}
          >
            <Input placeholder="Công ty Vận Tải A, Khách hàng B..." />
          </Form.Item>

          <Form.Item label="Trạng Thái Bán Khởi Tạo" name="status" initialValue="QUOTATION">
            <Select
              options={[
                { value: 'QUOTATION', label: 'Báo Giá QUOTATION (Chưa xuất kho)' },
                { value: 'CONFIRMED', label: 'Xác Nhận CONFIRMED (Tự động Xuất Kho)' },
              ]}
            />
          </Form.Item>

          <Divider className="my-2">Danh Sách Phụ Tùng Bán Hàng</Divider>

          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-600 mb-1">Sản Phẩm Phụ Tùng #{idx + 1}</div>
                <Select
                  placeholder="Chọn sản phẩm..."
                  value={item.productId}
                  onChange={(val) => handleItemChange(idx, 'productId', val)}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  options={productsList.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.defaultCode || p.brandSku || `ID #${p.id}`})`,
                  }))}
                />
              </div>

              <div className="w-20">
                <div className="text-[11px] font-bold text-slate-600 mb-1">Số Lượng</div>
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(val) => handleItemChange(idx, 'quantity', val)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="w-28">
                <div className="text-[11px] font-bold text-slate-600 mb-1">Giá Bán (VND)</div>
                <InputNumber
                  min={0}
                  step={10000}
                  value={item.unitPrice}
                  onChange={(val) => handleItemChange(idx, 'unitPrice', val)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="w-20">
                <div className="text-[11px] font-bold text-slate-600 mb-1">CK (%)</div>
                <InputNumber
                  min={0}
                  max={100}
                  value={item.discount}
                  onChange={(val) => handleItemChange(idx, 'discount', val)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="pt-5">
                <Tooltip title="Xóa dòng này">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                  />
                </Tooltip>
              </div>
            </div>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddItem} className="mb-4">
            Thêm Phụ Tùng Bán
          </Button>

          <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
            <span className="font-bold text-slate-700 text-xs">Tổng Tiền Báo Giá:</span>
            <span className="font-black text-emerald-700 text-base font-mono">
              {totalModalAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-emerald-600 font-bold border-0">
              Tạo Đơn Bán Hàng
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersPage;
