import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Segmented, Avatar, Image, Tooltip, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, TagsOutlined, ReloadOutlined, BoxPlotOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { brandsApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const BrandsPage = () => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'HAS_PRODUCTS' | 'NO_PRODUCTS'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = async (p = 1, lim = 10, search = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await brandsApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setBrands(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('API brands fetch failed:', err);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands(1, 10, '');
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      if (editingBrand) {
        form.setFieldsValue({ name: editingBrand.name, logoUrl: editingBrand.logoUrl });
      } else {
        form.resetFields();
      }
    }
  }, [isModalOpen, editingBrand, form]);

  const handleOpenModal = (record = null) => {
    setEditingBrand(record);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingBrand) {
        await brandsApi.update(editingBrand.id, values);
        setBrands(brands.map((b) => (b.id === editingBrand.id ? { ...b, name: values.name, logoUrl: values.logoUrl } : b)));
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      } else {
        const res = await brandsApi.create(values);
        const createdData = res?.data || res;
        const newBrand = {
          id: createdData?.id || Date.now(),
          name: values.name,
          logoUrl: values.logoUrl,
          productCount: 0,
          products: [],
          createdAt: new Date().toISOString(),
          ...createdData,
        };
        setBrands([newBrand, ...brands]);
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save brand error:', err);
      if (editingBrand) {
        setBrands(brands.map((b) => (b.id === editingBrand.id ? { ...b, name: values.name, logoUrl: values.logoUrl } : b)));
      } else {
        setBrands([{ id: Date.now(), name: values.name, logoUrl: values.logoUrl, productCount: 0, products: [], createdAt: new Date().toISOString() }, ...brands]);
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
    const targetName = typeof record === 'object' ? record.name : '';
    try {
      await brandsApi.delete(targetId);
    } catch (err) {
      console.warn('Delete brand API error:', err);
    } finally {
      setBrands(brands.filter((b) => b.id !== targetId));
      notification.info({
        message: t('common.info'),
        description: targetName,
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const hasProductsCount = useMemo(() => {
    return brands.filter((b) => {
      const count = b.productCount ?? b.productsCount ?? (Array.isArray(b.products) ? b.products.length : 0);
      return count > 0;
    }).length;
  }, [brands]);

  const noProductsCount = useMemo(() => {
    return brands.length - hasProductsCount;
  }, [brands, hasProductsCount]);

  const filteredBrands = brands.filter((b) => {
    const count = b.productCount ?? b.productsCount ?? (Array.isArray(b.products) ? b.products.length : 0);
    const matchesSearch = (b.name || '').toLowerCase().includes(searchText.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'HAS_PRODUCTS') {
      matchesStatus = count > 0;
    } else if (filterStatus === 'NO_PRODUCTS') {
      matchesStatus = count === 0;
    }

    return matchesSearch && matchesStatus;
  });

  const expandedRowRender = (record) => {
    const products = Array.isArray(record.products) ? record.products : [];
    if (products.length === 0) {
      return (
        <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg">
          {t('common.noData')}
        </div>
      );
    }

    const subColumns = [
      {
        title: t('common.image'),
        dataIndex: 'imageUrl',
        key: 'imageUrl',
        width: 70,
        render: (imgUrl, pRecord) => {
          const src = resolveUrl(imgUrl);
          const initialLetter = (pRecord.name || 'P')[0].toUpperCase();

          if (!src) {
            return (
              <Avatar
                shape="square"
                size={36}
                className="bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-lg border border-indigo-100 shrink-0 flex items-center justify-center"
              >
                {initialLetter}
              </Avatar>
            );
          }
          return (
            <Image
              src={src}
              alt={pRecord.name}
              width={36}
              height={36}
              className="object-cover rounded-lg border border-slate-200 shadow-2xs"
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
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            {name}
          </span>
        ),
      },
      {
        title: t('products.code'),
        dataIndex: 'defaultCode',
        key: 'defaultCode',
        render: (code) => (
          <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
            {code || 'N/A'}
          </code>
        ),
      },
      {
        title: t('common.createdAt'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-[11px] text-slate-500 font-mono">{formatDate(date)}</span>
        ),
      },
    ];

    return (
      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 my-1">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
          <BoxPlotOutlined className="text-indigo-600" />
          <span>{record.name} ({products.length}):</span>
        </div>
        <Table
          columns={subColumns}
          dataSource={products}
          rowKey={(item) => item.id || item.name}
          pagination={false}
          size="small"
          className="bg-white rounded-lg shadow-2xs overflow-hidden"
        />
      </div>
    );
  };

  const columns = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      render: (id) => <span className="font-mono text-xs text-slate-500">#{id}</span>,
    },
    {
      title: t('brands.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => {
        const logoSrc = resolveUrl(record.logoUrl);
        const initialLetter = (name || 'B')[0].toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <Avatar
              src={logoSrc}
              size={32}
              className="border border-slate-200 bg-indigo-50 text-indigo-700 font-extrabold text-xs shrink-0 shadow-2xs flex items-center justify-center"
            >
              {initialLetter}
            </Avatar>
            <span className="font-bold text-slate-900 text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      title: t('products.title'),
      key: 'productCount',
      render: (_, record) => {
        const count = record.productCount ?? record.productsCount ?? (Array.isArray(record.products) ? record.products.length : 0);
        if (count > 0) {
          return (
            <Tag color="blue" className="font-bold">
              {count}
            </Tag>
          );
        }
        return <Tag color="default" className="font-semibold text-slate-400">0</Tag>;
      },
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-xs text-slate-600 font-mono font-medium">{formatDate(date)}</span>,
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
            title={t('brands.deleteConfirm')}
            onConfirm={() => handleDelete(record)}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger size="small" aria-label={t('common.delete')} icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
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
            <TagsOutlined className="text-indigo-600" /> {t('brands.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('brands.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={fetchBrands} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('brands.createNew')}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5">
          <Input
            placeholder={t('brands.searchPlaceholder')}
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="max-w-xs rounded-xl text-xs"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <FilterOutlined className="text-indigo-600" /> {t('common.filter')}:
            </span>
            <Segmented
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { label: `${t('common.all')} (${brands.length})`, value: 'ALL' },
                { label: `${t('common.active')} (${hasProductsCount})`, value: 'HAS_PRODUCTS' },
                { label: `${t('common.inactive')} (${noProductsCount})`, value: 'NO_PRODUCTS' },
              ]}
              className="bg-slate-100 p-0.5 rounded-xl font-semibold text-xs"
            />
          </div>
        </div>

        <Table
          size="middle"
          columns={columns}
          dataSource={filteredBrands}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (searchText || filterStatus !== 'ALL') ? (
              <div className="py-8 text-center">
                <SearchOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button size="small" onClick={() => { setSearchText(''); setFilterStatus('ALL'); }} className="text-xs mt-2">
                  {t('common.clear')}
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <TagsOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('brands.createNew')}
                </Button>
              </div>
            ),
          }}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => Array.isArray(record.products) && record.products.length > 0,
          }}
          pagination={{
            current: Number(pagination.page || 1),
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchBrands(p, l, searchText),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingBrand ? t('brands.editTitle') : t('brands.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item
            label={t('brands.name')}
            name="name"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="Sinotruk HOWO" size="large" />
          </Form.Item>

          <Form.Item label={t('brands.logo')} name="logoUrl">
            <ImageUploadInput resModel="brand" placeholder="/uploads/brands/..." />
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

export default BrandsPage;
