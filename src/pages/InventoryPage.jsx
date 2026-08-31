import React, { useState, useEffect } from 'react';
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
  Tabs,
  InputNumber,
  notification,
  Avatar,
  Image
} from 'antd';
import {
  InboxOutlined,
  HistoryOutlined,
  SlidersOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  BoxPlotOutlined
} from '@ant-design/icons';
import { inventoryApi, productsApi } from '../api/modulesApi';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const MOVE_TYPE_TAGS = {
  IN: <Tag color="green" icon={<ArrowDownOutlined />} className="font-bold">Nhập Kho (IN)</Tag>,
  OUT: <Tag color="red" icon={<ArrowUpOutlined />} className="font-bold">Xuất Kho (OUT)</Tag>,
  ADJUSTMENT: <Tag color="gold" icon={<SwapOutlined />} className="font-bold">Điều Chỉnh (ADJUST)</Tag>,
};

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('moves');

  // Stock moves state (Tab 1)
  const [moves, setMoves] = useState([]);
  const [movesLoading, setMovesLoading] = useState(false);
  const [movesSearch, setMovesSearch] = useState('');

  // Products stock state (Tab 2)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [prodSearch, setProdSearch] = useState('');

  // Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchStockMoves = async () => {
    setMovesLoading(true);
    try {
      const res = await inventoryApi.getStockMoves();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setMoves(data);
      } else {
        setMoves([]);
      }
    } catch (err) {
      console.warn('Fetch stock moves error:', err);
      setMoves([]);
    } finally {
      setMovesLoading(false);
    }
  };

  const fetchProductsStock = async () => {
    setProductsLoading(true);
    try {
      const res = await productsApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('Fetch products stock error:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockMoves();
    fetchProductsStock();
  }, []);

  const handleOpenAdjustModal = (product = null) => {
    form.resetFields();
    if (product) {
      form.setFieldsValue({
        productId: product.id,
        actualStock: product.qtyAvailable ?? product.stock ?? product.quantity ?? 0,
      });
    }
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (values) => {
    setAdjustSubmitting(true);
    const payload = {
      productId: Number(values.productId),
      actualStock: Number(values.actualStock),
      note: values.note || 'Kiểm kê định kỳ kho phụ tùng',
    };

    try {
      await inventoryApi.adjustStock(payload);
      notification.success({
        message: 'Điều chỉnh kho thành công',
        description: `Đã cập nhật số dư tồn kho thực tế cho sản phẩm #${values.productId}.`,
      });
      setIsAdjustModalOpen(false);
      fetchStockMoves();
      fetchProductsStock();
    } catch (err) {
      console.error('Adjust stock error:', err);
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Không thể điều chỉnh tồn kho');
      notification.error({
        message: 'Lỗi điều chỉnh tồn kho',
        description: msg,
      });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const filteredMoves = moves.filter(
    (m) =>
      (m.reference && m.reference.toLowerCase().includes(movesSearch.toLowerCase())) ||
      (m.productName && m.productName.toLowerCase().includes(movesSearch.toLowerCase())) ||
      (m.product?.name && m.product.name.toLowerCase().includes(movesSearch.toLowerCase()))
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      (p.defaultCode && p.defaultCode.toLowerCase().includes(prodSearch.toLowerCase())) ||
      (p.brandSku && p.brandSku.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  const movesColumns = [
    {
      title: 'Thời Gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="font-mono text-slate-500 text-xs font-semibold">
          {date ? new Date(date).toLocaleString('vi-VN') : '29/08/2026 12:00'}
        </span>
      ),
    },
    {
      title: 'Mã Tham Chiếu',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref, r) => (
        <span className="font-mono font-extrabold text-indigo-700 text-xs">
          {ref || r.code || `REF-${r.id}`}
        </span>
      ),
    },
    {
      title: 'Loại Biến Động',
      dataIndex: 'type',
      key: 'type',
      render: (type) => MOVE_TYPE_TAGS[type] || <Tag color="default">{type || 'ADJUSTMENT'}</Tag>,
    },
    {
      title: 'Phụ Tùng / Sản Phẩm',
      key: 'productName',
      render: (_, r) => (
        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          {r.productName || r.product?.name || `Sản phẩm #${r.productId}`}
        </span>
      ),
    },
    {
      title: 'Số Lượng Biến Động',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, r) => {
        const num = Number(qty || 0);
        const isPositive = num > 0 || r.type === 'IN';
        return (
          <span className={`font-mono font-black text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? `+${num}` : num}
          </span>
        );
      },
    },
    {
      title: 'Ghi Chú',
      dataIndex: 'note',
      key: 'note',
      render: (note) => <span className="text-slate-600 text-xs italic">{note || 'N/A'}</span>,
    },
  ];

  const productsStockColumns = [
    {
      title: 'Hình Ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
      render: (imgUrl, record) => {
        const src = resolveUrl(imgUrl);
        const initialLetter = (record.name || 'P')[0].toUpperCase();
        if (!src) {
          return (
            <Avatar shape="square" size={36} className="bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-100 flex items-center justify-center">
              {initialLetter}
            </Avatar>
          );
        }
        return (
          <Image
            src={src}
            alt={record.name}
            width={36}
            height={36}
            className="object-cover rounded-lg border border-slate-200"
            fallback="https://placehold.co/100x100?text=No+Image"
          />
        );
      },
    },
    {
      title: 'Tên Phụ Tùng',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-bold text-slate-900 text-xs">{name}</span>,
    },
    {
      title: 'Mã Barcode',
      dataIndex: 'defaultCode',
      key: 'defaultCode',
      render: (code) => <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">{code || 'N/A'}</code>,
    },
    {
      title: 'Tồn Kho Hiện Tại',
      key: 'stock',
      render: (_, r) => {
        const qty = r.qtyAvailable ?? r.stock ?? r.quantity ?? 0;
        const color = qty > 10 ? 'green' : (qty > 0 ? 'gold' : 'red');
        return <Tag color={color} className="font-black text-xs">{qty} Sản phẩm</Tag>;
      },
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<SlidersOutlined />}
          onClick={() => handleOpenAdjustModal(record)}
          className="bg-amber-600 hover:bg-amber-500 font-bold text-xs border-0"
        >
          Kiểm Kê Kho
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <InboxOutlined className="text-indigo-600" /> Quản Lý Kho & Tồn Kho Real-time (Inventory)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Nhật ký biến động kho (Audit Trail) & Kiểm kê điều chỉnh số dư kho thực tế (`/api/v1/inventory`)
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStockMoves(); fetchProductsStock(); }} className="text-xs font-semibold">
            Làm mới kho
          </Button>
          <Button
            type="primary"
            icon={<SlidersOutlined />}
            onClick={() => handleOpenAdjustModal()}
            className="bg-amber-600 hover:bg-amber-500 font-bold shadow-sm shadow-amber-100 text-xs border-0"
          >
            Kiểm Kê Điều Chỉnh Kho
          </Button>
        </Space>
      </div>

      {/* Tabs Container */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: 'moves',
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <HistoryOutlined /> Nhật Ký Biến Động Kho (Audit Trail)
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="max-w-sm">
                    <Input
                      placeholder="Tìm theo mã tham chiếu hoặc tên phụ tùng..."
                      prefix={<SearchOutlined className="text-slate-400" />}
                      value={movesSearch}
                      onChange={(e) => setMovesSearch(e.target.value)}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    columns={movesColumns}
                    dataSource={filteredMoves}
                    rowKey={(r) => r.id || r.reference}
                    loading={movesLoading}
                    pagination={{
                      defaultPageSize: 10,
                      pageSizeOptions: ['10', '20', '50'],
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} biến động`,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'products',
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <BoxPlotOutlined /> Kiểm Kê & Tồn Kho Thực Tế
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="max-w-sm">
                    <Input
                      placeholder="Tìm theo tên phụ tùng hoặc mã barcode..."
                      prefix={<SearchOutlined className="text-slate-400" />}
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    columns={productsStockColumns}
                    dataSource={filteredProducts}
                    rowKey="id"
                    loading={productsLoading}
                    pagination={{
                      defaultPageSize: 10,
                      pageSizeOptions: ['10', '20', '50'],
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} phụ tùng`,
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">Kiểm Kê & Điều Chỉnh Tồn Kho Thực Tế</span>}
        open={isAdjustModalOpen}
        onCancel={() => setIsAdjustModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleAdjustStock} className="mt-4">
          <Form.Item
            label="Phụ Tùng Kiểm Kê"
            name="productId"
            rules={[{ required: true, message: 'Vui lòng chọn phụ tùng!' }]}
          >
            <Select
              placeholder="Chọn phụ tùng từ hệ thống..."
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.defaultCode || p.brandSku || `ID #${p.id}`})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Số Lượng Tồn Kho Thực Tế Đếm Được"
            name="actualStock"
            rules={[{ required: true, message: 'Nhập số lượng tồn kho đếm được!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="VD: 50"
            />
          </Form.Item>

          <Form.Item label="Ghi Chú Lý Do Điều Chỉnh" name="note" initialValue="Kiểm kê kho định kỳ">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú lý do chênh lệch tồn kho..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAdjustModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={adjustSubmitting} className="bg-amber-600 font-bold border-0">
              Cập Nhật Số Dư Kho
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
