import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Select, Avatar, Image, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CarOutlined, ReloadOutlined } from '@ant-design/icons';
import { vehiclesApi, enginesApi, gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [enginesList, setEnginesList] = useState([]);
  const [gearboxesList, setGearboxesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehiclesApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        setVehicles([]);
      }
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
    fetchVehicles();
    fetchMetadata();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingVehicle(record);
    if (record) {
      form.setFieldsValue({
        name: record.name || record.title,
        modelCode: record.modelCode || record.code,
        category: record.category,
        year: record.year,
        certificate: record.certificate,
        axle: record.axle,
        imageUrl: record.imageUrl,
        engineId: record.engineId || record.engine?.id,
        gearboxId: record.gearboxId || record.gearbox?.id,
        note: record.note,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const selectedEng = enginesList.find((e) => String(e.id) === String(values.engineId));
    const selectedGb = gearboxesList.find((g) => String(g.id) === String(values.gearboxId));

    const engineName = selectedEng?.name || selectedEng?.code || 'Động cơ';
    const gearboxName = selectedGb?.name || selectedGb?.code || 'Hộp số';

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
          message: 'Cập nhật dòng xe thành công',
          description: `Đã cập nhật thông tin dòng xe "${values.name}".`,
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
          message: 'Thêm dòng xe mới thành công',
          description: `Đã thêm xe "${values.name}" vào danh mục dòng xe.`,
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
        message: 'Đã lưu thông tin xe',
        description: `Đã lưu xe "${values.name}".`,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? (record.name || record.title) : 'dòng xe';
    try {
      await vehiclesApi.delete(targetId);
    } catch (err) {
      console.warn('Delete vehicle error:', err);
    } finally {
      setVehicles(vehicles.filter((v) => v.id !== targetId));
      notification.info({
        message: 'Xóa dòng xe thành công',
        description: `Đã xóa "${targetName}" khỏi danh mục dòng xe.`,
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
      title: 'Tên Xe',
      key: 'name',
      render: (_, record) => {
        const name = record.name || record.title || 'Dòng xe';
        const src = resolveUrl(record.imageUrl);
        const initialLetter = (name || 'V')[0].toUpperCase();

        return (
          <div className="flex items-center gap-2.5">
            {src ? (
              <Image src={src} alt={name} width={36} height={36} className="object-cover rounded-lg border border-slate-200" />
            ) : (
              <Avatar shape="square" size={36} className="bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-200 shrink-0 flex items-center justify-center">
                {initialLetter}
              </Avatar>
            )}
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              {name}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Mã Model',
      key: 'modelCode',
      render: (_, record) => {
        const code = record.modelCode || record.code || 'N/A';
        return <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono">{code}</code>;
      },
    },
    {
      title: 'Chủng Loại & Năm',
      key: 'category',
      render: (_, record) => (
        <span className="text-xs font-semibold text-slate-700">
          {record.category || 'Xe'} ({record.year || '2022'})
        </span>
      ),
    },
    {
      title: 'Cầu Xe & Đặc Chủng',
      key: 'axle',
      render: (_, record) => (
        <Tag color="purple" className="font-bold">
          {record.axle || 'Cầu xe'} • {record.certificate || 'Đặc chủng'}
        </Tag>
      ),
    },
    {
      title: 'Động Cơ & Hộp Số',
      key: 'components',
      render: (_, record) => {
        const eName = record.engine?.name || record.engineName || (record.engineId ? enginesList.find((e) => String(e.id) === String(record.engineId))?.name : null) || 'Chưa chọn';
        const gName = record.gearbox?.name || record.gearboxName || (record.gearboxId ? gearboxesList.find((g) => String(g.id) === String(record.gearboxId))?.name : null) || 'Chưa chọn';
        return (
          <div className="text-[11px] text-slate-600">
            <div>Động cơ: <strong className="text-slate-800">{eName}</strong></div>
            <div>Hộp số: <strong className="text-slate-800">{gName}</strong></div>
          </div>
        );
      },
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined className="text-indigo-600" />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa xe này?" onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
            <Button type="text" danger icon={<DeleteOutlined />} />
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
            <CarOutlined className="text-indigo-600" /> Quản Lý Dòng Xe
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Danh mục xe đầu kéo, xe ben, xe tải thùng và trang bị Động cơ / Hộp số
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchVehicles} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Xe Mới
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Tìm kiếm xe..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="rounded-xl"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredVehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} xe`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingVehicle ? 'Cập Nhật Thông Tin Xe' : 'Thêm Xe Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Tên Xe" name="name" rules={[{ required: true, message: 'Nhập tên xe!' }]}>
            <Input placeholder="HOWO A7 375HP Cầu Dầu" />
          </Form.Item>

          <Form.Item label="Hình Ảnh Dòng Xe" name="imageUrl">
            <ImageUploadInput resModel="vehicle" placeholder="/api/v1/attachments/... hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Mã Model" name="modelCode">
              <Input placeholder="ZZ4257N3247N1" />
            </Form.Item>
            <Form.Item label="Chủng Loại Xe" name="category">
              <Input placeholder="Xe Đầu Kéo" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label="Năm Sản Xuất" name="year">
              <Input placeholder="2022" />
            </Form.Item>
            <Form.Item label="Đặc Chủng" name="certificate">
              <Input placeholder="Cầu Dầu" />
            </Form.Item>
            <Form.Item label="Cầu Xe (Axle)" name="axle">
              <Input placeholder="HC16" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Động Cơ Trang Bị" name="engineId">
              <Select
                placeholder="Chọn động cơ..."
                showSearch
                optionFilterProp="label"
                options={enginesList.map((e) => ({
                  value: e.id,
                  label: `${e.name || e.code || `Động cơ #${e.id}`}`,
                }))}
              />
            </Form.Item>
            <Form.Item label="Hộp Số Trang Bị" name="gearboxId">
              <Select
                placeholder="Chọn hộp số..."
                showSearch
                optionFilterProp="label"
                options={gearboxesList.map((g) => ({
                  value: g.id,
                  label: `${g.name || g.code || `Hộp số #${g.id}`}`,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item label="Ghi Chú" name="note">
            <Input.TextArea rows={2} placeholder="Lốp 12.00R20, mâm xoay JOST 50#..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Thông Tin Xe
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VehiclesPage;
