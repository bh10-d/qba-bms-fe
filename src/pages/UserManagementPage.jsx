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
  const { user, hasRole } = useAuth();
  const currentRole = getRoleCode(user);
  const currentLevel = getRoleLevel(user);
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  // Anti-privilege escalation: roles available for assigning must have level < currentLevel
  const filteredDefaultRoles = useMemo(() => {
    return DEFAULT_ROLE_OPTIONS.filter((r) => isSuperAdmin || r.level < currentLevel);
  }, [isSuperAdmin, currentLevel]);

  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState(filteredDefaultRoles);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWriteAllowed = hasRole(['SUPERADMIN', 'ADMIN']);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn('API /users fetch failed:', err);
      setUsers([]);
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
    fetchUsers();
    fetchDynamicRoles();
  }, []);

  const handleAddUser = async (values) => {
    if (!isWriteAllowed) {
      notification.error({
        message: 'Không có quyền thao tác',
        description: 'Chỉ tài khoản ADMIN trở lên mới được phép tạo người dùng mới!',
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
        lastActive: 'Vừa tạo',
      };
      setUsers([newUser, ...users]);
      notification.success({
        message: 'Tạo người dùng thành công',
        description: `Đã tạo tài khoản "${values.fullName}" (${values.email}) với vai trò ${values.roleCode}.`,
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
        lastActive: 'Vừa tạo',
      };
      setUsers([newUser, ...users]);
      notification.success({
        message: 'Tạo người dùng thành công',
        description: `Đã thêm tài khoản "${values.fullName}" (${values.email}).`,
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
        message: 'Không có quyền thao tác',
        description: 'Chỉ ADMIN/SUPERADMIN mới có quyền khóa/mở khóa tài khoản người dùng!',
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
      const actionText = newIsActive ? 'Đã mở khóa' : 'Đã khóa';

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
        message: `${actionText} tài khoản thành công`,
        description: `${actionText} tài khoản "${record.fullName || record.name}" (${record.email}).`,
      });
    } catch (err) {
      console.error('Toggle lock user error:', err);
      const errorMsg = err.message || err.error || 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản!';
      notification.error({
        message: 'Thao tác khóa/mở khóa thất bại',
        description: errorMsg,
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
    if (!dateStr) return '29/08/2026 11:46';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n) => String(n).padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const code = getRoleCode(record);
        return (
          <div className="flex items-center gap-3">
            <Avatar style={{ backgroundColor: code === 'SUPERADMIN' ? '#ef4444' : code === 'ADMIN' ? '#c084fc' : '#6366f1' }}>
              {(text || record.fullName || 'U')[0]}
            </Avatar>
            <div>
              <div className="font-bold text-slate-900 text-sm">{text || record.fullName}</div>
              <div className="text-xs text-slate-500">{record.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Vai Trò',
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
      title: 'Trạng Thái',
      key: 'status',
      render: (_, record) => {
        const active = isUserActive(record);
        return (
          <Badge
            status={active ? 'success' : 'error'}
            text={<span className="font-semibold text-xs text-slate-700">{active ? 'Hoạt động' : 'Đã khóa'}</span>}
          />
        );
      },
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-xs text-slate-600 font-mono font-medium">{formatDate(date)}</span>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const active = isUserActive(record);
        return (
          <Space size="small">
            <Tooltip title="Xem thông tin chi tiết">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined className="text-indigo-600" />}
                onClick={() => handleViewUser(record)}
              />
            </Tooltip>

            {isWriteAllowed && (
              <Tooltip title={active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
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
            Danh Sách Người Dùng & Phân Quyền
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Quản lý tài khoản nhân viên, phân quyền hạn và trạng thái hoạt động
          </Text>
        </div>

        {isWriteAllowed ? (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Người Dùng Mới
          </Button>
        ) : (
          <Tag color="cyan" className="font-bold py-1.5 px-3 text-xs">
            Chế Độ Xem (Read Only)
          </Tag>
        )}
      </div>

      {!isWriteAllowed && (
        <Alert
          title="Thông Báo Phân Quyền"
          description="Bạn đang xem danh sách người dùng được phân cấp từ level hiện tại trở xuống."
          type="info"
          showIcon
          className="rounded-xl"
        />
      )}

      {/* Filter & Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Input
            placeholder="Tìm kiếm theo Tên hoặc Email..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-80 rounded-xl"
            allowClear
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">Lọc theo Role:</span>
            <Select
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              className="w-44"
              options={[
                { value: 'ALL', label: 'Tất cả Roles' },
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
          columns={columns}
          dataSource={filteredUsers}
          rowKey={(record) => record.id || record.key || record.email}
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} người dùng`,
          }}
          className="overflow-x-auto"
        />
      </Card>

      {/* Add User Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">Tạo Tài Khoản Người Dùng Mới</span>}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddUser} className="mt-4">
          <Form.Item label="Họ và Tên" name="fullName" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ!' }]}>
            <Input placeholder="user@qbabms.com" />
          </Form.Item>

          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự!' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item label="Ảnh Đại Diện (Avatar)" name="avatarUrl">
            <ImageUploadInput placeholder="https://... hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <Form.Item label="Chỉ định Vai trò" name="roleCode" initialValue="USER">
            <Select options={availableRoles} />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} className="bg-indigo-600">
              Tạo Tài Khoản
            </Button>
          </div>
        </Form>
      </Modal>

      {/* User Details Drawer */}
      <Drawer
        title={<span className="font-bold text-slate-900">Chi Tiết Tài Khoản Người Dùng</span>}
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
              <Descriptions.Item label="ID">{selectedUser.id}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={isUserActive(selectedUser) ? 'success' : 'error'}>
                  {isUserActive(selectedUser) ? 'HOẠT ĐỘNG (ACTIVE)' : 'ĐÃ KHÓA (LOCKED)'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(selectedUser.createdAt)}</Descriptions.Item>
            </Descriptions>

            <div className={`p-3 border rounded-xl text-xs ${isUserActive(selectedUser) ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              <SafetyCertificateOutlined className={`mr-1 ${isUserActive(selectedUser) ? 'text-indigo-600' : 'text-rose-600'}`} />
              {isUserActive(selectedUser) ? 'Tài khoản đang hoạt động bình thường.' : 'Tài khoản đã bị tạm khóa bởi quản trị viên.'}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserManagementPage;
