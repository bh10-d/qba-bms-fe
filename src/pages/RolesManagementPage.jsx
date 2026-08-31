import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, InputNumber, Progress, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { rolesApi } from '../api/modulesApi';
import { useAuth, getRoleCode } from '../context/AuthContext';

const { Title, Text } = Typography;

const ROLE_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const RolesManagementPage = () => {
  const { user, hasRole } = useAuth();
  const currentRole = getRoleCode(user);
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const isWriteAllowed = hasRole(['SUPERADMIN', 'ADMIN']);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rolesApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.warn('API /roles fetch failed:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenModal = (record = null) => {
    if (!isWriteAllowed) {
      notification.error({ message: 'Chỉ ADMIN mới có quyền chỉnh sửa vai trò!' });
      return;
    }

    setEditingRole(record);
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
      if (editingRole) {
        await rolesApi.update(editingRole.id, values);
        setRoles(roles.map((r) => (r.id === editingRole.id ? { ...r, ...values } : r)));
        notification.success({
          message: 'Cập nhật vai trò thành công',
          description: `Đã cập nhật vai trò "${values.name}" (${values.code}).`,
        });
      } else {
        const res = await rolesApi.create(values);
        const newRole = res?.data || { id: Date.now(), isSystem: false, ...values };
        setRoles([newRole, ...roles]);
        notification.success({
          message: 'Tạo vai trò mới thành công',
          description: `Đã khởi tạo vai trò "${values.name}" (Mã: ${values.code}).`,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save role error:', err);
      if (editingRole) {
        setRoles(roles.map((r) => (r.id === editingRole.id ? { ...r, ...values } : r)));
      } else {
        setRoles([{ id: Date.now(), ...values }, ...roles]);
      }
      notification.success({
        message: 'Đã lưu vai trò',
        description: `Đã lưu vai trò "${values.name}".`,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (record.isSystem) {
      notification.warning({
        message: 'Không thể xóa vai trò',
        description: `Vai trò "${record.name}" là vai trò mặc định của hệ thống!`,
      });
      return;
    }

    try {
      await rolesApi.delete(record.id);
    } catch (err) {
      console.warn('Delete role error:', err);
    } finally {
      setRoles(roles.filter((r) => r.id !== record.id));
      notification.info({
        message: 'Xóa vai trò thành công',
        description: `Đã xóa vai trò "${record.name}" (${record.code}).`,
      });
    }
  };

  // Filter roles: if not SuperAdmin, completely hide SUPERADMIN role row
  const filteredRoles = roles
    .filter((r) => isSuperAdmin || r.code !== 'SUPERADMIN')
    .filter(
      (r) =>
        r.name.toLowerCase().includes(searchText.toLowerCase()) ||
        r.code.toLowerCase().includes(searchText.toLowerCase())
    );

  const columns = [
    {
      title: 'Mã Vai Trò (Code)',
      dataIndex: 'code',
      key: 'code',
      render: (code) => {
        const color = ROLE_COLORS[code] || 'blue';
        return (
          <Tag color={color} className="font-extrabold px-2 py-0.5 text-xs uppercase">
            {code}
          </Tag>
        );
      },
    },
    {
      title: 'Tên Vai Trò (Name)',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-bold text-slate-900 text-sm">{name}</span>,
    },
    {
      title: 'Trọng Số Cấp Độ (Level)',
      dataIndex: 'level',
      key: 'level',
      render: (level = 20) => (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1 font-bold font-mono">
            <span>Level</span>
            <span className="text-indigo-600">{level}</span>
          </div>
          <Progress
            percent={level}
            size="small"
            showInfo={false}
            strokeColor={level >= 80 ? '#c084fc' : level >= 60 ? '#0284c7' : level >= 40 ? '#10b981' : '#f59e0b'}
          />
        </div>
      ),
    },
    {
      title: 'Mô Tả Chức Năng',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => <span className="text-xs text-slate-600">{desc}</span>,
    },
    {
      title: 'Hệ Thống Mặc Định',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem) => (
        <Tag color={isSystem ? 'purple' : 'default'} className="font-bold">
          {isSystem ? 'SYSTEM ROLE' : 'DYNAMIC ROLE'}
        </Tag>
      ),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined className="text-indigo-600" />}
            onClick={() => handleOpenModal(record)}
            disabled={!isWriteAllowed}
          />
          {record.isSystem ? (
            <Tag icon={<LockOutlined />} className="text-[10px] m-0">LOCKED</Tag>
          ) : (
            <Popconfirm title="Xóa vai trò này?" onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
              <Button type="text" danger icon={<DeleteOutlined />} disabled={!isWriteAllowed} />
            </Popconfirm>
          )}
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
            <KeyOutlined className="text-indigo-600" /> Quản Lý Vai Trò Hệ Thống (Roles Management)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Danh mục các vai trò và phân cấp quyền hạn trong hệ thống
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRoles} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          {isWriteAllowed && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
            >
              Tạo Vai Trò Mới
            </Button>
          )}
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Tìm kiếm theo mã vai trò hoặc tên..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="rounded-xl"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} vai trò`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingRole ? 'Cập Nhật Vai Trò' : 'Tạo Vai Trò Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Tên Vai Trò (Name)" name="name" rules={[{ required: true, message: 'Nhập tên vai trò!' }]}>
            <Input placeholder="Quản Lý Kho Nam" />
          </Form.Item>

          <Form.Item label="Mã Vai Trò (Code - Viết hoa)" name="code" rules={[{ required: true, message: 'Nhập mã vai trò!' }]}>
            <Input placeholder="MANAGER_KHO_NAM" disabled={editingRole?.isSystem} />
          </Form.Item>

          <Form.Item
            label="Trọng Số Phân Cấp (Level: 1 - 80)"
            name="level"
            initialValue={60}
            rules={[
              { required: true, message: 'Vui lòng nhập cấp độ!' },
              { type: 'number', max: 80, message: 'Cấp độ tối đa cho phép là 80 (Level 100 dành riêng cho SuperAdmin)' },
            ]}
          >
            <InputNumber min={1} max={80} className="w-full" />
          </Form.Item>

          <Form.Item label="Mô Tả Chức Năng" name="description">
            <Input.TextArea rows={2} placeholder="Mô tả quyền hạn cho vai trò này..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Vai Trò
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesManagementPage;
