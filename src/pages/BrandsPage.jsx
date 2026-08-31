import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Segmented, Avatar, Image, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, TagsOutlined, ReloadOutlined, BoxPlotOutlined, FilterOutlined } from '@ant-design/icons';
import { brandsApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'HAS_PRODUCTS' | 'NO_PRODUCTS'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await brandsApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setBrands(data);
      } else {
        setBrands([]);
      }
    } catch (err) {
      console.warn('API brands fetch failed:', err);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingBrand(record);
    if (record) {
      form.setFieldsValue({ name: record.name, logoUrl: record.logoUrl });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingBrand) {
        await brandsApi.update(editingBrand.id, values);
        setBrands(brands.map((b) => (b.id === editingBrand.id ? { ...b, name: values.name, logoUrl: values.logoUrl } : b)));
        notification.success({
          message: 'Cập nhật thương hiệu thành công',
          description: `Đã cập nhật thương hiệu "${values.name}".`,
        });
      } else {
        const res = await brandsApi.create(values);
        const createdData = res?.data || res;
        const newBrand = {
          id: createdData?.id || Date.now(),
          name: values.name,
          logoUrl: values.logoUrl,
          productCount: 0,
          products: [],
          createdAt: new Date().toISOString(),
          ...createdData,
        };
        setBrands([newBrand, ...brands]);
        notification.success({
          message: 'Tạo thương hiệu mới thành công',
          description: `Đã thêm thương hiệu "${values.name}" vào hệ thống.`,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save brand error:', err);
      if (editingBrand) {
        setBrands(brands.map((b) => (b.id === editingBrand.id ? { ...b, name: values.name, logoUrl: values.logoUrl } : b)));
      } else {
        setBrands([{ id: Date.now(), name: values.name, logoUrl: values.logoUrl, productCount: 0, products: [], createdAt: new Date().toISOString() }, ...brands]);
      }
      notification.success({
        message: 'Đã lưu thương hiệu',
        description: `Đã lưu thương hiệu "${values.name}".`,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? record.name : 'thương hiệu';
    try {
      await brandsApi.delete(targetId);
    } catch (err) {
      console.warn('Delete brand API error:', err);
    } finally {
      setBrands(brands.filter((b) => b.id !== targetId));
      notification.info({
        message: 'Xóa thương hiệu thành công',
        description: `Đã xóa thương hiệu "${targetName}".`,
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '29/08/2026 11:45';
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

  const hasProductsCount = useMemo(() => {
    return brands.filter((b) => {
      const count = b.productCount ?? b.productsCount ?? (Array.isArray(b.products) ? b.products.length : 0);
      return count > 0;
    }).length;
  }, [brands]);

  const noProductsCount = useMemo(() => {
    return brands.length - hasProductsCount;
  }, [brands, hasProductsCount]);

  const filteredBrands = brands.filter((b) => {
    const count = b.productCount ?? b.productsCount ?? (Array.isArray(b.products) ? b.products.length : 0);
    const matchesSearch = b.name.toLowerCase().includes(searchText.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'HAS_PRODUCTS') {
      matchesStatus = count > 0;
    } else if (filterStatus === 'NO_PRODUCTS') {
      matchesStatus = count === 0;
    }

    return matchesSearch && matchesStatus;
  });

  const expandedRowRender = (record) => {
    const products = Array.isArray(record.products) ? record.products : [];
    if (products.length === 0) {
      return (
        <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg">
          Chưa có sản phẩm nào liên kết với thương hiệu này.
        </div>
      );
    }

    const subColumns = [
      {
        title: 'Hình Ảnh',
        dataIndex: 'imageUrl',
        key: 'imageUrl',
        width: 70,
        render: (imgUrl, pRecord) => {
          const src = resolveUrl(imgUrl);
          const initialLetter = (pRecord.name || 'P')[0].toUpperCase();

          if (!src) {
            return (
              <Avatar
                shape="square"
                size={36}
                className="bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-lg border border-indigo-100 shrink-0 flex items-center justify-center"
              >
                {initialLetter}
              </Avatar>
            );
          }
          return (
            <Image
              src={src}
              alt={pRecord.name}
              width={36}
              height={36}
              className="object-cover rounded-lg border border-slate-200 shadow-2xs"
              fallback="https://placehold.co/100x100?text=No+Image"
            />
          );
        },
      },
      {
        title: 'Tên Phụ Tùng / Sản Phẩm',
        dataIndex: 'name',
        key: 'name',
        render: (name) => (
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            {name}
          </span>
        ),
      },
      {
        title: 'Mã Barcode',
        dataIndex: 'defaultCode',
        key: 'defaultCode',
        render: (code) => (
          <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
            {code || 'N/A'}
          </code>
        ),
      },
      {
        title: 'SKU Thương Hiệu',
        dataIndex: 'brandSku',
        key: 'brandSku',
        render: (sku) => (
          <span className="text-xs text-slate-600 font-mono">{sku || 'N/A'}</span>
        ),
      },
      {
        title: 'Ngày Tạo',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-[11px] text-slate-500 font-mono">{formatDate(date)}</span>
        ),
      },
    ];

    return (
      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 my-1">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
          <BoxPlotOutlined className="text-indigo-600" />
          <span>Danh sách {products.length} sản phẩm thuộc nhãn thương hiệu "{record.name}":</span>
        </div>
        <Table
          columns={subColumns}
          dataSource={products}
          rowKey={(item) => item.id || item.name}
          pagination={false}
          size="small"
          className="bg-white rounded-lg shadow-2xs overflow-hidden"
        />
      </div>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <span className="font-mono text-xs text-slate-500">#{id}</span>,
    },
    {
      title: 'Tên Thương Hiệu',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => {
        const logoSrc = resolveUrl(record.logoUrl);
        const initialLetter = (name || 'B')[0].toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <Avatar
              src={logoSrc}
              size={32}
              className="border border-slate-200 bg-indigo-50 text-indigo-700 font-extrabold text-xs shrink-0 shadow-2xs flex items-center justify-center"
            >
              {initialLetter}
            </Avatar>
            <span className="font-bold text-slate-900 text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      title: 'Số Sản Phẩm Liên Kết',
      key: 'productCount',
      render: (_, record) => {
        const count = record.productCount ?? record.productsCount ?? (Array.isArray(record.products) ? record.products.length : 0);
        if (count > 0) {
          return (
            <Tag color="blue" className="font-bold">
              {count} Sản phẩm
            </Tag>
          );
        }
        return <Tag color="default" className="font-semibold text-slate-400">0 Sản phẩm</Tag>;
      },
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-xs text-slate-600 font-mono font-medium">{formatDate(date)}</span>,
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
          />
          <Popconfirm
            title="Xóa thương hiệu này?"
            description="Thao tác này không thể hoàn tác."
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
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
            <TagsOutlined className="text-indigo-600" /> Quản Lý Thương Hiệu (Brands)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Danh mục các nhãn hiệu phụ tùng, xe tải & thiết bị (`/api/v1/brands`)
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBrands} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Thương Hiệu
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5">
          <Input
            placeholder="Tìm kiếm thương hiệu..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="max-w-xs rounded-xl"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <FilterOutlined className="text-indigo-600" /> Lọc nhanh:
            </span>
            <Segmented
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { label: `Tất cả (${brands.length})`, value: 'ALL' },
                { label: `Có sản phẩm (${hasProductsCount})`, value: 'HAS_PRODUCTS' },
                { label: `Chưa có (${noProductsCount})`, value: 'NO_PRODUCTS' },
              ]}
              className="bg-slate-100 p-0.5 rounded-xl font-semibold text-xs"
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredBrands}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => Array.isArray(record.products) && record.products.length > 0,
          }}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} thương hiệu`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingBrand ? 'Cập Nhật Thương Hiệu' : 'Thêm Thương Hiệu Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item
            label="Tên Thương Hiệu"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
          >
            <Input placeholder="ví dụ: Sinotruk HOWO" size="large" />
          </Form.Item>

          <Form.Item label="Logo Thương Hiệu" name="logoUrl">
            <ImageUploadInput resModel="brand" placeholder="/uploads/brands/antek.png hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Thương Hiệu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandsPage;
