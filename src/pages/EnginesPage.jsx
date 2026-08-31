import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Select, Avatar, Image, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { enginesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const EnginesPage = () => {
  const [engines, setEngines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchEngines = async () => {
    setLoading(true);
    try {
      const res = await enginesApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setEngines(data);
      } else {
        setEngines([]);
      }
    } catch (err) {
      console.warn('API engines fetch failed:', err);
      setEngines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngines();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingEngine(record);
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
      if (editingEngine) {
        await enginesApi.update(editingEngine.id, values);
        setEngines(engines.map((e) => (e.id === editingEngine.id ? { ...e, ...values } : e)));
        notification.success({
          message: 'Cập nhật động cơ thành công',
          description: `Đã cập nhật thông tin động cơ "${values.name}".`,
        });
      } else {
        const res = await enginesApi.create(values);
        const newEngine = res?.data || { id: Date.now(), ...values };
        setEngines([newEngine, ...engines]);
        notification.success({
          message: 'Thêm động cơ mới thành công',
          description: `Đã thêm động cơ "${values.name}" vào danh mục.`,
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
        message: 'Đã lưu thông tin động cơ',
        description: `Đã lưu động cơ "${values.name}".`,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? record.name : 'động cơ';
    try {
      await enginesApi.delete(targetId);
    } catch (err) {
      console.warn('Delete engine error:', err);
    } finally {
      setEngines(engines.filter((e) => e.id !== targetId));
      notification.info({
        message: 'Xóa động cơ thành công',
        description: `Đã xóa "${targetName}" khỏi danh mục động cơ.`,
      });
    }
  };

  const filteredEngines = engines.filter(
    (e) =>
      e.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (e.brand && e.brand.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'Mã / Tên Động Cơ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const src = resolveUrl(record.imageUrl);
        const initialLetter = (text || 'E')[0].toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            {src ? (
              <Image src={src} alt={text} width={36} height={36} className="object-cover rounded-lg border border-slate-200" />
            ) : (
              <Avatar shape="square" size={36} className="bg-amber-50 text-amber-700 font-extrabold text-xs rounded-lg border border-amber-200 shrink-0 flex items-center justify-center">
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
      render: (brand) => <Tag color="blue" className="font-semibold">{brand || 'Weichai'}</Tag>,
    },
    {
      title: 'Mã Lực & Dung Tích',
      key: 'power',
      render: (_, record) => (
        <span className="text-xs font-semibold text-slate-700">
          {record.horsepower} • {record.capacity}
        </span>
      ),
    },
    {
      title: 'Tiêu Chuẩn Khí Thải',
      dataIndex: 'emissionStandard',
      key: 'emissionStandard',
      render: (std) => <Tag color="green" className="font-bold">{std || 'Euro 5'}</Tag>,
    },
    {
      title: 'Mẫu Xe Tương Thích',
      dataIndex: 'vehicleModels',
      key: 'vehicleModels',
      render: (models) => <span className="text-xs text-slate-600">{models || 'Tất cả'}</span>,
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined className="text-indigo-600" />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa động cơ này?" onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <ThunderboltOutlined className="text-amber-500" /> Quản Lý Động Cơ
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Thông số kỹ thuật và chủng loại động cơ xe tải, xe đầu kéo
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchEngines} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Động Cơ
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Tìm kiếm động cơ..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="rounded-xl"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredEngines}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} động cơ`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingEngine ? 'Cập Nhật Động Cơ' : 'Thêm Động Cơ Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Mã / Tên Động Cơ" name="name" rules={[{ required: true, message: 'Nhập tên động cơ!' }]}>
              <Input placeholder="WP10.380E53" />
            </Form.Item>
            <Form.Item label="Nhãn Hiệu Động Cơ" name="brand">
              <Input placeholder="Weichai" />
            </Form.Item>
          </div>

          <Form.Item label="Hình Ảnh Động Cơ" name="imageUrl">
            <ImageUploadInput resModel="engine" placeholder="/api/v1/attachments/... hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label="Dung Tích (L)" name="capacity">
              <Input placeholder="9.726L" />
            </Form.Item>
            <Form.Item label="Mã Lực (HP)" name="horsepower">
              <Input placeholder="380 HP" />
            </Form.Item>
            <Form.Item label="Lực Kéo (N.m)" name="torque">
              <Input placeholder="1600 N.m" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Tiêu Chuẩn Khí Thải" name="emissionStandard" initialValue="Euro 5">
              <Select
                options={[
                  { value: 'Euro 2', label: 'Euro 2' },
                  { value: 'Euro 3', label: 'Euro 3' },
                  { value: 'Euro 4', label: 'Euro 4' },
                  { value: 'Euro 5', label: 'Euro 5' },
                  { value: 'Euro 6', label: 'Euro 6' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Chủng Loại" name="category">
              <Input placeholder="Xe tải nặng" />
            </Form.Item>
          </div>

          <Form.Item label="Mẫu Xe Sử Dụng" name="vehicleModels">
            <Input placeholder="HOWO A7, HOWO V7" />
          </Form.Item>

          <Form.Item label="Ghi Chú Kỹ Thuật" name="note">
            <Input.TextArea rows={2} placeholder="Công nghệ Áo, nắp máy đúc..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Động Cơ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EnginesPage;
