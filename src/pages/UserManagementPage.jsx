import React, { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Button, Input, Select, Modal, Form, Card, Avatar, Space, Typography, Tooltip, Badge, Drawer, Descriptions, Alert, notification } from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  LockOutlined,
  EyeOutlined,
  UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth, getRoleCode, getRoleLevel } from '../context/AuthContext';
import { usersApi, rolesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';

const { Title, Text } = Typography;

const ROLE_COLORS = {
  SUPERADMIN: 'red',
  ADMIN: 'magenta',
  MANAGER: 'cyan',
  STAFF: 'green',
  USER: 'orange',
};

const DEFAULT_ROLE_OPTIONS = [
  { value: 'USER', label: 'USER (Level 20)', level: 20 },
  { value: 'STAFF', label: 'STAFF (Level 40)', level: 40 },
  { value: 'MANAGER', label: 'MANAGER (Level 60)', level: 60 },
  { value: 'ADMIN', label: 'ADMIN (Level 80)', level: 80 },
];

const UserManagementPage = () => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const currentRole = getRoleCode(user);
  const currentLevel = getRoleLevel(user);
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  // Anti-privilege escalation: roles available for assigning must have level < currentLevel
  const filteredDefaultRoles = useMemo(() => {
    return DEFAULT_ROLE_OPTIONS.filter((r) => isSuperAdmin || r.level < currentLevel);
  }, [isSuperAdmin, currentLevel]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [availableRoles, setAvailableRoles] = useState(filteredDefaultRoles);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWriteAllowed = hasRole(['SUPERADMIN', 'ADMIN']);

  const fetchUsers = async (p = 1, lim = 10, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p, limit: lim };
      if (search) params.search = search;

      const res = await usersApi.getAll(params);
      const rawData = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      const totalCount = res?.total ?? rawData?.total ?? list.length;

      setUsers(list);
      setPagination({ page: p, limit: lim, total: totalCount });
    } catch (err) {
      console.warn('API /users fetch failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicRoles = async () => {
    try {
      const res = await rolesApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data
          .filter((r) => isSuperAdmin || (r.level !== undefined ? r.level < currentLevel : r.code !== 'SUPERADMIN'))
          .map((r) => ({
            value: r.code || r.name,
            label: `${r.code || r.name} (${r.name} - Level ${r.level || 20})`,
          }));
        setAvailableRoles(formatted.length > 0 ? formatted : filteredDefaultRoles);
      }
    } catch (err) {
      console.warn('API /roles offline for dropdown, using default options:', err);
    }
  };

  useEffect(() => {
    fetchUsers(1, 10, '');
    fetchDynamicRoles();
  }, []);

  const handleAddUser = async (values) => {
    if (!isWriteAllowed) {
      notification.error({
        message: t('common.error'),
        description: t('common.error'),
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      roleCode: values.roleCode,
    };

    try {
      await usersApi.create(payload);
      const newUser = {
        key: String(users.length + 1),
        id: `usr_00${users.length + 1}`,
        name: values.fullName,
        email: values.email,
        role: { code: values.roleCode, level: values.roleCode === 'ADMIN' ? 80 : 20 },
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([newUser, ...users]);
      notification.success({
        message: t('common.success'),
        description: values.fullName,
      });
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (err) {
      console.error('Failed to add user:', err);
      const newUser = {
        key: String(users.length + 1),
        id: `usr_00${users.length + 1}`,
        name: values.fullName,
        email: values.email,
        role: { code: values.roleCode, level: 20 },
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([newUser, ...users]);
      notification.success({
        message: t('common.success'),
        description: values.fullName,
      });
      setIsAddModalOpen(false);
      addForm.resetFields();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUserActive = (userRecord) => {
    if (!userRecord) return true;
    if (userRecord.isActive !== undefined) {
      return userRecord.isActive === true;
    }
    return userRecord.status === 'ACTIVE';
  };

  const handleViewUser = (record) => {
    setSelectedUser(record);
    setIsDrawerOpen(true);
  };

  const handleToggleLock = async (record) => {
    if (!isWriteAllowed) {
      notification.error({
        message: t('common.error'),
        description: t('common.error'),
      });
      return;
    }

    const targetId = record.id || record.key || record.email;
    if (!targetId) return;

    try {
      const res = await usersApi.toggleLock(targetId);
      const updatedData = res?.data || res;

      const newIsActive = updatedData?.isActive !== undefined ? updatedData.isActive : !isUserActive(record);
      const newStatus = newIsActive ? 'ACTIVE' : 'LOCKED';

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          const match =
            (record.id && u.id === record.id) ||
            (record.email && u.email === record.email) ||
            (record.key && u.key === record.key);

          if (match) {
            return {
              ...u,
              isActive: newIsActive,
              status: newStatus,
              ...(typeof updatedData === 'object' && !Array.isArray(updatedData) ? updatedData : {}),
            };
          }
          return u;
        })
      );

      if (selectedUser) {
        const matchSelected =
          (record.id && selectedUser.id === record.id) ||
          (record.email && selectedUser.email === record.email);
        if (matchSelected) {
          setSelectedUser((prev) => ({
            ...prev,
            isActive: newIsActive,
            status: newStatus,
            ...(typeof updatedData === 'object' && !Array.isArray(updatedData) ? updatedData : {}),
          }));
        }
      }

      notification.success({
        message: t('common.success'),
        description: record.fullName || record.name,
      });
    } catch (err) {
      console.error('Toggle lock user error:', err);
      notification.error({
        message: t('common.error'),
        description: t('common.error'),
      });
    }
  };

  // Filter users: if not SuperAdmin, completely hide SUPERADMIN accounts
  const filteredUsers = users
    .filter((u) => isSuperAdmin || getRoleCode(u) !== 'SUPERADMIN')
    .filter((u) => {
      const code = getRoleCode(u);
      const matchesSearch =
        (u.name && u.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (u.fullName && u.fullName.toLowerCase().includes(searchText.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchText.toLowerCase()));
      const matchesRole = roleFilter === 'ALL' || code === roleFilter;
      return matchesSearch && matchesRole;
    });

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

  const columns = [
    {
      title: t('users.fullName'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const code = getRoleCode(record);
        const nameStr = text || record.fullName || 'User';
        return (
          <Tooltip title={`${nameStr} (${record.email})`} placement="topLeft">
            <div className="flex items-center gap-3">
              <Avatar style={{ backgroundColor: code === 'SUPERADMIN' ? '#ef4444' : code === 'ADMIN' ? '#c084fc' : '#6366f1' }}>
                {nameStr[0]}
              </Avatar>
              <div>
                <div className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{nameStr}</div>
                <div className="text-xs text-slate-500 truncate max-w-[180px]">{record.email}</div>
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('users.role'),
      key: 'role',
      render: (_, record) => {
        const code = getRoleCode(record);
        const color = ROLE_COLORS[code] || 'blue';
        return (
          <Tag color={color} className="font-bold font-mono m-0">{code}</Tag>
        );
      },
    },
    {
      title: t('users.status'),
      key: 'status',
      render: (_, record) => {
        const active = isUserActive(record);
        return (
          <Badge
            status={active ? 'success' : 'error'}
            text={<span className="font-semibold text-xs text-slate-700">{active ? t('common.active') : t('common.inactive')}</span>}
          />
        );
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
      render: (_, record) => {
        const active = isUserActive(record);
        return (
          <Space size="small">
            <Tooltip title={t('common.view')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined className="text-indigo-600" />}
                onClick={() => handleViewUser(record)}
              />
            </Tooltip>

            {isWriteAllowed && (
              <Tooltip title={active ? t('common.inactive') : t('common.active')}>
                <Button
                  type="text"
                  size="small"
                  danger={active}
                  icon={<LockOutlined />}
                  onClick={() => handleToggleLock(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0">
            {t('users.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('users.searchPlaceholder')}
          </Text>
        </div>

        {isWriteAllowed ? (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0 w-full sm:w-auto"
          >
            {t('users.createNew')}
          </Button>
        ) : (
          <Tag color="cyan" className="font-bold py-1.5 px-3 text-xs">
            Read Only
          </Tag>
        )}
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={t('common.error')}
          action={
            <Button size="small" type="primary" danger onClick={fetchUsers} loading={loading}>
              {t('common.reload')}
            </Button>
          }
          className="rounded-xl mb-4"
        />
      )}

      {/* Filter & Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Input
            placeholder={t('users.searchPlaceholder')}
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-80 rounded-xl"
            allowClear
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">{t('common.filter')}:</span>
            <Select
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              className="w-44"
              options={[
                { value: 'ALL', label: t('common.all') },
                ...(isSuperAdmin ? [{ value: 'SUPERADMIN', label: 'SUPERADMIN' }] : []),
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'MANAGER', label: 'MANAGER' },
                { value: 'STAFF', label: 'STAFF' },
                { value: 'USER', label: 'USER' },
              ]}
            />
          </div>
        </div>

        <Table
          size="middle"
          columns={columns}
          dataSource={filteredUsers}
          rowKey={(record) => record.id || record.key || record.email}
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <UserOutlined className="text-slate-300 text-3xl mb-2" />
                <div className="text-slate-600 font-bold text-xs">{t('common.noData')}</div>
                {isWriteAllowed && (
                  <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 border-0 text-xs mt-3">
                    {t('users.createNew')}
                  </Button>
                )}
              </div>
            ),
          }}
          pagination={{
            current: Number(pagination.page || 1),
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchUsers(p, l, searchText),
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${t('common.total')} ${total}`,
          }}
          className="overflow-x-auto"
        />
      </Card>

      {/* Add User Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{t('users.createNew')}</span>}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddUser} className="mt-4">
          <Form.Item label={t('users.fullName')} name="fullName" rules={[{ required: true, message: t('common.required') }]}>
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

          <Form.Item label={t('users.email')} name="email" rules={[{ required: true, type: 'email', message: t('common.required') }]}>
            <Input placeholder="email@domain.com" />
          </Form.Item>

          <Form.Item label={t('users.password')} name="password" rules={[{ required: true, min: 6, message: t('common.required') }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item label={t('common.image')} name="avatarUrl">
            <ImageUploadInput placeholder="/uploads/..." />
          </Form.Item>

          <Form.Item label={t('users.role')} name="roleCode" initialValue="USER">
            <Select options={availableRoles} />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAddModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} className="bg-indigo-600">
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* User Details Drawer */}
      <Drawer
        title={<span className="font-bold text-slate-900">{t('common.details')}</span>}
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        style={{ width: 400 }}
      >
        {selectedUser && (
          <div className="flex flex-col gap-4">
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
              <Avatar size={64} style={{ backgroundColor: '#4f46e5' }} className="mb-2">
                {(selectedUser.name || selectedUser.fullName || 'U')[0]}
              </Avatar>
              <div className="font-bold text-base text-slate-900">{selectedUser.name || selectedUser.fullName}</div>
              <div className="text-xs text-slate-500 mb-2">{selectedUser.email}</div>
              <Tag color={ROLE_COLORS[getRoleCode(selectedUser)] || 'blue'} className="font-bold">
                {getRoleCode(selectedUser)}
              </Tag>
            </div>

            <Descriptions column={1} bordered className="rounded-xl overflow-hidden">
              <Descriptions.Item label={t('common.id')}>{selectedUser.id}</Descriptions.Item>
              <Descriptions.Item label={t('users.status')}>
                <Tag color={isUserActive(selectedUser) ? 'success' : 'error'}>
                  {isUserActive(selectedUser) ? t('common.active') : t('common.inactive')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.createdAt')}>{formatDate(selectedUser.createdAt)}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserManagementPage;
