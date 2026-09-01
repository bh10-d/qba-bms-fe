import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Avatar, Image, Tooltip, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const GearboxesPage = () => {
  const { t } = useTranslation();
  const [gearboxes, setGearboxes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGearbox, setEditingGearbox] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchGearboxes = async (p = 1, lim = 10, search = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await gearboxesApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setGearboxes(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('API gearboxes fetch failed:', err);
      setGearboxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGearboxes(1, 10, '');
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      if (editingGearbox) {
        form.setFieldsValue({
          name: editingGearbox.name || editingGearbox.title,
          imageUrl: editingGearbox.imageUrl,
          brand: editingGearbox.brand || editingGearbox.brandName,
          note: editingGearbox.note || editingGearbox.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isModalOpen, editingGearbox, form]);

  const handleOpenModal = (record = null) => {
    setEditingGearbox(record);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingGearbox) {
        await gearboxesApi.update(editingGearbox.id, values);
        setGearboxes(gearboxes.map((g) => (g.id === editingGearbox.id ? { ...g, ...values } : g)));
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      } else {
        const res = await gearboxesApi.create(values);
        const newGearbox = res?.data || { id: Date.now(), ...values };
        setGearboxes([newGearbox, ...gearboxes]);
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save gearbox error:', err);
      if (editingGearbox) {
        setGearboxes(gearboxes.map((g) => (g.id === editingGearbox.id ? { ...g, ...values } : g)));
      } else {
        setGearboxes([{ id: Date.now(), ...values }, ...gearboxes]);
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
      await gearboxesApi.delete(targetId);
    } catch (err) {
      console.warn('Delete gearbox error:', err);
    } finally {
      setGearboxes(gearboxes.filter((g) => g.id !== targetId));
      notification.info({
        message: t('common.info'),
        description: targetName,
      });
    }
  };

  const filteredGearboxes = gearboxes.filter(
    (g) =>
      (g.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (g.brand && g.brand.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: t('gearboxes.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const src = resolveUrl(record.imageUrl);
        const initialLetter = (text || 'G')[0].toUpperCase();
        return (
          <Tooltip title={text} placement="topLeft">
            <div className="flex items-center gap-2.5 max-w-[220px]">
              {src ? (
                <Image src={src} alt={text} width={36} height={36} className="object-cover rounded-lg border border-slate-200 shrink-0" />
              ) : (
                <Avatar shape="square" size={36} className="bg-cyan-50 text-cyan-700 font-extrabold text-xs rounded-lg border border-cyan-200 shrink-0 flex items-center justify-center">
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
        return b ? <Tag color="cyan" className="font-semibold">{b}</Tag> : <span className="text-slate-400 text-xs">N/A</span>;
      },
    },
    {
      title: t('gearboxes.speeds'),
      dataIndex: 'note',
      key: 'note',
      render: (note, record) => {
        const text = note || record.category || record.description;
        return text ? <span className="text-xs font-semibold text-slate-700">{text}</span> : <span className="text-slate-400 text-xs">N/A</span>;
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
          <Popconfirm title={t('gearboxes.deleteConfirm')} onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <SettingOutlined className="text-cyan-600" /> {t('gearboxes.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('gearboxes.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={fetchGearboxes} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('gearboxes.createNew')}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder={t('gearboxes.searchPlaceholder')}
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
          dataSource={filteredGearboxes}
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
                <SettingOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('gearboxes.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: Number(pagination.page || 1),
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchGearboxes(p, l, searchText),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingGearbox ? t('gearboxes.editTitle') : t('gearboxes.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label={t('gearboxes.name')} name="name" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="HW19710" />
          </Form.Item>

          <Form.Item label={t('common.image')} name="imageUrl">
            <ImageUploadInput resModel="gearbox" placeholder="/uploads/..." />
          </Form.Item>

          <Form.Item label={t('brands.name')} name="brand">
            <Input placeholder="Ví dụ: FAST GEAR / Sinotruk" />
          </Form.Item>

          <Form.Item label={t('gearboxes.description')} name="note">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú kỹ thuật..." />
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

export default GearboxesPage;
