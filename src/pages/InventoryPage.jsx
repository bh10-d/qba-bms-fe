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
  Image,
  Tooltip,
  Alert
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
import { useTranslation } from 'react-i18next';
import { inventoryApi, productsApi } from '../api/modulesApi';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const InventoryPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('moves');

  // Stock moves state (Tab 1)
  const [moves, setMoves] = useState([]);
  const [movesLoading, setMovesLoading] = useState(false);
  const [movesError, setMovesError] = useState(null);
  const [movesSearch, setMovesSearch] = useState('');

  // Products stock state (Tab 2)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [prodSearch, setProdSearch] = useState('');

  // Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchStockMoves = async () => {
    setMovesLoading(true);
    setMovesError(null);
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
      setMovesError(err);
    } finally {
      setMovesLoading(false);
    }
  };

  const fetchProductsStock = async () => {
    setProductsLoading(true);
    setProductsError(null);
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
      setProductsError(err);
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
      note: values.note || 'Inventory Adjustment',
    };

    try {
      await inventoryApi.adjustStock(payload);
      notification.success({
        message: t('common.success'),
        description: `#${values.productId}`,
      });
      setIsAdjustModalOpen(false);
      fetchStockMoves();
      fetchProductsStock();
    } catch (err) {
      console.error('Adjust stock error:', err);
      notification.error({
        message: t('common.error'),
        description: t('common.error'),
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
      (p.name || '').toLowerCase().includes(prodSearch.toLowerCase()) ||
      (p.defaultCode && p.defaultCode.toLowerCase().includes(prodSearch.toLowerCase())) ||
      (p.brandSku && p.brandSku.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  const movesColumns = [
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="font-mono text-slate-500 text-xs font-semibold">
          {date ? new Date(date).toLocaleString() : ''}
        </span>
      ),
    },
    {
      title: t('inventory.reference'),
      dataIndex: 'reference',
      key: 'reference',
      render: (ref, r) => (
        <span className="font-mono font-extrabold text-indigo-700 text-xs">
          {ref || r.code || `REF-${r.id}`}
        </span>
      ),
    },
    {
      title: t('inventory.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={type === 'IN' ? 'green' : type === 'OUT' ? 'red' : 'gold'} className="font-bold">{type}</Tag>,
    },
    {
      title: t('products.name'),
      key: 'productName',
      render: (_, r) => {
        const name = r.productName || r.product?.name || `#${r.productId}`;
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
      title: t('inventory.quantity'),
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
  ];

  const productsStockColumns = [
    {
      title: t('common.image'),
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
      title: t('products.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Tooltip title={name} placement="topLeft">
          <span className="font-bold text-slate-900 text-xs truncate block max-w-[240px]">{name}</span>
        </Tooltip>
      ),
    },
    {
      title: t('products.code'),
      dataIndex: 'defaultCode',
      key: 'defaultCode',
      render: (code) => <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">{code || 'N/A'}</code>,
    },
    {
      title: t('inventory.quantity'),
      key: 'stock',
      render: (_, r) => {
        const qty = r.qtyAvailable ?? r.stock ?? r.quantity ?? 0;
        const color = qty > 10 ? 'green' : (qty > 0 ? 'gold' : 'red');
        return <Tag color={color} className="font-black text-xs">{qty}</Tag>;
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<SlidersOutlined />}
          onClick={() => handleOpenAdjustModal(record)}
          className="bg-amber-600 hover:bg-amber-500 font-bold text-xs border-0"
        >
          {t('inventory.adjustStock')}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <InboxOutlined className="text-indigo-600" /> {t('inventory.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            {t('inventory.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStockMoves(); fetchProductsStock(); }} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<SlidersOutlined />}
            onClick={() => handleOpenAdjustModal()}
            className="bg-amber-600 hover:bg-amber-500 font-bold shadow-sm shadow-amber-100 text-xs border-0"
          >
            {t('inventory.adjustStock')}
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
                  <HistoryOutlined /> {t('inventory.moves')}
                </span>
              ),
              children: (
                <div className="flex flex-col gap-3 mt-1">
                  {movesError && (
                    <Alert
                      type="error"
                      showIcon
                      message={t('common.error')}
                      action={
                        <Button size="small" type="primary" danger onClick={fetchStockMoves} loading={movesLoading}>
                          {t('common.reload')}
                        </Button>
                      }
                      className="rounded-xl mb-2"
                    />
                  )}
                  <div className="max-w-md">
                    <Input
                      placeholder={t('inventory.searchPlaceholder')}
                      prefix={<SearchOutlined className="text-slate-400" />}
                      value={movesSearch}
                      onChange={(e) => setMovesSearch(e.target.value)}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    size="middle"
                    columns={movesColumns}
                    dataSource={filteredMoves}
                    rowKey={(r) => r.id || r.reference}
                    loading={movesLoading}
                    scroll={{ x: 'max-content' }}
                    locale={{
                      emptyText: (
                        <div className="py-8 text-center">
                          <HistoryOutlined className="text-slate-300 text-3xl mb-2" />
                          <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                        </div>
                      ),
                    }}
                    pagination={{
                      defaultPageSize: 10,
                      pageSizeOptions: ['10', '20', '50'],
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'products',
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <BoxPlotOutlined /> {t('inventory.title')}
                </span>
              ),
              children: (
                <div className="flex flex-col gap-3 mt-1">
                  {productsError && (
                    <Alert
                      type="error"
                      showIcon
                      message={t('common.error')}
                      action={
                        <Button size="small" type="primary" danger onClick={fetchProductsStock} loading={productsLoading}>
                          {t('common.reload')}
                        </Button>
                      }
                      className="rounded-xl mb-2"
                    />
                  )}
                  <div className="max-w-md">
                    <Input
                      placeholder={t('inventory.searchPlaceholder')}
                      prefix={<SearchOutlined className="text-slate-400" />}
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    size="middle"
                    columns={productsStockColumns}
                    dataSource={filteredProducts}
                    rowKey="id"
                    loading={productsLoading}
                    scroll={{ x: 'max-content' }}
                    locale={{
                      emptyText: (
                        <div className="py-8 text-center">
                          <InboxOutlined className="text-slate-300 text-3xl mb-2" />
                          <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                        </div>
                      ),
                    }}
                    pagination={{
                      defaultPageSize: 10,
                      pageSizeOptions: ['10', '20', '50'],
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
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
        title={<span className="font-bold text-slate-900">{t('inventory.adjustStock')}</span>}
        open={isAdjustModalOpen}
        onCancel={() => setIsAdjustModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleAdjustStock} className="mt-4">
          <Form.Item
            label={t('products.name')}
            name="productId"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              placeholder={t('common.select')}
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.defaultCode || p.brandSku || `ID #${p.id}`})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={t('inventory.quantity')}
            name="actualStock"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="0"
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAdjustModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={adjustSubmitting} className="bg-amber-600 font-bold border-0">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
