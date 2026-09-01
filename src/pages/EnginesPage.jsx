import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Select, Avatar, Image, Tooltip, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { enginesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const EnginesPage = () => {
  const { t } = useTranslation();
  const [engines, setEngines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchEngines = async (p = 1, lim = 10, search = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await enginesApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setEngines(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('API engines fetch failed:', err);
      setEngines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngines(1, 10, '');
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      if (editingEngine) {
        form.setFieldsValue({
          name: editingEngine.name || editingEngine.title,
          code: editingEngine.code,
          capacity: editingEngine.capacity,
          power: editingEngine.power,
          description: editingEngine.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isModalOpen, editingEngine, form]);

  const handleOpenModal = (record = null) => {
    setEditingEngine(record);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingEngine) {
        await enginesApi.update(editingEngine.id, values);
        setEngines(engines.map((e) => (e.id === editingEngine.id ? { ...e, ...values } : e)));
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      } else {
        const res = await enginesApi.create(values);
        const newEngine = res?.data || { id: Date.now(), ...values };
        setEngines([newEngine, ...engines]);
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save engine error:', err);
      if (editingEngine) {
        setEngines(engines.map((e) => (e.id === editingEngine.id ? { ...e, ...values } : e)));
      } else {
        setEngines([{ id: Date.now(), ...values }, ...engines]);
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
      await enginesApi.delete(targetId);
    } catch (err) {
      console.warn('Delete engine error:', err);
    } finally {
      setEngines(engines.filter((e) => e.id !== targetId));
      notification.info({
        message: t('common.info'),
        description: targetName,
      });
    }
  };

  const filteredEngines = engines.filter(
    (e) =>
      (e.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (e.brand && e.brand.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: t('engines.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const src = resolveUrl(record.imageUrl);
        const initialLetter = (text || 'E')[0].toUpperCase();
        return (
          <Tooltip title={text} placement="topLeft">
            <div className="flex items-center gap-2.5 max-w-[220px]">
              {src ? (
                <Image src={src} alt={text} width={36} height={36} className="object-cover rounded-lg border border-slate-200 shrink-0" />
              ) : (
                <Avatar shape="square" size={36} className="bg-amber-50 text-amber-700 font-extrabold text-xs rounded-lg border border-amber-200 shrink-0 flex items-center justify-center">
                  {initialLetter}
                </Avatar>
              )}
              <span className="font-bold text-slate-900 text-sm truncate">
                {text}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('brands.name'),
      dataIndex: 'brand',
      key: 'brand',
      render: (brand, record) => {
        const b = brand || record.brandName;
        return b ? <Tag color="blue" className="font-semibold">{b}</Tag> : <span className="text-slate-400 text-xs">N/A</span>;
      },
    },
    {
      title: t('engines.power'),
      key: 'power',
      render: (_, record) => {
        const p = record.power || record.horsepower;
        const c = record.capacity;
        if (!p && !c) return <span className="text-slate-400 text-xs">N/A</span>;
        return (
          <span className="text-xs font-semibold text-slate-700">
            {p ? `${p} HP` : ''} {p && c ? '•' : ''} {c || ''}
          </span>
        );
      },
    },
    {
      title: t('engines.fuel'),
      dataIndex: 'emissionStandard',
      key: 'emissionStandard',
      render: (std, record) => {
        const text = std || record.description || record.fuel;
        return text ? <Tag color="green" className="font-bold">{text}</Tag> : <span className="text-slate-400 text-xs">N/A</span>;
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
          <Popconfirm title={t('engines.deleteConfirm')} onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <ThunderboltOutlined className="text-amber-500" /> {t('engines.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('engines.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={fetchEngines} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('engines.createNew')}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder={t('engines.searchPlaceholder')}
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
          dataSource={filteredEngines}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: searchText ? (
              <div className="py-8 text-center">
                <SearchOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button size="small" onClick={() => setSearchText('')} className="text-xs mt-2">{t('common.clear')}</Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <ThunderboltOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('engines.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: Number(pagination.page || 1),
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchEngines(p, l, searchText),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingEngine ? t('engines.editTitle') : t('engines.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('engines.name')} name="name" rules={[{ required: true, message: t('common.required') }]}>
              <Input placeholder="WP10.380E53" />
            </Form.Item>
            <Form.Item label={t('brands.name')} name="brand">
              <Input placeholder="Weichai" />
            </Form.Item>
          </div>

          <Form.Item label={t('common.image')} name="imageUrl">
            <ImageUploadInput resModel="engine" placeholder="/uploads/..." />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label={t('engines.capacity')} name="capacity">
              <Input placeholder="9.726L" />
            </Form.Item>
            <Form.Item label={t('engines.power')} name="horsepower">
              <Input placeholder="380 HP" />
            </Form.Item>
            <Form.Item label={t('engines.fuel')} name="torque">
              <Input placeholder="1600 N.m" />
            </Form.Item>
          </div>

          <Form.Item label={t('engines.description')} name="note">
            <Input.TextArea rows={2} placeholder="..." />
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

export default EnginesPage;
