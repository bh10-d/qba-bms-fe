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
  Popconfirm,
  Tag,
  Select,
  Avatar,
  Image,
  Tooltip,
  notification,
  Alert,
  Drawer,
  Descriptions,
  Badge,
  InputNumber,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BoxPlotOutlined,
  BarcodeOutlined,
  ReloadOutlined,
  EyeOutlined,
  ShopOutlined,
  CarOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  FilePdfOutlined,
  SwapOutlined,
  FileTextOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productsApi, brandsApi, vehiclesApi, enginesApi, gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const formatVND = (val) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const parseDescription = (desc, lang = 'vi') => {
  if (!desc) return '';
  let obj = desc;
  if (typeof desc === 'string') {
    const trimmed = desc.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        // Fix unescaped backslashes before quotes/spaces
        const fixedJson = trimmed.replace(/\\(?![/"bfnrtu])/g, '\\\\');
        obj = JSON.parse(fixedJson);
      } catch (e) {
        try {
          obj = JSON.parse(trimmed);
        } catch (e2) {
          const isEn = String(lang).toLowerCase().startsWith('en');
          const viMatch = trimmed.match(/"vi_VN"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);
          const enMatch = trimmed.match(/"en_US"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);
          
          if (isEn && enMatch && enMatch[1]) {
            return enMatch[1].replace(/\\/g, '').trim();
          }
          if (viMatch && viMatch[1]) {
            return viMatch[1].replace(/\\/g, '').trim();
          }
          if (enMatch && enMatch[1]) {
            return enMatch[1].replace(/\\/g, '').trim();
          }

          return trimmed
            .replace(/^\{|\}$/g, '')
            .replace(/"(en_US|vi_VN)"\s*:\s*/g, '')
            .replace(/\\/g, '')
            .replace(/^"|"$/g, '')
            .trim();
        }
      }
    } else {
      return desc;
    }
  }

  if (typeof obj === 'object' && obj !== null) {
    const isEn = String(lang).toLowerCase().startsWith('en');
    const val = isEn ? (obj.en_US || obj.vi_VN) : (obj.vi_VN || obj.en_US);
    if (val && typeof val === 'string') return val.replace(/\\/g, '').trim();

    const firstStr = Object.values(obj).find((v) => typeof v === 'string' && v.trim());
    if (firstStr) return firstStr.replace(/\\/g, '').trim();
  }

  return String(desc);
};

const ProductsPage = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [brandsList, setBrandsList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [enginesList, setEnginesList] = useState([]);
  const [gearboxesList, setGearboxesList] = useState([]);

  // Smart Matrix Filter States
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(undefined);
  const [selectedVehicle, setSelectedVehicle] = useState(undefined);
  const [selectedEngine, setSelectedEngine] = useState(undefined);
  const [selectedGearbox, setSelectedGearbox] = useState(undefined);
  const [selectedHasDoc, setSelectedHasDoc] = useState(undefined);

  // Modals & Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activePdfDoc, setActivePdfDoc] = useState(null);

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const hasDocCheck = (p) => (Array.isArray(p.documents) && p.documents.length > 0) || p.hasDocuments === true || Boolean(p.catalogUrl || p.pdfUrl || p.drawingUrl);

  const fetchProducts = useCallback(async (p = 1, lim = 10, search = searchText, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const brandId = 'brandId' in filters ? filters.brandId : selectedBrand;
      const vehicleId = 'vehicleId' in filters ? filters.vehicleId : selectedVehicle;
      const engineId = 'engineId' in filters ? filters.engineId : selectedEngine;
      const gearboxId = 'gearboxId' in filters ? filters.gearboxId : selectedGearbox;
      const hasDocVal = 'hasDoc' in filters ? filters.hasDoc : selectedHasDoc;

      if (brandId) params.brandId = brandId;
      if (vehicleId) params.vehicleId = vehicleId;
      if (engineId) params.engineId = engineId;
      if (gearboxId) params.gearboxId = gearboxId;
      if (hasDocVal) params.hasDocuments = hasDocVal === 'has_doc';

      const res = await productsApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      let list = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.items) ? rawData.items : []));

      // Client-side fallback filtering for document catalog filter
      if (hasDocVal === 'has_doc') {
        list = list.filter(hasDocCheck);
      } else if (hasDocVal === 'no_doc') {
        list = list.filter((p) => !hasDocCheck(p));
      }

      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setProducts(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('API products fetch failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedBrand, selectedVehicle, selectedEngine, selectedGearbox, selectedHasDoc]);

  const fetchMetadata = async () => {
    try {
      const [bRes, vRes, eRes, gRes] = await Promise.allSettled([
        brandsApi.getAll(),
        vehiclesApi.getAll(),
        enginesApi.getAll(),
        gearboxesApi.getAll(),
      ]);

      if (bRes.status === 'fulfilled') {
        const d = bRes.value?.data || bRes.value;
        if (Array.isArray(d)) setBrandsList(d);
      }
      if (vRes.status === 'fulfilled') {
        const d = vRes.value?.data || vRes.value;
        if (Array.isArray(d)) setVehiclesList(d);
      }
      if (eRes.status === 'fulfilled') {
        const d = eRes.value?.data || eRes.value;
        if (Array.isArray(d)) setEnginesList(d);
      }
      if (gRes.status === 'fulfilled') {
        const d = gRes.value?.data || gRes.value;
        if (Array.isArray(d)) setGearboxesList(d);
      }
    } catch (err) {
      console.warn('Metadata fetch failed in ProductsPage:', err);
    }
  };

  useEffect(() => {
    fetchProducts(1, 10, '');
    fetchMetadata();
  }, []);

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedBrand(undefined);
    setSelectedVehicle(undefined);
    setSelectedEngine(undefined);
    setSelectedGearbox(undefined);
    setSelectedHasDoc(undefined);
    fetchProducts(1, pagination.limit, '', {
      brandId: null,
      vehicleId: null,
      engineId: null,
      gearboxId: null,
      hasDoc: null,
    });
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingProduct) {
        form.setFieldsValue({
          name: editingProduct.name || editingProduct.title,
          defaultCode: editingProduct.defaultCode || editingProduct.code || editingProduct.sku,
          brandSku: editingProduct.brandSku || editingProduct.brandCode,
          barcode: editingProduct.barcode,
          brandId: editingProduct.brandId || editingProduct.brand?.id,
          categoryName: editingProduct.categoryName || editingProduct.category,
          listPrice: editingProduct.listPrice ? Number(editingProduct.listPrice) : (editingProduct.price ? Number(editingProduct.price) : 0),
          unit: editingProduct.unit || 'Cái',
          location: editingProduct.location,
          weight: editingProduct.weight,
          volume: editingProduct.volume,
          description: parseDescription(editingProduct.description, i18n.language),
          imageUrl: editingProduct.imageUrl,
          vehicleIds: editingProduct.vehicleIds || (Array.isArray(editingProduct.vehicles) ? editingProduct.vehicles.map((v) => (typeof v === 'object' ? v.id : v)) : []),
          engineIds: editingProduct.engineIds || (Array.isArray(editingProduct.engines) ? editingProduct.engines.map((e) => (typeof e === 'object' ? e.id : e)) : []),
          gearboxIds: editingProduct.gearboxIds || (Array.isArray(editingProduct.gearboxes) ? editingProduct.gearboxes.map((g) => (typeof g === 'object' ? g.id : g)) : []),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ unit: 'Cái' });
      }
    }
  }, [isModalOpen, editingProduct, form, i18n.language]);

  const handleOpenModal = (record = null) => {
    setEditingProduct(record);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const selBrandObj = brandsList.find((b) => String(b.id) === String(values.brandId));
    const brandName = selBrandObj?.name || (values.brandId ? 'Brand' : null);

    const payload = {};
    if (values.name) payload.name = values.name;
    if (values.defaultCode) payload.defaultCode = values.defaultCode;
    if (values.brandSku) payload.brandSku = values.brandSku;
    if (values.barcode) payload.barcode = values.barcode;
    payload.brandId = values.brandId ? Number(values.brandId) : null;
    if (values.categoryName) payload.categoryName = values.categoryName;
    if (values.listPrice !== undefined) payload.listPrice = values.listPrice;
    if (values.unit) payload.unit = values.unit;
    if (values.location) payload.location = values.location;
    if (values.weight) payload.weight = values.weight;
    if (values.volume) payload.volume = values.volume;
    if (values.description) payload.description = values.description;
    if (values.imageUrl) payload.imageUrl = values.imageUrl;
    if (Array.isArray(values.vehicleIds)) payload.vehicleIds = values.vehicleIds.map(Number);
    if (Array.isArray(values.engineIds)) payload.engineIds = values.engineIds.map(Number);
    if (Array.isArray(values.gearboxIds)) payload.gearboxIds = values.gearboxIds.map(Number);

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, brand: { ...p.brand, name: brandName } } : p)));
        notification.success({ title: t('common.success'), message: values.name });
      } else {
        const res = await productsApi.create(payload);
        const createdData = res?.data || res;
        const newProduct = {
          id: createdData?.id || Date.now(),
          ...payload,
          ...createdData,
          brand: { name: brandName },
        };
        setProducts([newProduct, ...products]);
        notification.success({ title: t('common.success'), message: values.name });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save product error:', err);
      if (editingProduct) {
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, brand: { name: brandName } } : p)));
      } else {
        setProducts([{ id: Date.now(), ...payload, brand: { name: brandName } }, ...products]);
      }
      notification.success({ title: t('common.success'), message: values.name });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? (record.name || record.title) : '';
    try {
      await productsApi.delete(targetId);
    } catch (err) {
      console.warn('Delete product error:', err);
    } finally {
      setProducts(products.filter((p) => p.id !== targetId));
      notification.info({ title: t('common.info'), message: targetName });
    }
  };

  const columns = [
    {
      title: t('common.image'),
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 65,
      render: (imgUrl, record) => {
        const src = resolveUrl(imgUrl);
        const initialLetter = ((record.name || record.title || 'P')[0]).toUpperCase();

        if (!src) {
          return (
            <Avatar
              shape="square"
              size={40}
              className="bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-lg border border-indigo-100 shrink-0 flex items-center justify-center"
            >
              {initialLetter}
            </Avatar>
          );
        }
        return (
          <Image
            src={src}
            alt={record.name || record.title}
            width={40}
            height={40}
            className="object-cover rounded-lg border border-slate-200 shadow-2xs"
            fallback="https://placehold.co/100x100?text=No+Image"
          />
        );
      },
    },
    {
      title: t('products.name'),
      key: 'name',
      width: 220,
      render: (_, record) => {
        const name = parseDescription(record.name || record.title || 'Product', i18n.language);
        const category = record.categoryName || record.category;
        const hasDoc = hasDocCheck(record);

        return (
          <div className="flex flex-col gap-0.5 max-w-[220px]">
            <Tooltip title={name} placement="topLeft">
              <span className="font-bold text-slate-900 text-xs truncate block">
                {name}
              </span>
            </Tooltip>
            <div className="flex items-center gap-1 flex-wrap">
              {category && (
                <span className="text-[10px] text-slate-500 font-semibold truncate block">
                  {category}
                </span>
              )}
              {hasDoc && (
                <Tag
                  color="red"
                  className="font-bold text-[9px] px-1 py-0 border-red-200 text-red-600 bg-red-50 cursor-pointer flex items-center gap-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetailDrawer(record);
                  }}
                >
                  <FilePdfOutlined className="text-red-500 text-[10px]" /> Catalog
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('products.code'),
      key: 'codes',
      width: 150,
      render: (_, record) => {
        const defaultCode = record.defaultCode || record.code || record.sku || record.barcode || 'N/A';
        const brandSku = record.brandSku || record.brandCode || 'N/A';
        return (
          <div className="flex flex-col gap-0.5">
            <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold w-fit">
              <BarcodeOutlined className="mr-1" /> {defaultCode}
            </code>
            <span className="text-[10px] text-slate-500 font-mono">SKU: {brandSku}</span>
          </div>
        );
      },
    },
    {
      title: t('products.location'),
      dataIndex: 'location',
      key: 'location',
      width: 130,
      render: (loc) => (
        loc ? (
          <Tag color="blue" className="font-mono font-bold text-[10px] m-0">
            <EnvironmentOutlined className="mr-1 text-indigo-500" />{loc}
          </Tag>
        ) : (
          <span className="text-[10px] text-slate-400">Chưa gán</span>
        )
      ),
    },
    {
      title: t('brands.name'),
      key: 'brandName',
      width: 110,
      render: (_, record) => {
        const bName = record.brand?.name || record.brandName || (record.brandId ? brandsList.find((b) => String(b.id) === String(record.brandId))?.name : null);
        return bName ? <Tag color="cyan" className="font-bold text-[10px] m-0">{bName}</Tag> : <span className="text-[10px] text-slate-400">N/A</span>;
      },
    },
    {
      title: t('products.listPrice'),
      key: 'listPrice',
      width: 130,
      render: (_, record) => {
        const price = record.listPrice ? Number(record.listPrice) : (record.price ? Number(record.price) : 0);
        const unit = record.unit || 'Cái';
        return (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-emerald-600 text-xs">{formatVND(price)}</span>
            <span className="text-[10px] text-slate-400 font-medium">/ {unit}</span>
          </div>
        );
      },
    },
    {
      title: t('products.currentStock'),
      key: 'stock',
      width: 100,
      render: (_, record) => {
        const qty = record.currentStock ?? record.qtyOnHand ?? record.quantity ?? 0;
        const unit = record.unit || 'Cái';
        return (
          <Tag color={qty > 0 ? 'green' : 'red'} className="font-bold text-[10px]">
            {qty} {unit}
          </Tag>
        );
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined className="text-indigo-600" />}
              onClick={() => {
                setSelectedProduct(record);
                setIsDetailDrawerOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-indigo-600" />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title={t('products.deleteConfirm')}
            onConfirm={() => handleDelete(record)}
            okButtonProps={{ danger: true }}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
          >
            <Tooltip title={t('common.delete')}>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
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
            <BoxPlotOutlined className="text-indigo-600" /> {t('products.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            {t('products.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={() => fetchProducts(pagination.page, pagination.limit, searchText)} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm border-0 text-xs"
          >
            {t('products.createNew')}
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={t('common.error')}
          action={
            <Button size="small" type="primary" danger onClick={() => fetchProducts(1, pagination.limit, searchText)} loading={loading}>
              {t('common.reload')}
            </Button>
          }
          className="rounded-xl mb-4"
        />
      )}

      {/* Smart Matrix Filter Bar */}
      <Card size="small" className="rounded-xl border-slate-200 shadow-xs bg-slate-50/50">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 flex-1">
            {/* 1. Search Text Input */}
            <Input
              placeholder={t('products.searchPlaceholder')}
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => {
                const val = e.target.value;
                setSearchText(val);
                fetchProducts(1, pagination.limit, val);
              }}
              allowClear
              size="small"
              className="rounded-lg text-xs"
            />

            {/* 2. Brand Filter */}
            <Select
              allowClear
              size="small"
              placeholder={t('brands.name')}
              value={selectedBrand}
              onChange={(val) => {
                setSelectedBrand(val);
                fetchProducts(1, pagination.limit, searchText, { brandId: val });
              }}
              options={brandsList.map((b) => ({ value: b.id, label: b.name || `Brand #${b.id}` }))}
              className="rounded-lg text-xs"
            />

            {/* 3. Vehicle Filter */}
            <Select
              allowClear
              size="small"
              placeholder={t('vehicles.title') || 'Dòng xe'}
              value={selectedVehicle}
              onChange={(val) => {
                setSelectedVehicle(val);
                fetchProducts(1, pagination.limit, searchText, { vehicleId: val });
              }}
              options={vehiclesList.map((v) => ({ value: v.id, label: v.name || v.modelCode || `Vehicle #${v.id}` }))}
              className="rounded-lg text-xs"
            />

            {/* 4. Engine Filter */}
            <Select
              allowClear
              size="small"
              placeholder={t('engines.title') || 'Động cơ'}
              value={selectedEngine}
              onChange={(val) => {
                setSelectedEngine(val);
                fetchProducts(1, pagination.limit, searchText, { engineId: val });
              }}
              options={enginesList.map((e) => ({ value: e.id, label: e.code || e.name || `Engine #${e.id}` }))}
              className="rounded-lg text-xs"
            />

            {/* 5. Gearbox Filter */}
            <Select
              allowClear
              size="small"
              placeholder={t('gearboxes.title') || 'Hộp số'}
              value={selectedGearbox}
              onChange={(val) => {
                setSelectedGearbox(val);
                fetchProducts(1, pagination.limit, searchText, { gearboxId: val });
              }}
              options={gearboxesList.map((g) => ({ value: g.id, label: g.code || g.name || `Gearbox #${g.id}` }))}
              className="rounded-lg text-xs"
            />

            {/* 6. Document / Catalog Filter */}
            <Select
              allowClear
              size="small"
              placeholder="Bản vẽ & Catalog"
              value={selectedHasDoc}
              onChange={(val) => {
                setSelectedHasDoc(val);
                fetchProducts(1, pagination.limit, searchText, { hasDoc: val });
              }}
              options={[
                { value: 'has_doc', label: 'Có bản vẽ & Catalog PDF' },
                { value: 'no_doc', label: 'Chưa có bản vẽ' },
              ]}
              className="rounded-lg text-xs"
            />
          </div>

          {(searchText || selectedBrand || selectedVehicle || selectedEngine || selectedGearbox || selectedHasDoc) && (
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              className="text-xs font-semibold border-slate-300 text-slate-600 shrink-0"
            >
              {t('common.clear')}
            </Button>
          )}
        </div>
      </Card>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <Table
          size="middle"
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <BoxPlotOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('products.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: Number(pagination.page || 1),
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, s) => fetchProducts(p, s, searchText),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingProduct ? t('products.editTitle') : t('products.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label={t('products.name')} name="name" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="Tên sản phẩm phụ tùng" />
          </Form.Item>

          <Form.Item label={t('common.image')} name="imageUrl">
            <ImageUploadInput resModel="product" placeholder="/uploads/filestore/..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('products.code')} name="defaultCode">
              <Input placeholder="Mã phụ tùng (vd: BN.148)" />
            </Form.Item>
            <Form.Item label="SKU Thương Hiệu" name="brandSku">
              <Input placeholder="Mã SKU (vd: A5DL4-1307100)" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label={t('products.categoryName')} name="categoryName">
              <Input placeholder="PHỤ TÙNG MÁY / BN - Bơm nước" />
            </Form.Item>

            <Form.Item label={t('products.listPrice')} name="listPrice">
              <InputNumber className="w-full" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} placeholder="2600000" />
            </Form.Item>

            <Form.Item label={t('products.unit')} name="unit">
              <Input placeholder="Cái" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('brands.name')} name="brandId">
              <Select
                placeholder={t('common.select')}
                allowClear
                showSearch
                optionFilterProp="label"
                options={brandsList.map((b) => ({
                  value: b.id,
                  label: `${b.name || b.code || `Brand #${b.id}`}`,
                }))}
              />
            </Form.Item>

            <Form.Item label={t('products.location')} name="location">
              <Input placeholder="Kho Chính / Dãy A - Kệ 01" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('products.weight')} name="weight">
              <Input placeholder="0.000 (kg)" />
            </Form.Item>
            <Form.Item label={t('products.volume')} name="volume">
              <Input placeholder="0.000 (m³)" />
            </Form.Item>
          </div>

          <Form.Item label={t('products.description')} name="description">
            <Input.TextArea rows={3} placeholder="Thông số kỹ thuật chi tiết..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 3-Tab Product Details Drawer */}
      <Drawer
        title={<span className="font-bold text-slate-900 text-lg">{t('products.title')} #{selectedProduct?.id}</span>}
        placement="right"
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        size="large"
      >
        {selectedProduct && (
          <Tabs
            type="card"
            className="mt-1"
            items={[
              {
                key: 'overview',
                label: <span className="font-bold flex items-center gap-1.5"><BoxPlotOutlined /> {t('common.info')}</span>,
                children: (
                  <div className="flex flex-col gap-4 py-2">
                    {/* Product Header Profile Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
                      {resolveUrl(selectedProduct.imageUrl) ? (
                        <Image
                          src={resolveUrl(selectedProduct.imageUrl)}
                          alt={selectedProduct.name}
                          width={80}
                          height={80}
                          className="object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-700 font-extrabold text-2xl rounded-xl border border-indigo-200 flex items-center justify-center shrink-0">
                          {((selectedProduct.name || 'P')[0]).toUpperCase()}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 overflow-hidden flex-1">
                        <div className="font-bold text-slate-900 text-base leading-snug">
                          {selectedProduct.name || selectedProduct.title}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {selectedProduct.categoryName && (
                            <Tag color="purple" className="font-bold text-[10px] m-0">
                              {selectedProduct.categoryName}
                            </Tag>
                          )}
                          {selectedProduct.location && (
                            <Tag color="blue" className="font-mono font-bold text-[10px] m-0">
                              <EnvironmentOutlined className="mr-1 text-indigo-500" />{selectedProduct.location}
                            </Tag>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-emerald-600 text-base">
                            {formatVND(selectedProduct.listPrice || selectedProduct.price)}
                          </span>
                          <span className="text-xs text-slate-500">/ {selectedProduct.unit || 'Cái'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Descriptions */}
                    <Descriptions column={2} bordered size="small" className="rounded-xl overflow-hidden">
                      <Descriptions.Item label={t('products.code')}>
                        <span className="font-mono font-bold text-indigo-700">{selectedProduct.defaultCode || selectedProduct.code || 'N/A'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="SKU">
                        <span className="font-mono font-bold text-slate-800">{selectedProduct.brandSku || 'N/A'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('brands.name')}>
                        <Tag color="cyan" className="font-bold">{selectedProduct.brand?.name || selectedProduct.brandName || 'N/A'}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('products.currentStock')}>
                        <Tag color={Number(selectedProduct.currentStock || selectedProduct.qtyOnHand || 0) > 0 ? 'green' : 'red'} className="font-bold">
                          {selectedProduct.currentStock ?? selectedProduct.qtyOnHand ?? selectedProduct.quantity ?? 0} {selectedProduct.unit || 'Cái'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('products.weight')}>
                        <span className="font-mono text-slate-700">{selectedProduct.weight || '0.000'} kg</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('products.volume')}>
                        <span className="font-mono text-slate-700">{selectedProduct.volume || '0.000'} m³</span>
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Description Text */}
                    {selectedProduct.description && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <BoxPlotOutlined className="text-indigo-600" /> {t('products.description')}:
                        </div>
                        <p className="text-xs text-slate-600 m-0 whitespace-pre-wrap leading-relaxed">
                          {parseDescription(selectedProduct.description, i18n.language)}
                        </p>
                      </div>
                    )}

                    {/* Supplier Info List */}
                    {Array.isArray(selectedProduct.supplierInfos) && selectedProduct.supplierInfos.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <ShopOutlined className="text-indigo-600" /> {t('products.supplierInfos')}:
                        </div>
                        <Table
                          dataSource={selectedProduct.supplierInfos}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          columns={[
                            { title: t('suppliers.name'), dataIndex: 'supplierName', key: 'supplierName', render: (n) => <span className="font-bold text-xs">{n}</span> },
                            { title: t('purchases.reference'), dataIndex: 'productCode', key: 'productCode', render: (c) => <span className="font-mono text-xs font-bold text-indigo-700">{c || 'N/A'}</span> },
                            { title: t('purchases.price'), dataIndex: 'price', key: 'price', align: 'right', render: (v) => <span className="font-mono text-xs text-emerald-600 font-bold">{formatVND(v)}</span> },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'substitutes',
                label: (
                  <span className="font-bold flex items-center gap-1.5">
                    <SwapOutlined /> {t('products.substitutes')} ({selectedProduct.substitutes?.length || 0})
                  </span>
                ),
                children: (
                  <div className="py-2">
                    <Table
                      dataSource={selectedProduct.substitutes || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        { title: t('products.name'), dataIndex: 'name', key: 'name', render: (n) => <span className="font-bold text-xs text-slate-900">{n}</span> },
                        { title: t('products.code'), dataIndex: 'defaultCode', key: 'defaultCode', render: (c) => <code className="font-mono text-xs font-bold text-indigo-700 bg-slate-100 px-1 rounded">{c}</code> },
                        { title: t('products.listPrice'), dataIndex: 'listPrice', key: 'listPrice', align: 'right', render: (v, r) => <span className="font-mono text-xs text-emerald-600 font-bold">{formatVND(v)} / {r.unit || 'Cái'}</span> },
                      ]}
                      locale={{
                        emptyText: (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <SwapOutlined className="text-2xl mb-1 text-slate-300 block" />
                            Chưa có mã phụ tùng thay thế tương đương
                          </div>
                        ),
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'documents',
                label: (
                  <span className="font-bold flex items-center gap-1.5">
                    <FilePdfOutlined /> {t('products.documents')} ({selectedProduct.documents?.length || 0})
                  </span>
                ),
                children: (
                  <div className="py-2 flex flex-col gap-3">
                    {Array.isArray(selectedProduct.documents) && selectedProduct.documents.length > 0 ? (
                      selectedProduct.documents.map((doc) => (
                        <div key={doc.id || doc.name} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FilePdfOutlined className="text-red-500 text-lg shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-slate-900 truncate">{doc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{doc.fileType?.toUpperCase() || 'PDF'}</span>
                            </div>
                          </div>
                          <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setActivePdfDoc(doc);
                              setPdfModalOpen(true);
                            }}
                            className="bg-indigo-600 text-xs font-bold border-0 shrink-0"
                          >
                            Xem PDF
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        <FilePdfOutlined className="text-2xl mb-1 text-slate-300 block" />
                        Chưa có bản vẽ hoặc tài liệu Catalog PDF đính kèm
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* PDF Document Viewer Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{activePdfDoc?.name || 'Xem Tài Liệu PDF'}</span>}
        open={pdfModalOpen}
        onCancel={() => setPdfModalOpen(false)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {activePdfDoc && (
          <div className="w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
            {activePdfDoc.fileUrl?.endsWith('.pdf') || activePdfDoc.fileType === 'pdf' ? (
              <iframe
                src={resolveUrl(activePdfDoc.fileUrl)}
                title={activePdfDoc.name}
                className="w-full h-full border-0"
              />
            ) : (
              <Image src={resolveUrl(activePdfDoc.fileUrl)} alt={activePdfDoc.name} className="max-h-[580px] object-contain" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage;
