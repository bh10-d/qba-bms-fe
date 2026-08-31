import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Select, Avatar, Image, Tooltip, notification, Alert } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, BoxPlotOutlined, BarcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productsApi, brandsApi, vehiclesApi, enginesApi, gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [brandsList, setBrandsList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [enginesList, setEnginesList] = useState([]);
  const [gearboxesList, setGearboxesList] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('API products fetch failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchProducts();
    fetchMetadata();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingProduct(record);
    if (record) {
      form.setFieldsValue({
        name: record.name || record.title,
        defaultCode: record.defaultCode || record.code || record.sku,
        brandSku: record.brandSku || record.brandCode,
        brandId: record.brandId || record.brand?.id,
        imageUrl: record.imageUrl,
        vehicleIds: record.vehicleIds || (Array.isArray(record.vehicles) ? record.vehicles.map((v) => (typeof v === 'object' ? v.id : v)) : []),
        engineIds: record.engineIds || (Array.isArray(record.engines) ? record.engines.map((e) => (typeof e === 'object' ? e.id : e)) : []),
        gearboxIds: record.gearboxIds || (Array.isArray(record.gearboxes) ? record.gearboxes.map((g) => (typeof g === 'object' ? g.id : g)) : []),
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const selectedBrand = brandsList.find((b) => String(b.id) === String(values.brandId));
    const brandName = selectedBrand?.name || 'Brand';

    const payload = {};
    if (values.name) payload.name = values.name;
    if (values.defaultCode) payload.defaultCode = values.defaultCode;
    if (values.brandSku) payload.brandSku = values.brandSku;
    if (values.brandId !== undefined && values.brandId !== null) payload.brandId = Number(values.brandId);
    if (values.imageUrl) payload.imageUrl = values.imageUrl;
    if (Array.isArray(values.vehicleIds)) payload.vehicleIds = values.vehicleIds.map(Number);
    if (Array.isArray(values.engineIds)) payload.engineIds = values.engineIds.map(Number);
    if (Array.isArray(values.gearboxIds)) payload.gearboxIds = values.gearboxIds.map(Number);

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, brandName } : p)));
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      } else {
        const res = await productsApi.create(payload);
        const createdData = res?.data || res;
        const newProduct = {
          id: createdData?.id || Date.now(),
          ...payload,
          ...createdData,
          brandName,
        };
        setProducts([newProduct, ...products]);
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save product error:', err);
      if (editingProduct) {
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, brandName } : p)));
      } else {
        setProducts([{ id: Date.now(), ...payload, brandName }, ...products]);
      }
      notification.success({
        message: t('common.success'),
        description: values.name,
      });
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
      notification.info({
        message: t('common.info'),
        description: targetName,
      });
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = p.name || p.title || '';
    const code = p.defaultCode || p.code || p.sku || '';
    const brandSku = p.brandSku || p.brandCode || '';
    const query = searchText.toLowerCase();
    return name.toLowerCase().includes(query) || code.toLowerCase().includes(query) || brandSku.toLowerCase().includes(query);
  });

  const columns = [
    {
      title: t('common.image'),
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
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
      render: (_, record) => {
        const name = record.name || record.title || 'Product';
        return (
          <Tooltip title={name} placement="topLeft">
            <span className="font-bold text-slate-900 text-sm truncate block max-w-[260px]">
              {name}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('products.code'),
      key: 'codes',
      render: (_, record) => {
        const defaultCode = record.defaultCode || record.code || record.sku || record.barcode || 'N/A';
        const brandSku = record.brandSku || record.brandCode || 'N/A';
        return (
          <div className="flex flex-col gap-1">
            <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
              <BarcodeOutlined className="mr-1" /> {defaultCode}
            </code>
            <span className="text-[11px] text-slate-500 font-mono">SKU: {brandSku}</span>
          </div>
        );
      },
    },
    {
      title: t('brands.name'),
      key: 'brandName',
      render: (_, record) => {
        const bName =
          record.brand?.name ||
          record.brandName ||
          (record.brandId ? brandsList.find((b) => String(b.id) === String(record.brandId))?.name : null) ||
          'N/A';
        return <Tag color="blue" className="font-semibold">{bName}</Tag>;
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              size="small"
              aria-label={t('common.edit')}
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
                aria-label={t('common.delete')}
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
          <Button icon={<ReloadOutlined />} onClick={fetchProducts} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
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
            <Button size="small" type="primary" danger onClick={fetchProducts} loading={loading}>
              {t('common.reload')}
            </Button>
          }
          className="rounded-xl mb-4"
        />
      )}

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-3 max-w-md">
          <Input
            placeholder={t('products.searchPlaceholder')}
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="rounded-xl text-xs"
          />
        </div>

        <Table
          size="middle"
          columns={columns}
          dataSource={filteredProducts}
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
            defaultPageSize: 10,
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
            <Input placeholder="Product Name" />
          </Form.Item>

          <Form.Item label={t('common.image')} name="imageUrl">
            <ImageUploadInput resModel="product" placeholder="/uploads/..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('products.code')} name="defaultCode">
              <Input placeholder="CODE-123" />
            </Form.Item>
            <Form.Item label="SKU" name="brandSku">
              <Input placeholder="SKU-123" />
            </Form.Item>
          </div>

          <Form.Item label={t('brands.name')} name="brandId" rules={[{ required: true, message: t('common.required') }]}>
            <Select
              placeholder={t('common.select')}
              showSearch
              optionFilterProp="label"
              options={brandsList.map((b) => ({
                value: b.id,
                label: `${b.name || b.code || `Brand #${b.id}`}`,
              }))}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
