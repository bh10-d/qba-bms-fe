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
  Statistic
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
import { purchasesApi, productsApi, supplierInfoApi } from '../api/modulesApi';
import PurchaseDetailDrawer from '../components/PurchaseDetailDrawer';
import CreatePurchaseModal from '../components/CreatePurchaseModal';

const { Title, Text } = Typography;

const STATUS_TAGS = {
  CONFIRMED: <Tag color="blue" className="font-bold">Đơn mua hàng</Tag>,
  DRAFT: <Tag color="default" className="font-semibold">Yêu cầu báo giá</Tag>,
  DONE: <Tag color="green" className="font-bold">Đã hoàn thành</Tag>,
  CANCELLED: <Tag color="red" className="font-semibold">Đã hủy</Tag>,
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setPurchases([]);
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
        message: 'Xác nhận đơn mua hàng thành công',
        description: `Đơn mua ${record.poNumber || record.id} đã chuyển trạng thái CONFIRMED. BE tự động nhập kho và tạo hóa đơn.`,
      });
      fetchPurchases(pagination.page, pagination.limit);
      fetchStats();
      if (selectedPurchase?.id === record.id) {
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Confirm purchase error:', err);
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Không thể xác nhận đơn');
      notification.error({
        message: 'Lỗi xác nhận đơn mua',
        description: msg,
      });
    }
  };

  const handleCancelPurchase = async (record) => {
    try {
      await purchasesApi.cancel(record.id);
      notification.info({
        message: 'Đã hủy đơn mua hàng',
        description: `Đã hủy đơn mua ${record.poNumber || record.id}.`,
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

  const handleOpenModal = () => {
    form.resetFields();
    setItems([{ productId: undefined, quantity: 1, unitPrice: 0 }]);
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'productId') {
      const prod = productsList.find((p) => String(p.id) === String(value));
      if (prod && (prod.price || prod.costPrice)) {
        newItems[index].unitPrice = Number(prod.costPrice || prod.price || 0);
      }
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: undefined, quantity: 1, unitPrice: 0 }]);
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
      supplierName: values.supplierName,
      status: values.status || 'DRAFT',
      items: validItems.map((it) => ({
        productId: Number(it.productId),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice || 0),
      })),
    };

    try {
      await purchasesApi.create(payload);
      notification.success({
        message: 'Tạo đơn mua hàng mới thành công',
        description: `Đã tạo đơn mua hàng từ nhà cung cấp "${values.supplierName}".`,
      });
      setIsModalOpen(false);
      fetchPurchases(1, pagination.limit);
      fetchStats();
    } catch (err) {
      console.error('Create purchase error:', err);
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Lỗi khi tạo đơn mua');
      notification.error({
        message: 'Không thể tạo đơn mua hàng',
        description: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Tham chiếu',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (po, record) => (
        <span className="font-mono font-extrabold text-indigo-700 text-xs">
          {po || record.code || `PO-${record.id}`}
        </span>
      ),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (supplier, record) => {
        const name = supplier || record.supplier?.name || 'Nhà Cung Cấp';
        return (
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            {name}
          </span>
        );
      },
    },
    {
      title: 'Bên mua',
      dataIndex: 'buyerName',
      key: 'buyerName',
      render: (buyer) => buyer ? (
        <Tag color="green" className="font-semibold rounded-md text-[11px]">
          {buyer}
        </Tag>
      ) : null,
    },
    {
      title: 'Chứng từ gốc',
      dataIndex: 'origin',
      key: 'origin',
      render: (text) => text ? <Tag color="purple">{text}</Tag> : <span className="text-slate-400 italic">--</span>,
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
      title: 'Tổng tiền',
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'CONFIRMED' || status === 'DONE' ? 'green' : 'default'}>
          {status === 'CONFIRMED' || status === 'DONE' ? 'Đơn mua hàng' : status === 'DRAFT' ? 'Yêu cầu báo giá' : status}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
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

          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Xác nhận đơn mua hàng này?"
              description="Chốt đơn với NCC & tạo phiếu nhập kho (trạng thái Chờ nhập kho)."
              onConfirm={() => handleConfirmPurchase(record)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="bg-indigo-600 text-xs border-0 font-bold">
                Xác nhận
              </Button>
            </Popconfirm>
          )}

          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="Xác nhận nhận hàng vào kho?"
              description="Xác nhận hàng thực tế về kho và tăng tồn kho phụ tùng."
              onConfirm={() => handleReceivePurchase(record)}
              okText="Nhận hàng"
              cancelText="Hủy"
            >
              <Button type="primary" size="small" icon={<InboxOutlined />} className="bg-emerald-600 text-xs border-0 font-bold">
                Nhận hàng
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ShoppingOutlined className="text-indigo-600" /> Quản Lý Đơn Mua Hàng (Purchases)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Theo dõi đơn đặt hàng nhà cung cấp, nhập kho tự động & hóa đơn mua (`/api/v1/purchases`)
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchPurchases(); fetchStats(); }} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Tạo Đơn Mua Hàng
          </Button>
        </Space>
      </div>

      {/* Top KPI Stats Bar */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-xl border-slate-200 shadow-2xs bg-white">
              <Statistic
                title={<span className="text-slate-500 font-semibold text-xs">Tất cả RFQ (Cần gửi / Trễ)</span>}
                value={`${stats.draftCount ?? 0} Cần gửi | ${stats.lateCount ?? 0} Trễ`}
                valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}
                prefix={<FileTextOutlined className="text-indigo-600 mr-1" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-xl border-slate-200 shadow-2xs bg-white">
              <Statistic
                title={<span className="text-slate-500 font-semibold text-xs">Giá trị đơn hàng trung bình</span>}
                value={stats.avgOrderAmount ?? 0}
                precision={0}
                suffix="đ"
                formatter={(val) => Number(val || 0).toLocaleString('vi-VN')}
                valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#059669', fontFamily: 'monospace' }}
                prefix={<DollarOutlined className="text-emerald-600 mr-1" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-xl border-slate-200 shadow-2xs bg-white">
              <Statistic
                title={<span className="text-slate-500 font-semibold text-xs">Đã mua trong 7 ngày qua</span>}
                value={stats.totalAmountLast7Days ?? 0}
                precision={0}
                suffix="đ"
                formatter={(val) => Number(val || 0).toLocaleString('vi-VN')}
                valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#4f46e5', fontFamily: 'monospace' }}
                prefix={<RiseOutlined className="text-indigo-600 mr-1" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-xl border-slate-200 shadow-2xs bg-white">
              <Statistic
                title={<span className="text-slate-500 font-semibold text-xs">Thời gian hoàn thành</span>}
                value={stats.avgCompletionDays ?? 1}
                suffix="Ngày"
                valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#d97706' }}
                prefix={<FieldTimeOutlined className="text-amber-600 mr-1" />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filter & Search Bar */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <Input
              placeholder="Tìm theo mã PO hoặc Tên Nhà Cung Cấp..."
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
                fetchPurchases(1, pagination.limit, searchText, val);
              }}
              style={{ width: 180 }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'CONFIRMED', label: 'Đơn mua (CONFIRMED)' },
                { value: 'DRAFT', label: 'Báo giá DRAFT' },
                { value: 'DONE', label: 'Hoàn thành (DONE)' },
                { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={purchases}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchPurchases(p, l),
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} đơn mua`,
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
