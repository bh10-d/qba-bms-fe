import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, InputNumber, Select, Avatar, Image, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ShopOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import { supplierInfoApi, productsApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const IsolatedSearchBar = React.memo(({ onSearch }) => {
  const [value, setValue] = useState('');

  const handleTriggerSearch = () => {
    onSearch(value);
  };

  return (
    <div className="mb-4 flex items-center gap-3 max-w-md">
      <Input
        placeholder="Tìm theo tên nhà cung cấp hoặc mã phụ tùng riêng..."
        prefix={<SearchOutlined className="text-slate-400" />}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleTriggerSearch}
        onClear={() => onSearch('')}
        allowClear
        className="rounded-xl text-xs flex-1"
      />
      <Button onClick={handleTriggerSearch} type="primary" className="bg-indigo-600 font-bold text-xs border-0">
        Tìm kiếm
      </Button>
    </div>
  );
});

const SupplierInfoPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [currentSearch, setCurrentSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;

      const res = await supplierInfoApi.getAll(params);
      const rawData = res?.data || res;

      const itemsList = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.items) ? rawData.items : []));

      const totalCount = rawData?.total ?? rawData?.totalCount ?? itemsList.length;

      setSuppliers(itemsList);
      setPagination({ page, limit, total: totalCount });
    } catch (err) {
      console.warn('API supplier-info fetch failed:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setProductsList(data);
      }
    } catch (err) {
      console.warn('API products fetch failed in SupplierInfoPage:', err);
      setProductsList([]);
    }
  };

  useEffect(() => {
    fetchSuppliers(1, 10, '');
    fetchProducts();
  }, [fetchSuppliers]);

  const productOptions = useMemo(() => {
    return productsList.map((p) => ({
      value: p.id,
      label: `${p.name || p.title || 'Phụ tùng'} (${p.defaultCode || p.code || p.sku || `ID #${p.id}`})`,
    }));
  }, [productsList]);

  const handleOpenModal = useCallback((record = null) => {
    setEditingSupplier(record);
    setIsModalOpen(true);
    setTimeout(() => {
      if (record) {
        form.setFieldsValue({
          productId: record.productId || record.product?.id,
          supplierName: record.supplierName || record.name,
          productCode: record.productCode || record.supplierProductCode || record.code,
          price: record.price ?? record.unitPrice ?? record.costPrice,
          minQty: record.minQty ?? record.minQuantity ?? record.minimumQuantity,
          imageUrl: record.imageUrl || record.logoUrl,
        });
      } else {
        form.resetFields();
      }
    }, 0);
  }, [form]);

  const handleSave = async (values) => {
    setSubmitting(true);
    const selectedProd = productsList.find((p) => String(p.id) === String(values.productId));
    const prodName = selectedProd?.name || selectedProd?.title || 'Phụ tùng';

    const payload = {};
    if (values.productId !== undefined && values.productId !== null) payload.productId = Number(values.productId);
    if (values.supplierName) payload.supplierName = values.supplierName;
    if (values.productCode) payload.productCode = values.productCode;
    if (values.price !== undefined && values.price !== null) payload.price = Number(values.price);
    if (values.minQty !== undefined && values.minQty !== null) payload.minQty = Number(values.minQty);
    if (values.imageUrl) payload.imageUrl = values.imageUrl;

    try {
      if (editingSupplier) {
        await supplierInfoApi.update(editingSupplier.id, payload);
        setSuppliers(suppliers.map((s) => (s.id === editingSupplier.id ? { ...s, ...payload, productName: prodName } : s)));
        notification.success({
          message: 'Cập nhật nhà cung cấp thành công',
          description: `Đã cập nhật thông tin nhà cung cấp "${values.supplierName}".`,
        });
      } else {
        const res = await supplierInfoApi.create(payload);
        const createdData = res?.data || res;
        const newSupplier = {
          id: createdData?.id || Date.now(),
          ...payload,
          ...createdData,
          productName: prodName,
        };
        setSuppliers([newSupplier, ...suppliers]);
        notification.success({
          message: 'Thêm nhà cung cấp mới thành công',
          description: `Đã thêm nhà cung cấp "${values.supplierName}" với mã hàng ${values.productCode}.`,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save supplier API error details:', err, 'Message Array:', err?.message);
      const msgArray = Array.isArray(err?.message) ? err.message : (typeof err?.message === 'string' ? [err.message] : [JSON.stringify(err)]);
      const errorText = msgArray.join(' | ');

      notification.error({
        message: 'Lỗi Backend (400 Bad Request)',
        description: `Chi tiết lỗi từ BE: ${errorText}`,
        duration: 12,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? (record.supplierName || record.name) : 'nhà cung cấp';
    try {
      await supplierInfoApi.delete(targetId);
    } catch (err) {
      console.warn('Delete supplier error:', err);
    } finally {
      setSuppliers((prev) => prev.filter((s) => s.id !== targetId));
      notification.info({
        message: 'Xóa nhà cung cấp thành công',
        description: `Đã xóa thông tin nhà cung cấp "${targetName}".`,
      });
    }
  }, []);

  const handleSearchTrigger = useCallback((text) => {
    setCurrentSearch(text);
    fetchSuppliers(1, pagination.limit, text);
  }, [fetchSuppliers, pagination.limit]);

  const columns = useMemo(() => [
    {
      title: 'Tên Nhà Cung Cấp',
      key: 'supplierName',
      render: (_, record) => {
        const name = record.supplierName || record.name || record.supplier?.name || 'Nhà cung cấp';
        const src = resolveUrl(record.logoUrl || record.imageUrl);
        const initialLetter = (name || 'S')[0].toUpperCase();

        return (
          <div className="flex items-center gap-2.5">
            <Avatar
              src={src}
              size={32}
              className="border border-slate-200 bg-emerald-50 text-emerald-700 font-extrabold text-xs shrink-0 shadow-2xs flex items-center justify-center"
            >
              {initialLetter}
            </Avatar>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              {name}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Sản Phẩm Liên Kết',
      key: 'product',
      render: (_, record) => {
        const prodName = record.product?.name || record.productName || (record.productId ? `Sản phẩm #${record.productId}` : 'Chưa chọn');
        const prodCode = record.productCode || record.supplierProductCode || record.code || record.product?.code || 'N/A';
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-800">{prodName}</span>
            <div className="text-[11px] text-slate-500 font-mono">Mã NCC: {prodCode}</div>
          </div>
        );
      },
    },
    {
      title: 'Giá Nhập (VND)',
      key: 'price',
      render: (_, record) => {
        const price = record.price ?? record.unitPrice ?? record.costPrice ?? 0;
        return (
          <span className="font-bold text-emerald-600 text-sm flex items-center gap-1 font-mono">
            <DollarOutlined /> {Number(price).toLocaleString('vi-VN')} đ
          </span>
        );
      },
    },
    {
      title: 'Số Lượng Tối Thiểu (Min Qty)',
      key: 'minQty',
      render: (_, record) => {
        const qty = record.minQty ?? record.minQuantity ?? record.minimumQuantity ?? 1;
        return <Tag color="blue" className="font-bold">{qty} Sản phẩm</Tag>;
      },
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined className="text-indigo-600" />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa thông tin nhà cung cấp này?" onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleOpenModal, handleDelete]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <ShopOutlined className="text-emerald-600" /> Quản Lý Nhà Cung Cấp (Supplier Info)
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Thông tin mã hàng riêng, giá nhập mua & số lượng tối thiểu từ Nhà cung cấp (`/api/v1/supplier-info`)
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchSuppliers(pagination.page, pagination.limit, currentSearch)} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Nhà Cung Cấp
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <IsolatedSearchBar onSearch={handleSearchTrigger} />

        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p, l) => fetchSuppliers(p, l, currentSearch),
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} NCC`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingSupplier ? 'Cập Nhật Thông Tin Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={550}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Sản Phẩm Phụ Tùng" name="productId" rules={[{ required: true, message: 'Vui lòng chọn sản phẩm phụ tùng!' }]}>
            <Select
              placeholder="Chọn sản phẩm phụ tùng từ hệ thống..."
              showSearch
              optionFilterProp="label"
              options={productOptions}
            />
          </Form.Item>

          <Form.Item label="Tên Nhà Cung Cấp" name="supplierName" rules={[{ required: true, message: 'Nhập tên nhà cung cấp!' }]}>
            <Input placeholder="Công ty / Tập đoàn Nhà Cung Cấp..." />
          </Form.Item>

          <Form.Item label="Logo / Hình Ảnh Nhà Cung Cấp" name="imageUrl">
            <ImageUploadInput resModel="supplier" placeholder="/uploads/suppliers/... hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <Form.Item label="Mã Sản Phẩm Riêng Của Nhà Cung Cấp" name="productCode" rules={[{ required: true, message: 'Nhập mã sản phẩm riêng!' }]}>
            <Input placeholder="SUP-VG1540080015" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Giá Nhập / Mua (VND)" name="price" rules={[{ required: true, message: 'Nhập giá!' }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={50000}
                suffix="VND"
                formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                parser={(value) => (value ? value.replace(/\./g, '') : '')}
                placeholder="Nhập giá mua..."
              />
            </Form.Item>
            <Form.Item label="Số Lượng Nhập Tối Thiểu (Min Qty)" name="minQty">
              <InputNumber style={{ width: '100%' }} min={1} placeholder="VD: 10" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Thông Tin
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierInfoPage;
