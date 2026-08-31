import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, InputNumber, Select, Avatar, Image, Tooltip, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ShopOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { supplierInfoApi, productsApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const IsolatedSearchBar = React.memo(({ onSearch }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const handleTriggerSearch = () => {
    onSearch(value);
  };

  return (
    <div className="mb-4 flex items-center gap-3 max-w-md">
      <Input
        placeholder={t('suppliers.searchPlaceholder')}
        prefix={<SearchOutlined className="text-slate-400" />}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleTriggerSearch}
        onClear={() => onSearch('')}
        allowClear
        className="rounded-xl text-xs flex-1"
      />
      <Button onClick={handleTriggerSearch} type="primary" className="bg-indigo-600 font-bold text-xs border-0">
        {t('common.search')}
      </Button>
    </div>
  );
});

const SupplierInfoPage = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [currentSearch, setCurrentSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;

      const res = await supplierInfoApi.getAll(params);
      const rawData = res?.data || res;

      const itemsList = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.items) ? rawData.items : []));

      const totalCount = rawData?.total ?? rawData?.totalCount ?? itemsList.length;

      setSuppliers(itemsList);
      setPagination({ page, limit, total: totalCount });
    } catch (err) {
      console.warn('API supplier-info fetch failed:', err);
      setSuppliers([]);
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
      console.warn('API products fetch failed in SupplierInfoPage:', err);
      setProductsList([]);
    }
  };

  useEffect(() => {
    fetchSuppliers(1, 10, '');
    fetchProducts();
  }, [fetchSuppliers]);

  const productOptions = useMemo(() => {
    return productsList.map((p) => ({
      value: p.id,
      label: `${p.name || p.title || 'Product'} (${p.defaultCode || p.code || p.sku || `ID #${p.id}`})`,
    }));
  }, [productsList]);

  const handleOpenModal = useCallback((record = null) => {
    setEditingSupplier(record);
    setIsModalOpen(true);
    setTimeout(() => {
      if (record) {
        form.setFieldsValue({
          productId: record.productId || record.product?.id,
          supplierName: record.supplierName || record.name,
          productCode: record.productCode || record.supplierProductCode || record.code,
          price: record.price ?? record.unitPrice ?? record.costPrice,
          minQty: record.minQty ?? record.minQuantity ?? record.minimumQuantity,
          imageUrl: record.imageUrl || record.logoUrl,
        });
      } else {
        form.resetFields();
      }
    }, 0);
  }, [form]);

  const handleSave = async (values) => {
    setSubmitting(true);
    const selectedProd = productsList.find((p) => String(p.id) === String(values.productId));
    const prodName = selectedProd?.name || selectedProd?.title || 'Product';

    const payload = {};
    if (values.productId !== undefined && values.productId !== null) payload.productId = Number(values.productId);
    if (values.supplierName) payload.supplierName = values.supplierName;
    if (values.productCode) payload.productCode = values.productCode;
    if (values.price !== undefined && values.price !== null) payload.price = Number(values.price);
    if (values.minQty !== undefined && values.minQty !== null) payload.minQty = Number(values.minQty);
    if (values.imageUrl) payload.imageUrl = values.imageUrl;

    try {
      if (editingSupplier) {
        await supplierInfoApi.update(editingSupplier.id, payload);
        setSuppliers(suppliers.map((s) => (s.id === editingSupplier.id ? { ...s, ...payload, productName: prodName } : s)));
        notification.success({
          message: t('common.success'),
          description: values.supplierName,
        });
      } else {
        const res = await supplierInfoApi.create(payload);
        const createdData = res?.data || res;
        const newSupplier = {
          id: createdData?.id || Date.now(),
          ...payload,
          ...createdData,
          productName: prodName,
        };
        setSuppliers([newSupplier, ...suppliers]);
        notification.success({
          message: t('common.success'),
          description: values.supplierName,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save supplier API error details:', err);
      notification.error({
        message: t('common.error'),
        description: t('common.error'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? (record.supplierName || record.name) : '';
    try {
      await supplierInfoApi.delete(targetId);
    } catch (err) {
      console.warn('Delete supplier error:', err);
    } finally {
      setSuppliers((prev) => prev.filter((s) => s.id !== targetId));
      notification.info({
        message: t('common.info'),
        description: targetName,
      });
    }
  }, [t]);

  const handleSearchTrigger = useCallback((text) => {
    setCurrentSearch(text);
    fetchSuppliers(1, pagination.limit, text);
  }, [fetchSuppliers, pagination.limit]);

  const columns = useMemo(() => [
    {
      title: t('suppliers.name'),
      key: 'supplierName',
      render: (_, record) => {
        const name = record.supplierName || record.name || record.supplier?.name || 'Supplier';
        const src = resolveUrl(record.logoUrl || record.imageUrl);
        const initialLetter = (name || 'S')[0].toUpperCase();

        return (
          <Tooltip title={name} placement="topLeft">
            <div className="flex items-center gap-2.5 max-w-[220px]">
              <Avatar
                src={src}
                size={32}
                className="border border-slate-200 bg-emerald-50 text-emerald-700 font-extrabold text-xs shrink-0 shadow-2xs flex items-center justify-center"
              >
                {initialLetter}
              </Avatar>
              <span className="font-bold text-slate-900 text-sm truncate">
                {name}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('products.title'),
      key: 'product',
      render: (_, record) => {
        const prodName = record.product?.name || record.productName || (record.productId ? `#${record.productId}` : 'N/A');
        const prodCode = record.productCode || record.supplierProductCode || record.code || record.product?.code || 'N/A';
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-800">{prodName}</span>
            <div className="text-[11px] text-slate-500 font-mono">{t('suppliers.code')}: {prodCode}</div>
          </div>
        );
      },
    },
    {
      title: t('products.costPrice'),
      key: 'price',
      render: (_, record) => {
        const price = record.price ?? record.unitPrice ?? record.costPrice ?? 0;
        return (
          <span className="font-bold text-emerald-600 text-sm flex items-center gap-1 font-mono">
            <DollarOutlined /> {Number(price).toLocaleString()} đ
          </span>
        );
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" aria-label={t('common.edit')} icon={<EditOutlined className="text-indigo-600" />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm title={t('suppliers.deleteConfirm')} onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger size="small" aria-label={t('common.delete')} icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleOpenModal, handleDelete, t]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ShopOutlined className="text-emerald-600" /> {t('suppliers.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('suppliers.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={() => fetchSuppliers(pagination.page, pagination.limit, currentSearch)} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('suppliers.createNew')}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <IsolatedSearchBar onSearch={handleSearchTrigger} />

        <Table
          size="middle"
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: currentSearch ? (
              <div className="py-8 text-center">
                <SearchOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button size="small" onClick={() => handleSearchTrigger('')} className="text-xs mt-2">{t('common.clear')}</Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <ShopOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('suppliers.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchSuppliers(p, l, currentSearch),
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingSupplier ? t('suppliers.editTitle') : t('suppliers.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label={t('products.title')} name="productId" rules={[{ required: true, message: t('common.required') }]}>
            <Select
              placeholder={t('common.select')}
              showSearch
              optionFilterProp="label"
              options={productOptions}
            />
          </Form.Item>

          <Form.Item label={t('suppliers.name')} name="supplierName" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="Supplier Name" />
          </Form.Item>

          <Form.Item label={t('common.image')} name="imageUrl">
            <ImageUploadInput resModel="supplier" placeholder="/uploads/..." />
          </Form.Item>

          <Form.Item label={t('suppliers.code')} name="productCode" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="SUP-CODE-123" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('products.costPrice')} name="price" rules={[{ required: true, message: t('common.required') }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={50000}
                suffix="VND"
                placeholder="Price..."
              />
            </Form.Item>
            <Form.Item label={t('inventory.quantity')} name="minQty">
              <InputNumber style={{ width: '100%' }} min={1} placeholder="Min Qty" />
            </Form.Item>
          </div>

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

export default SupplierInfoPage;
