import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, InputNumber, Progress, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      notification.error({ message: t('common.error') });
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
          message: t('common.success'),
          description: values.name,
        });
      } else {
        const res = await rolesApi.create(values);
        const newRole = res?.data || { id: Date.now(), isSystem: false, ...values };
        setRoles([newRole, ...roles]);
        notification.success({
          message: t('common.success'),
          description: values.name,
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
        message: t('common.success'),
        description: values.name,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (record.isSystem) {
      notification.warning({
        message: t('common.warning'),
        description: record.name,
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
        message: t('common.info'),
        description: record.name,
      });
    }
  };

  // Filter roles: if not SuperAdmin, completely hide SUPERADMIN role row
  const filteredRoles = roles
    .filter((r) => isSuperAdmin || r.code !== 'SUPERADMIN')
    .filter(
      (r) =>
        (r.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.code || '').toLowerCase().includes(searchText.toLowerCase())
    );

  const columns = [
    {
      title: t('roles.roleCode'),
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
      title: t('roles.roleName'),
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-bold text-slate-900 text-sm">{name}</span>,
    },
    {
      title: t('roles.level'),
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
      title: t('roles.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc) => <span className="text-xs text-slate-600">{desc}</span>,
    },
    {
      title: t('common.action'),
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
            <Popconfirm title={t('roles.deleteConfirm')} onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <KeyOutlined className="text-indigo-600" /> {t('roles.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('roles.searchPlaceholder')}
          </Text>
        </div>

        <Space wrap className="w-full sm:w-auto">
          <Button icon={<ReloadOutlined />} onClick={fetchRoles} loading={loading} className="text-xs font-semibold">
            {t('common.reload')}
          </Button>
          {isWriteAllowed && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
            >
              {t('roles.createNew')}
            </Button>
          )}
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder={t('roles.searchPlaceholder')}
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
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingRole ? t('roles.editTitle') : t('roles.createNew')}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label={t('roles.roleName')} name="name" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="Role Name" />
          </Form.Item>

          <Form.Item label={t('roles.roleCode')} name="code" rules={[{ required: true, message: t('common.required') }]}>
            <Input placeholder="ROLE_CODE" disabled={editingRole?.isSystem} />
          </Form.Item>

          <Form.Item
            label={t('roles.level')}
            name="level"
            initialValue={60}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <InputNumber min={1} max={80} className="w-full" />
          </Form.Item>

          <Form.Item label={t('roles.description')} name="description">
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

export default RolesManagementPage;
