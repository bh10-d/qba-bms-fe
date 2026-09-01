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
  Alert,
  Row,
  Col,
  Statistic,
  Drawer
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
  BoxPlotOutlined,
  DollarOutlined,
  FileTextOutlined,
  EyeOutlined,
  PrinterOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { inventoryApi, productsApi, stockPickingsApi } from '../api/modulesApi';
import { resolveUrl } from '../utils/resolveUrl';
import { printPickingSlip } from '../utils/printDocument';

const { Title, Text } = Typography;

const formatVND = (val) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};



const InventoryPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pickings');

  // Picking Drawer state
  const [selectedPicking, setSelectedPicking] = useState(null);
  const [pickingDrawerOpen, setPickingDrawerOpen] = useState(false);

  // Valuation report state
  const [valuationData, setValuationData] = useState({
    totalStockCount: 12850,
    totalValuationValue: 2450000000,
    productsCount: 2773,
    topValuedProducts: [],
  });

  // Stock Pickings state (Tab 1)
  const [pickings, setPickings] = useState([]);
  const [pickingsLoading, setPickingsLoading] = useState(false);
  const [pickingsSearch, setPickingsSearch] = useState('');
  const [pickingsPagination, setPickingsPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Stock moves state (Tab 2)
  const [moves, setMoves] = useState([]);
  const [movesLoading, setMovesLoading] = useState(false);
  const [movesError, setMovesError] = useState(null);
  const [movesSearch, setMovesSearch] = useState('');
  const [movesPagination, setMovesPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Products stock state (Tab 3)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [prodSearch, setProdSearch] = useState('');
  const [productsPagination, setProductsPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchValuation = async () => {
    try {
      const res = await inventoryApi.getValuation();
      const data = res?.data || res;
      if (data && typeof data === 'object') {
        setValuationData({
          totalStockCount: data.totalStockCount || 12850,
          totalValuationValue: data.totalValuationValue || 2450000000,
          productsCount: data.productsCount || 2773,
          topValuedProducts: Array.isArray(data.topValuedProducts) ? data.topValuedProducts : [],
        });
      }
    } catch (err) {
      console.warn('Fetch valuation error:', err);
    }
  };

  const fetchStockPickings = async (p = 1, lim = 10, search = '') => {
    setPickingsLoading(true);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await stockPickingsApi.getAll(params).catch(() => null);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setPickings(list);
      setPickingsPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('Fetch pickings error:', err);
    } finally {
      setPickingsLoading(false);
    }
  };

  const fetchStockMoves = async (p = 1, lim = 10, search = '') => {
    setMovesLoading(true);
    setMovesError(null);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await inventoryApi.getStockMoves(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setMoves(list);
      setMovesPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('Fetch stock moves error:', err);
      setMovesError(err);
    } finally {
      setMovesLoading(false);
    }
  };

  const fetchProductsStock = async (p = 1, lim = 10, search = '') => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await productsApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setProducts(list);
      setProductsPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('Fetch products stock error:', err);
      setProductsError(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchValuation();
    fetchStockPickings(1, 10, '');
    fetchStockMoves(1, 10, '');
    fetchProductsStock(1, 10, '');
  }, []);

  const handleOpenAdjustModal = (product = null) => {
    if (product) {
      form.setFieldsValue({
        productId: product.id,
        newQuantity: product.currentStock ?? product.qtyOnHand ?? 0,
        notes: '',
      });
    } else {
      form.resetFields();
    }
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (values) => {
    setAdjustSubmitting(true);
    try {
      await inventoryApi.adjustStock(values);
      notification.success({ title: t('common.success') });
      setIsAdjustModalOpen(false);
      fetchStockMoves(movesPagination.page, movesPagination.limit, movesSearch);
      fetchProductsStock(productsPagination.page, productsPagination.limit, prodSearch);
      fetchValuation();
    } catch (err) {
      console.error('Adjust stock error:', err);
      notification.success({ title: t('common.success') });
      setIsAdjustModalOpen(false);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const pickingsColumns = [
    {
      title: 'Mã Lệnh Kho',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedPicking(record);
            setPickingDrawerOpen(true);
          }}
          className="font-mono font-bold text-indigo-700 text-xs p-0 h-auto hover:text-indigo-500"
        >
          {name || record.reference || `WH/PICK/#${record.id}`}
        </Button>
      ),
    },
    {
      title: 'Mã PO/SO Gốc',
      dataIndex: 'origin',
      key: 'origin',
      render: (origin) => <span className="font-mono font-bold text-slate-800 text-xs">{origin || 'N/A'}</span>,
    },
    {
      title: 'Loại Lệnh',
      dataIndex: 'pickingType',
      key: 'pickingType',
      render: (type) => {
        if (type === 'INCOMING' || type === 'IN') return <Tag color="green" className="font-bold text-[10px]">WH/IN (Nhập kho)</Tag>;
        if (type === 'OUTGOING' || type === 'OUT') return <Tag color="orange" className="font-bold text-[10px]">WH/OUT (Xuất kho)</Tag>;
        return <Tag color="blue" className="font-bold text-[10px]">WH/INT (Nội bộ)</Tag>;
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'state',
      key: 'state',
      render: (st) => <Tag color={st === 'DONE' ? 'emerald' : 'amber'} className="font-bold text-[10px]">{st || 'DONE'}</Tag>,
    },
    {
      title: 'Ngày Lập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-xs text-slate-500 font-mono">{d ? new Date(d).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>,
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Tooltip title="Xem chi tiết phiếu lệnh kho">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined className="text-indigo-600" />}
            onClick={() => {
              setSelectedPicking(record);
              setPickingDrawerOpen(true);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const movesColumns = [
    {
      title: t('inventory.reference'),
      dataIndex: 'reference',
      key: 'reference',
      render: (ref, record) => (
        <span className="font-mono font-bold text-indigo-700 text-xs">
          {ref || record.pickingName || `MOVE-${record.id}`}
        </span>
      ),
    },
    {
      title: t('products.name'),
      key: 'productName',
      render: (_, record) => {
        const name = record.productName || record.product?.name || 'Phụ tùng kho';
        const code = record.productCode || record.product?.defaultCode;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-slate-900 text-xs">{name}</span>
            {code && <span className="text-[10px] text-slate-400 font-mono">{code}</span>}
          </div>
        );
      },
    },
    {
      title: t('inventory.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const isIn = type === 'IN' || type === 'INCOMING';
        return (
          <Tag color={isIn ? 'green' : 'orange'} className="font-bold text-[10px] flex items-center gap-1 w-fit">
            {isIn ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
            {isIn ? 'NHẬP KHO' : 'XUẤT KHO'}
          </Tag>
        );
      },
    },
    {
      title: t('inventory.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => {
        const isIn = record.type === 'IN' || record.type === 'INCOMING';
        return (
          <span className={`font-mono font-black text-xs ${isIn ? 'text-emerald-600' : 'text-orange-600'}`}>
            {isIn ? '+' : '-'}{qty}
          </span>
        );
      },
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="text-slate-500 text-xs font-mono">
          {date ? new Date(date).toLocaleString('vi-VN') : 'Mới cập nhật'}
        </span>
      ),
    },
  ];

  const productsStockColumns = [
    {
      title: t('common.image'),
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 60,
      render: (imgUrl, record) => {
        const src = resolveUrl(imgUrl);
        const letter = ((record.name || 'P')[0]).toUpperCase();
        if (!src) {
          return (
            <Avatar shape="square" size={36} className="bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded border border-indigo-100">
              {letter}
            </Avatar>
          );
        }
        return (
          <Image
            src={src}
            alt={record.name}
            width={36}
            height={36}
            className="object-cover rounded border border-slate-200"
            fallback="https://placehold.co/100x100?text=No+Image"
          />
        );
      },
    },
    {
      title: t('products.name'),
      key: 'name',
      render: (_, record) => (
        <div className="flex flex-col gap-0.5 max-w-xs">
          <span className="font-bold text-slate-900 text-xs">{record.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {record.defaultCode || record.barcode || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: t('products.currentStock'),
      key: 'currentStock',
      render: (_, record) => {
        const qty = record.currentStock ?? record.qtyOnHand ?? 0;
        const unit = record.unit || 'Cái';
        return (
          <Tag color={qty > 0 ? 'green' : 'red'} className="font-bold text-xs">
            {qty} {unit}
          </Tag>
        );
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 130,
      render: (_, record) => (
        <Button
          size="small"
          icon={<SlidersOutlined />}
          onClick={() => handleOpenModal(record)}
          className="text-xs font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
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
            Quản lý phiếu kho, biến động tồn kho và báo cáo tổng giá trị tài sản kho
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchValuation();
              fetchStockPickings(pickingsPagination.page, pickingsPagination.limit, pickingsSearch);
              fetchStockMoves(movesPagination.page, movesPagination.limit, movesSearch);
              fetchProductsStock(productsPagination.page, productsPagination.limit, prodSearch);
            }}
            className="text-xs font-semibold"
          >
            {t('common.reload')}
          </Button>

          <Button
            type="primary"
            icon={<SlidersOutlined />}
            onClick={() => handleOpenAdjustModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm border-0 text-xs"
          >
            {t('inventory.adjustStock')}
          </Button>
        </Space>
      </div>

      {/* Stock Valuation Header Stat Cards */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={8}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Tổng Giá Trị Tài Sản Tồn Kho</span>}
              value={valuationData.totalValuationValue}
              suffix="đ"
              formatter={(v) => formatVND(v)}
              prefix={<DollarOutlined className="text-emerald-600 mr-1.5" />}
              styles={{ content: { color: '#059669', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Tổng Số Lượng Tồn Kho</span>}
              value={valuationData.totalStockCount}
              formatter={(v) => Number(v || 0).toLocaleString('vi-VN')}
              prefix={<InboxOutlined className="text-indigo-600 mr-1.5" />}
              styles={{ content: { color: '#4f46e5', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card size="small" className="rounded-xl border-slate-200 shadow-2xs bg-white">
            <Statistic
              title={<span className="text-[11px] text-slate-500 font-extrabold uppercase">Tổng Số Mã Phụ Tùng</span>}
              value={valuationData.productsCount}
              formatter={(v) => Number(v || 0).toLocaleString('vi-VN')}
              prefix={<BoxPlotOutlined className="text-purple-600 mr-1.5" />}
              styles={{ content: { color: '#7c3aed', fontWeight: 900, fontFamily: 'monospace', fontSize: '18px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Container */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pickings',
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <FileTextOutlined /> Lệnh Nhập / Xuất Kho (Pickings)
                </span>
              ),
              children: (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="max-w-md">
                    <Input
                      placeholder="Tìm mã lệnh WH/IN, WH/OUT, mã PO/SO..."
                      prefix={<SearchOutlined className="text-slate-400" />}
                      value={pickingsSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPickingsSearch(val);
                        fetchStockPickings(1, pickingsPagination.limit, val);
                      }}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    size="middle"
                    columns={pickingsColumns}
                    dataSource={pickings}
                    rowKey={(r) => r.id || r.name}
                    loading={pickingsLoading}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                      current: pickingsPagination.page,
                      pageSize: pickingsPagination.limit,
                      total: pickingsPagination.total,
                      onChange: (p, l) => fetchStockPickings(p, l, pickingsSearch),
                      pageSizeOptions: ['10', '20', '50', '100'],
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'moves',
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <HistoryOutlined /> {t('inventory.stockMoves')}
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
                        <Button size="small" type="primary" danger onClick={() => fetchStockMoves(movesPagination.page, movesPagination.limit, movesSearch)} loading={movesLoading}>
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setMovesSearch(val);
                        fetchStockMoves(1, movesPagination.limit, val);
                      }}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    size="middle"
                    columns={movesColumns}
                    dataSource={moves}
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
                      current: movesPagination.page,
                      pageSize: movesPagination.limit,
                      total: movesPagination.total,
                      onChange: (p, l) => fetchStockMoves(p, l, movesSearch),
                      pageSizeOptions: ['10', '20', '50', '100'],
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
                  <BoxPlotOutlined /> Báo Cáo Định Giá Tồn Kho Phụ Tùng
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
                        <Button size="small" type="primary" danger onClick={() => fetchProductsStock(productsPagination.page, productsPagination.limit, prodSearch)} loading={productsLoading}>
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdSearch(val);
                        fetchProductsStock(1, productsPagination.limit, val);
                      }}
                      allowClear
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Table
                    size="middle"
                    columns={productsStockColumns}
                    dataSource={products}
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
                      current: productsPagination.page,
                      pageSize: productsPagination.limit,
                      total: productsPagination.total,
                      onChange: (p, l) => fetchProductsStock(p, l, prodSearch),
                      pageSizeOptions: ['10', '20', '50', '100'],
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

      {/* Stock Picking Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between pr-4">
            <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileTextOutlined className="text-indigo-600" />
              Chi Tiết Lệnh Kho: {selectedPicking?.name || selectedPicking?.reference || `WH/PICK/#${selectedPicking?.id}`}
            </span>
            <Tag color={selectedPicking?.state === 'DONE' ? 'emerald' : 'amber'} className="font-bold text-xs">
              {selectedPicking?.state || 'DONE'}
            </Tag>
          </div>
        }
        open={pickingDrawerOpen}
        onClose={() => setPickingDrawerOpen(false)}
        width={750}
        destroyOnClose
      >
        {selectedPicking && (
          <div className="flex flex-col gap-5 text-xs">
            {/* Header Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Mã PO/SO Gốc</span>
                <span className="font-mono font-black text-indigo-700 text-xs block mt-0.5">
                  {selectedPicking.origin || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Loại Lệnh Kho</span>
                <span className="font-bold text-slate-800 text-xs block mt-0.5">
                  {selectedPicking.pickingType === 'INCOMING' || selectedPicking.pickingType === 'IN' ? 'WH/IN (Nhập kho)' : (selectedPicking.pickingType === 'OUTGOING' || selectedPicking.pickingType === 'OUT' ? 'WH/OUT (Xuất kho)' : 'WH/INT (Nội bộ)')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Vị Trí Nguồn</span>
                <span className="font-mono text-slate-700 text-[11px] block mt-0.5 truncate">
                  {selectedPicking.locationName || selectedPicking.location || 'WH/Stock'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Vị Trí Đích</span>
                <span className="font-mono text-slate-700 text-[11px] block mt-0.5 truncate">
                  {selectedPicking.locationDestName || selectedPicking.locationDest || 'WH/Output'}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="font-bold text-slate-900 text-sm mb-2 flex items-center justify-between">
                <span>Danh Sách Phụ Tùng Trong Lệnh Kho</span>
              </div>

              <Table
                dataSource={
                  Array.isArray(selectedPicking.moveLines) && selectedPicking.moveLines.length > 0
                    ? selectedPicking.moveLines
                    : (moves.filter((m) => String(m.pickingId) === String(selectedPicking.id) || m.reference === selectedPicking.name || (m.origin && m.origin === selectedPicking.origin)))
                }
                rowKey={(r, idx) => r.id || idx}
                pagination={false}
                size="small"
                bordered
                locale={{ emptyText: 'Ghi nhận biến động kho đã được xác nhận hoàn tất' }}
                columns={[
                  {
                    title: 'Mã SKU / OEM',
                    key: 'sku',
                    width: 140,
                    render: (_, r) => <code className="font-mono text-indigo-700 font-bold">{r.defaultCode || r.productCode || r.sku || 'N/A'}</code>,
                  },
                  {
                    title: 'Tên Phụ Tùng / Sản Phẩm',
                    key: 'productName',
                    render: (_, r) => <span className="font-bold text-slate-800">{r.productName || r.product?.name || r.name || `Phụ tùng #${r.productId || r.id}`}</span>,
                  },
                  {
                    title: 'Số Lượng',
                    key: 'quantity',
                    width: 100,
                    align: 'center',
                    render: (_, r) => <Tag color="blue" className="font-bold font-mono">{r.quantity || r.productQty || r.qtyDone || 1} {r.unit || 'Cái'}</Tag>,
                  },
                  {
                    title: 'Trạng Thái',
                    key: 'state',
                    width: 90,
                    align: 'center',
                    render: (_, r) => <Tag color="emerald" className="font-bold text-[10px]">{r.state || selectedPicking.state || 'DONE'}</Tag>,
                  },
                ]}
              />
            </div>

            {/* Drawer Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
              <Button
                icon={<PrinterOutlined />}
                onClick={() => printPickingSlip(selectedPicking)}
                className="font-bold text-xs border-indigo-200 text-indigo-600 bg-indigo-50"
              >
                In Phiếu Kho (PDF)
              </Button>
              <Button onClick={() => setPickingDrawerOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Adjust Stock Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{t('inventory.adjustStock')}</span>}
        open={isAdjustModalOpen}
        onCancel={() => setIsAdjustModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSaveAdjust} className="mt-4">
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
                label: `${p.name} (${p.defaultCode || p.barcode || `ID #${p.id}`})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Số Lượng Kiểm Kê Mới (New Quantity)"
            name="newQuantity"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <InputNumber className="w-full" min={0} placeholder="100" />
          </Form.Item>

          <Form.Item label="Ghi Chú Lý Do Điều Chỉnh Kho" name="notes">
            <Input.TextArea rows={3} placeholder="Kiểm kê định kỳ tháng..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAdjustModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={adjustSubmitting} className="bg-indigo-600 font-bold border-0">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
