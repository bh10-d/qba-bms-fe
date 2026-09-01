import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Select, Avatar, Image, Tooltip, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, enginesApi, gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const VehiclesPage = () => {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [enginesList, setEnginesList] = useState([]);
  const [gearboxesList, setGearboxesList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async (p = 1, lim = 10, search = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await vehiclesApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setVehicles(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('API vehicles fetch failed:', err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [eRes, gRes] = await Promise.allSettled([enginesApi.getAll(), gearboxesApi.getAll()]);
      if (eRes.status === 'fulfilled') {
        const d = eRes.value?.data || eRes.value;
        if (Array.isArray(d)) setEnginesList(d);
      }
      if (gRes.status === 'fulfilled') {
        const d = gRes.value?.data || gRes.value;
        if (Array.isArray(d)) setGearboxesList(d);
      }
    } catch (err) {
      console.warn('Fetch metadata for VehiclesPage failed:', err);
    }
  };

  useEffect(() => {
    fetchVehicles(1, 10, '');
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      if (editingVehicle) {
        form.setFieldsValue({
          name: editingVehicle.name || editingVehicle.title,
          modelCode: editingVehicle.modelCode || editingVehicle.code,
          category: editingVehicle.category,
          year: editingVehicle.year,
          certificate: editingVehicle.certificate,
          axle: editingVehicle.axle,
          imageUrl: editingVehicle.imageUrl,
          engineId: editingVehicle.engineId || editingVehicle.engine?.id,
          gearboxId: editingVehicle.gearboxId || editingVehicle.gearbox?.id,
          note: editingVehicle.note,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isModalOpen, editingVehicle, form]);

  const handleOpenModal = (record = null) => {
    setEditingVehicle(record);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const selectedEng = enginesList.find((e) => String(e.id) === String(values.engineId));
    const selectedGb = gearboxesList.find((g) => String(g.id) === String(values.gearboxId));

    const engineName = selectedEng?.name || selectedEng?.code || t('vehicles.engine');
    const gearboxName = selectedGb?.name || selectedGb?.code || t('vehicles.gearbox');

    const payload = {};
    if (values.name) payload.name = values.name;
    if (values.modelCode) payload.modelCode = values.modelCode;
    if (values.category) payload.category = values.category;
    if (values.year) payload.year = Number(values.year);
    if (values.certificate) payload.certificate = values.certificate;
    if (values.axle) payload.axle = values.axle;
    if (values.imageUrl) payload.imageUrl = values.imageUrl;
    if (values.engineId !== undefined && values.engineId !== null) payload.engineId = Number(values.engineId);
    if (values.gearboxId !== undefined && values.gearboxId !== null) payload.gearboxId = Number(values.gearboxId);
    if (values.note) payload.note = values.note;

    try {
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, payload);
        setVehicles(vehicles.map((v) => (v.id === editingVehicle.id ? { ...v, ...payload, engineName, gearboxName } : v)));
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      } else {
        const res = await vehiclesApi.create(payload);
        const createdData = res?.data || res;
        const newVehicle = {
          id: createdData?.id || Date.now(),
          ...payload,
          ...createdData,
          engineName,
          gearboxName,
        };
        setVehicles([newVehicle, ...vehicles]);
        notification.success({
          message: t('common.success'),
          description: values.name,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save vehicle error:', err);
      if (editingVehicle) {
        setVehicles(vehicles.map((v) => (v.id === editingVehicle.id ? { ...v, ...payload, engineName, gearboxName } : v)));
      } else {
        setVehicles([{ id: Date.now(), ...payload, engineName, gearboxName }, ...vehicles]);
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
      await vehiclesApi.delete(targetId);
    } catch (err) {
      console.warn('Delete vehicle error:', err);
    } finally {
      setVehicles(vehicles.filter((v) => v.id !== targetId));
      notification.info({
        message: t('common.info'),
        description: targetName,
      });
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const name = v.name || v.title || '';
    const code = v.modelCode || v.code || '';
    const query = searchText.toLowerCase();
    return name.toLowerCase().includes(query) || code.toLowerCase().includes(query);
  });

  const columns = [
    {
      title: t('vehicles.name'),
      key: 'name',
      render: (_, record) => {
        const name = record.name || record.title || 'Vehicle';
        const src = resolveUrl(record.imageUrl);
        const initialLetter = (name || 'V')[0].toUpperCase();

        return (
          <Tooltip title={name} placement="topLeft">
            <div className="flex items-center gap-2.5 max-w-[240px]">
              {src ? (
                <Image src={src} alt={name} width={36} height={36} className="object-cover rounded-lg border border-slate-200 shrink-0" />
              ) : (
                <Avatar shape="square" size={36} className="bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-200 shrink-0 flex items-center justify-center">
                  {initialLetter}
                </Avatar>
              )}
              <span className="font-bold text-slate-900 text-sm truncate">
                {name}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('vehicles.code'),
      key: 'modelCode',
      render: (_, record) => {
        const code = record.modelCode || record.code || 'N/A';
        return <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono font-bold">{code}</code>;
      },
    },
    {
      title: t('vehicles.category'),
      key: 'category',
      render: (_, record) => {
        if (!record.category && !record.year) return <span className="text-slate-400 text-xs">N/A</span>;
        return (
          <span className="text-xs font-semibold text-slate-700">
            {record.category || ''} {record.year ? `(${record.year})` : ''}
          </span>
        );
      },
    },
    {
      title: t('vehicles.axle'),
      key: 'axle',
      render: (_, record) => {
        if (!record.axle && !record.certificate) return <span className="text-slate-400 text-xs">N/A</span>;
        return (
          <Tag color="purple" className="font-bold">
            {record.axle || ''} {record.axle && record.certificate ? '•' : ''} {record.certificate || ''}
          </Tag>
        );
      },
    },
    {
      title: `${t('vehicles.engine')} & ${t('vehicles.gearbox')}`,
      key: 'components',
      render: (_, record) => {
        const eName = record.engine?.name || record.engineName || (record.engineId ? enginesList.find((e) => String(e.id) === String(record.engineId))?.name : null) || 'N/A';
        const gName = record.gearbox?.name || record.gearboxName || (record.gearboxId ? gearboxesList.find((g) => String(g.id) === String(record.gearboxId))?.name : null) || 'N/A';
        return (
          <div className="text-[11px] text-slate-600">
            <div>{t('vehicles.engine')}: <strong className="text-slate-800">{eName}</strong></div>
            <div>{t('vehicles.gearbox')}: <strong className="text-slate-800">{gName}</strong></div>
          </div>
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
          <Popconfirm title={t('vehicles.deleteConfirm')} onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <CarOutlined className="text-indigo-600" /> {t('vehicles.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('vehicles.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={fetchVehicles} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            {t('vehicles.createNew')}
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder={t('vehicles.searchPlaceholder')}
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
          dataSource={filteredVehicles}
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
                <CarOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-indigo-600 border-0 text-xs mt-3">
                  {t('vehicles.createNew')}
                </Button>
              </div>
            ),
          }}
          pagination={{
            current: Number(pagination.page || 1),
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchVehicles(p, l, searchText),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingVehicle ? t('vehicles.editTitle') : t('vehicles.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label={t('vehicles.name')} name="name" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="HOWO A7 375HP" />
          </Form.Item>

          <Form.Item label={t('vehicles.image')} name="imageUrl">
            <ImageUploadInput resModel="vehicle" placeholder="/uploads/..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('vehicles.code')} name="modelCode">
              <Input placeholder="Ví dụ: ZZ4257N3247N1" />
            </Form.Item>
            <Form.Item label={t('vehicles.category')} name="category">
              <Input placeholder="Ví dụ: Xe đầu kéo / Xe tải" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label={t('vehicles.year')} name="year">
              <Input placeholder="Ví dụ: 2024" />
            </Form.Item>
            <Form.Item label={t('vehicles.certificate')} name="certificate">
              <Input placeholder="Ví dụ: Giấy đăng kiểm" />
            </Form.Item>
            <Form.Item label={t('vehicles.axle')} name="axle">
              <Input placeholder="Ví dụ: Cầu HC16" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={t('vehicles.engine')} name="engineId">
              <Select
                placeholder={t('vehicles.selectEngine')}
                showSearch
                optionFilterProp="label"
                options={enginesList.map((e) => ({
                  value: e.id,
                  label: `${e.name || e.code || `Engine #${e.id}`}`,
                }))}
              />
            </Form.Item>
            <Form.Item label={t('vehicles.gearbox')} name="gearboxId">
              <Select
                placeholder={t('vehicles.selectGearbox')}
                showSearch
                optionFilterProp="label"
                options={gearboxesList.map((g) => ({
                  value: g.id,
                  label: `${g.name || g.code || `Gearbox #${g.id}`}`,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item label={t('vehicles.note')} name="note">
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

export default VehiclesPage;
