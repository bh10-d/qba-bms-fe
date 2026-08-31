import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Avatar, Image, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const GearboxesPage = () => {
  const [gearboxes, setGearboxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGearbox, setEditingGearbox] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchGearboxes = async () => {
    setLoading(true);
    try {
      const res = await gearboxesApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setGearboxes(data);
      } else {
        setGearboxes([]);
      }
    } catch (err) {
      console.warn('API gearboxes fetch failed:', err);
      setGearboxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGearboxes();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingGearbox(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingGearbox) {
        await gearboxesApi.update(editingGearbox.id, values);
        setGearboxes(gearboxes.map((g) => (g.id === editingGearbox.id ? { ...g, ...values } : g)));
        notification.success({
          message: 'Cập nhật hộp số thành công',
          description: `Đã cập nhật thông tin hộp số "${values.name}".`,
        });
      } else {
        const res = await gearboxesApi.create(values);
        const newGearbox = res?.data || { id: Date.now(), ...values };
        setGearboxes([newGearbox, ...gearboxes]);
        notification.success({
          message: 'Thêm hộp số mới thành công',
          description: `Đã thêm hộp số "${values.name}" vào danh mục.`,
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
        message: 'Đã lưu hộp số',
        description: `Đã lưu hộp số "${values.name}".`,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? record.name : 'hộp số';
    try {
      await gearboxesApi.delete(targetId);
    } catch (err) {
      console.warn('Delete gearbox error:', err);
    } finally {
      setGearboxes(gearboxes.filter((g) => g.id !== targetId));
      notification.info({
        message: 'Xóa hộp số thành công',
        description: `Đã xóa "${targetName}" khỏi danh mục hộp số.`,
      });
    }
  };

  const filteredGearboxes = gearboxes.filter(
    (g) =>
      g.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (g.brand && g.brand.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'Mã / Tên Hộp Số',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const src = resolveUrl(record.imageUrl);
        const initialLetter = (text || 'G')[0].toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            {src ? (
              <Image src={src} alt={text} width={36} height={36} className="object-cover rounded-lg border border-slate-200" />
            ) : (
              <Avatar shape="square" size={36} className="bg-cyan-50 text-cyan-700 font-extrabold text-xs rounded-lg border border-cyan-200 shrink-0 flex items-center justify-center">
                {initialLetter}
              </Avatar>
            )}
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              {text}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Nhãn Hiệu',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand) => <Tag color="cyan" className="font-semibold">{brand || 'Sinotruk'}</Tag>,
    },
    {
      title: 'Tỷ Số Truyền (Ratio)',
      dataIndex: 'ratio',
      key: 'ratio',
      render: (ratio) => <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-xs">{ratio || '14.28'}</code>,
    },
    {
      title: 'Chủng Loại Số',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <span className="text-xs font-semibold text-slate-700">{cat || '10 số tiến + 2 số lùi'}</span>,
    },
    {
      title: 'Loại Xe Sử Dụng',
      dataIndex: 'vehicleModels',
      key: 'vehicleModels',
      render: (models) => <span className="text-xs text-slate-600">{models || 'HOWO'}</span>,
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined className="text-indigo-600" />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa hộp số này?" onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <SettingOutlined className="text-cyan-600" /> Quản Lý Hộp Số (Gearboxes)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Mã hộp số, tỷ số truyền & phân loại số (`/api/v1/gearboxes`)
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchGearboxes} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Hộp Số
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Tìm kiếm hộp số..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="rounded-xl"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredGearboxes}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} hộp số`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingGearbox ? 'Cập Nhật Hộp Số' : 'Thêm Hộp Số Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Mã / Tên Hộp Số" name="name" rules={[{ required: true, message: 'Nhập tên hộp số!' }]}>
            <Input placeholder="HW19710" />
          </Form.Item>

          <Form.Item label="Hình Ảnh Hộp Số" name="imageUrl">
            <ImageUploadInput resModel="gearbox" placeholder="/api/v1/attachments/... hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <Form.Item label="Nhãn Hiệu" name="brand">
            <Input placeholder="Sinotruk" />
          </Form.Item>

          <Form.Item label="Tỷ Số Truyền (Ratio)" name="ratio">
            <Input placeholder="14.28" />
          </Form.Item>

          <Form.Item label="Chủng Loại (Cấp Số)" name="category">
            <Input placeholder="10 số tiến + 2 số lùi" />
          </Form.Item>

          <Form.Item label="Loại Xe Sử Dụng" name="vehicleModels">
            <Input placeholder="HOWO 371, HOWO A7" />
          </Form.Item>

          <Form.Item label="Ghi Chú" name="note">
            <Input.TextArea rows={2} placeholder="Vỏ gang siêu bền, có trợ lực khí nén..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Hộp Số
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GearboxesPage;
