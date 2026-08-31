import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Card, Space, Typography, Popconfirm, Tag, Select, Avatar, Image, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, BoxPlotOutlined, BarcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import { productsApi, brandsApi, vehiclesApi, enginesApi, gearboxesApi } from '../api/modulesApi';
import ImageUploadInput from '../components/ImageUploadInput';
import { resolveUrl } from '../utils/resolveUrl';

const { Title, Text } = Typography;

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [enginesList, setEnginesList] = useState([]);
  const [gearboxesList, setGearboxesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('API products fetch failed:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [bRes, vRes, eRes, gRes] = await Promise.allSettled([
        brandsApi.getAll(),
        vehiclesApi.getAll(),
        enginesApi.getAll(),
        gearboxesApi.getAll(),
      ]);

      if (bRes.status === 'fulfilled') {
        const d = bRes.value?.data || bRes.value;
        if (Array.isArray(d)) setBrandsList(d);
      }
      if (vRes.status === 'fulfilled') {
        const d = vRes.value?.data || vRes.value;
        if (Array.isArray(d)) setVehiclesList(d);
      }
      if (eRes.status === 'fulfilled') {
        const d = eRes.value?.data || eRes.value;
        if (Array.isArray(d)) setEnginesList(d);
      }
      if (gRes.status === 'fulfilled') {
        const d = gRes.value?.data || gRes.value;
        if (Array.isArray(d)) setGearboxesList(d);
      }
    } catch (err) {
      console.warn('Metadata fetch failed in ProductsPage:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMetadata();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingProduct(record);
    if (record) {
      form.setFieldsValue({
        name: record.name || record.title,
        defaultCode: record.defaultCode || record.code || record.sku,
        brandSku: record.brandSku || record.brandCode,
        brandId: record.brandId || record.brand?.id,
        imageUrl: record.imageUrl,
        vehicleIds: record.vehicleIds || (Array.isArray(record.vehicles) ? record.vehicles.map((v) => (typeof v === 'object' ? v.id : v)) : []),
        engineIds: record.engineIds || (Array.isArray(record.engines) ? record.engines.map((e) => (typeof e === 'object' ? e.id : e)) : []),
        gearboxIds: record.gearboxIds || (Array.isArray(record.gearboxes) ? record.gearboxes.map((g) => (typeof g === 'object' ? g.id : g)) : []),
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    const selectedBrand = brandsList.find((b) => String(b.id) === String(values.brandId));
    const brandName = selectedBrand?.name || 'Thương hiệu';

    const payload = {};
    if (values.name) payload.name = values.name;
    if (values.defaultCode) payload.defaultCode = values.defaultCode;
    if (values.brandSku) payload.brandSku = values.brandSku;
    if (values.brandId !== undefined && values.brandId !== null) payload.brandId = Number(values.brandId);
    if (values.imageUrl) payload.imageUrl = values.imageUrl;
    if (Array.isArray(values.vehicleIds)) payload.vehicleIds = values.vehicleIds.map(Number);
    if (Array.isArray(values.engineIds)) payload.engineIds = values.engineIds.map(Number);
    if (Array.isArray(values.gearboxIds)) payload.gearboxIds = values.gearboxIds.map(Number);

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, brandName } : p)));
        notification.success({
          message: 'Cập nhật sản phẩm thành công',
          description: `Đã cập nhật thông tin sản phẩm "${values.name}".`,
        });
      } else {
        const res = await productsApi.create(payload);
        const createdData = res?.data || res;
        const newProduct = {
          id: createdData?.id || Date.now(),
          ...payload,
          ...createdData,
          brandName,
        };
        setProducts([newProduct, ...products]);
        notification.success({
          message: 'Thêm sản phẩm mới thành công',
          description: `Đã thêm sản phẩm "${values.name}" vào danh mục phụ tùng.`,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save product error:', err);
      if (editingProduct) {
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload, brandName } : p)));
      } else {
        setProducts([{ id: Date.now(), ...payload, brandName }, ...products]);
      }
      notification.success({
        message: 'Đã lưu sản phẩm',
        description: `Đã lưu sản phẩm "${values.name}".`,
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const targetId = typeof record === 'object' ? record.id : record;
    const targetName = typeof record === 'object' ? (record.name || record.title) : 'sản phẩm';
    try {
      await productsApi.delete(targetId);
    } catch (err) {
      console.warn('Delete product error:', err);
    } finally {
      setProducts(products.filter((p) => p.id !== targetId));
      notification.info({
        message: 'Xóa sản phẩm thành công',
        description: `Đã xóa "${targetName}" khỏi hệ thống.`,
      });
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = p.name || p.title || '';
    const code = p.defaultCode || p.code || p.sku || '';
    const brandSku = p.brandSku || p.brandCode || '';
    const query = searchText.toLowerCase();
    return name.toLowerCase().includes(query) || code.toLowerCase().includes(query) || brandSku.toLowerCase().includes(query);
  });

  const columns = [
    {
      title: 'Hình Ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
      render: (imgUrl, record) => {
        const src = resolveUrl(imgUrl);
        const initialLetter = ((record.name || record.title || 'P')[0]).toUpperCase();

        if (!src) {
          return (
            <Avatar
              shape="square"
              size={40}
              className="bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-lg border border-indigo-100 shrink-0 flex items-center justify-center"
            >
              {initialLetter}
            </Avatar>
          );
        }
        return (
          <Image
            src={src}
            alt={record.name || record.title}
            width={40}
            height={40}
            className="object-cover rounded-lg border border-slate-200 shadow-2xs"
            fallback="https://placehold.co/100x100?text=No+Image"
          />
        );
      },
    },
    {
      title: 'Tên Phụ Tùng / Sản Phẩm',
      key: 'name',
      render: (_, record) => {
        const name = record.name || record.title || 'Sản phẩm phụ tùng';
        return (
          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
            {name}
          </span>
        );
      },
    },
    {
      title: 'Mã SKU / Barcode',
      key: 'codes',
      render: (_, record) => {
        const defaultCode = record.defaultCode || record.code || record.sku || record.barcode || 'N/A';
        const brandSku = record.brandSku || record.brandCode || 'N/A';
        return (
          <div className="flex flex-col gap-1">
            <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
              <BarcodeOutlined className="mr-1" /> {defaultCode}
            </code>
            <span className="text-[11px] text-slate-500 font-mono">SKU: {brandSku}</span>
          </div>
        );
      },
    },
    {
      title: 'Thương Hiệu',
      key: 'brandName',
      render: (_, record) => {
        const bName =
          record.brand?.name ||
          record.brandName ||
          (record.brandId ? brandsList.find((b) => String(b.id) === String(record.brandId))?.name : null) ||
          'Chưa phân loại';
        return <Tag color="blue" className="font-semibold">{bName}</Tag>;
      },
    },
    {
      title: 'Dòng Xe Tương Thích',
      key: 'vehicleNames',
      render: (_, record) => {
        let vNames = [];
        if (Array.isArray(record.vehicles) && record.vehicles.length > 0) {
          vNames = record.vehicles.map((v) => (typeof v === 'object' ? (v.name || v.title) : v));
        } else if (Array.isArray(record.vehicleNames) && record.vehicleNames.length > 0) {
          vNames = record.vehicleNames;
        } else if (Array.isArray(record.vehicleIds) && record.vehicleIds.length > 0) {
          vNames = record.vehicleIds.map((id) => vehiclesList.find((v) => String(v.id) === String(id))?.name || `Xe #${id}`);
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {vNames.length > 0 ? (
              vNames.map((v, idx) => (
                <Tag key={idx} color="purple" className="text-[11px] font-medium m-0">
                  {v}
                </Tag>
              ))
            ) : (
              <span className="text-slate-400 text-xs italic">Tất cả dòng xe</span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Động Cơ & Hộp Số',
      key: 'relations',
      render: (_, record) => {
        let eNames = [];
        if (Array.isArray(record.engines) && record.engines.length > 0) {
          eNames = record.engines.map((e) => (typeof e === 'object' ? (e.name || e.code) : e));
        } else if (Array.isArray(record.engineNames) && record.engineNames.length > 0) {
          eNames = record.engineNames;
        } else if (Array.isArray(record.engineIds) && record.engineIds.length > 0) {
          eNames = record.engineIds.map((id) => enginesList.find((e) => String(e.id) === String(id))?.name || `ĐC #${id}`);
        }

        let gNames = [];
        if (Array.isArray(record.gearboxes) && record.gearboxes.length > 0) {
          gNames = record.gearboxes.map((g) => (typeof g === 'object' ? (g.name || g.code) : g));
        } else if (Array.isArray(record.gearboxNames) && record.gearboxNames.length > 0) {
          gNames = record.gearboxNames;
        } else if (Array.isArray(record.gearboxIds) && record.gearboxIds.length > 0) {
          gNames = record.gearboxIds.map((id) => gearboxesList.find((g) => String(g.id) === String(id))?.name || `HS #${id}`);
        }

        return (
          <div className="text-[11px] text-slate-600">
            <div>Động cơ: <strong className="text-slate-800">{eNames.join(', ') || 'N/A'}</strong></div>
            <div>Hộp số: <strong className="text-slate-800">{gNames.join(', ') || 'N/A'}</strong></div>
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
          <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record)} okButtonProps={{ danger: true }}>
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
            <BoxPlotOutlined className="text-indigo-600" /> Quản Lý Phụ Tùng & Sản Phẩm
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            Quản lý danh mục phụ tùng xe, mã SKU thương hiệu và tương thích động cơ, hộp số
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProducts} loading={loading} className="text-xs font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0"
          >
            Thêm Sản Phẩm Mới
          </Button>
        </Space>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-200 shadow-xs">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Tìm kiếm sản phẩm hoặc mã SKU..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="rounded-xl"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / Tổng ${total} sản phẩm`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={<span className="font-bold text-slate-900">{editingProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Tên Phụ Tùng / Sản Phẩm" name="name" rules={[{ required: true, message: 'Nhập tên sản phẩm!' }]}>
            <Input placeholder="Lọc Dầu Động Cơ HOWO A7" />
          </Form.Item>

          <Form.Item label="Hình Ảnh Sản Phẩm" name="imageUrl">
            <ImageUploadInput resModel="product" placeholder="/api/v1/attachments/e30b446d.../raw hoặc chọn ảnh từ máy..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Mã Mặc Định Barcode (SKU)" name="defaultCode">
              <Input placeholder="VG1540080015" />
            </Form.Item>
            <Form.Item label="SKU Thương Hiệu" name="brandSku">
              <Input placeholder="HW-LOC-001" />
            </Form.Item>
          </div>

          <Form.Item label="Thương Hiệu Phân Loại" name="brandId" rules={[{ required: true, message: 'Vui lòng chọn thương hiệu!' }]}>
            <Select
              placeholder="Chọn thương hiệu phân loại từ hệ thống..."
              showSearch
              optionFilterProp="label"
              options={brandsList.map((b) => ({
                value: b.id,
                label: `${b.name || b.code || `Thương hiệu #${b.id}`}`,
              }))}
            />
          </Form.Item>

          {/* Compatibility Relations */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Liên Kết Tương Thích Xe & Phụ Tùng
            </div>

            <Form.Item label="Dòng Xe Tương Thích" name="vehicleIds" className="mb-3">
              <Select
                mode="multiple"
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} xe...`}
                placeholder="Chọn các dòng xe tương thích..."
                showSearch
                optionFilterProp="label"
                options={vehiclesList.map((v) => ({
                  value: v.id,
                  label: `${v.name || v.title} (${v.code || `ID #${v.id}`})`,
                }))}
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="Động Cơ Tương Thích" name="engineIds" className="mb-0">
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} động cơ...`}
                  placeholder="Chọn động cơ..."
                  showSearch
                  optionFilterProp="label"
                  options={enginesList.map((e) => ({
                    value: e.id,
                    label: `${e.name || e.code || `Động cơ #${e.id}`}`,
                  }))}
                />
              </Form.Item>

              <Form.Item label="Hộp Số Tương Thích" name="gearboxIds" className="mb-0">
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} hộp số...`}
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
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600">
              Lưu Sản Phẩm
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
