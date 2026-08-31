import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Table,
  Button,
  InputNumber,
  Tabs,
  notification,
  AutoComplete,
  Checkbox
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { purchasesApi, productsApi, supplierInfoApi } from '../api/modulesApi';
import dayjs from 'dayjs';

const CreatePurchaseModal = ({ open, onCancel, onSuccess, currentUser }) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch products and suppliers
      Promise.all([productsApi.getAll(), supplierInfoApi.getAll()])
        .then(([prodRes, supRes]) => {
          const rawProds = prodRes?.data || prodRes;
          const prodArray = Array.isArray(rawProds)
            ? rawProds
            : (Array.isArray(rawProds?.data) ? rawProds.data : (Array.isArray(rawProds?.items) ? rawProds.items : []));
          setProductsList(prodArray);

          const rawSups = supRes?.data || supRes;
          const supArray = Array.isArray(rawSups)
            ? rawSups
            : (Array.isArray(rawSups?.data) ? rawSups.data : (Array.isArray(rawSups?.items) ? rawSups.items : []));
          setSuppliersList(supArray);
        })
        .catch((err) => console.warn('Fetch references error:', err));

      form.setFieldsValue({
        dateOrder: dayjs(),
        currency: 'VND',
        origin: '',
        buyerName: currentUser?.fullName || currentUser?.name || currentUser?.email || '',
      });
      setItems([]);
    }
  }, [open, currentUser, form]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { key: Date.now() + Math.random(), productId: null, quantity: 1, uom: 'Cái', unitPrice: 0, amount: 0, isSample: false },
    ]);
  };

  const handleItemChange = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: val };
          if (field === 'productId') {
            const prod = productsList.find((p) => String(p.id) === String(val));
            if (prod) {
              updated.unitPrice = Number(prod.costPrice || prod.price || 0);
            }
          }
          if (updated.isSample) {
            updated.amount = 0;
          } else {
            updated.amount = Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (key) => {
    setItems(items.filter((i) => i.key !== key));
  };

  const subtotal = items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const taxAmount = subtotal * 0.1;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
      if (validItems.length === 0) {
        notification.error({
          message: 'Chưa chọn sản phẩm',
          description: 'Vui lòng chọn ít nhất 1 sản phẩm phụ tùng vào đơn mua!',
        });
        return;
      }

      setSubmitting(true);
      const payload = {
        supplierName: values.supplierName,
        partnerRef: values.partnerRef,
        buyerName: values.buyerName,
        origin: values.origin,
        currency: values.currency || 'VND',
        dateOrder: values.dateOrder ? values.dateOrder.toISOString() : undefined,
        datePlanned: values.datePlanned ? values.datePlanned.toISOString() : undefined,
        notes: values.notes,
        status: 'DRAFT',
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice || 0),
          amount: i.isSample ? 0 : Number(i.quantity) * Number(i.unitPrice || 0),
          uom: i.uom || 'Cái',
        })),
      };

      await purchasesApi.create(payload);
      notification.success({
        message: 'Tạo RFQ Thành Công',
        description: 'Đã tạo Yêu cầu báo giá (RFQ) mới thành công!',
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Create RFQ error:', err);
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Không thể tạo đơn mua');
      notification.error({
        message: 'Lỗi Tạo RFQ',
        description: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns = [
    {
      title: 'Phụ tùng / Sản phẩm',
      dataIndex: 'productId',
      key: 'productId',
      render: (val, record) => (
        <Select
          showSearch
          className="w-full text-xs"
          placeholder="Chọn phụ tùng từ hệ thống..."
          value={val}
          onChange={(v) => handleItemChange(record.key, 'productId', v)}
          optionFilterProp="label"
          options={productsList.map((p) => ({
            value: p.id,
            label: `[${p.defaultCode || p.brandSku || p.id}] ${p.name || p.title}`,
          }))}
        />
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (val, record) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => handleItemChange(record.key, 'quantity', v)}
          className="w-full text-xs"
        />
      ),
    },
    {
      title: 'ĐVT',
      dataIndex: 'uom',
      key: 'uom',
      width: 80,
      render: (val, record) => (
        <Input
          value={val}
          onChange={(e) => handleItemChange(record.key, 'uom', e.target.value)}
          className="text-xs"
        />
      ),
    },
    {
      title: 'Đơn giá (VND)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      render: (val, record) => (
        <InputNumber
          min={0}
          step={10000}
          className="w-full text-xs font-mono"
          value={val}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={(v) => v.replace(/\./g, '')}
          onChange={(v) => handleItemChange(record.key, 'unitPrice', v)}
        />
      ),
    },
    {
      title: 'Hàng Mẫu / Bảo Hành',
      dataIndex: 'isSample',
      key: 'isSample',
      width: 140,
      render: (val, record) => (
        <Checkbox
          checked={Boolean(val)}
          onChange={(e) => handleItemChange(record.key, 'isSample', e.target.checked)}
        >
          <span className="text-xs font-semibold text-amber-600">Bảo hành 0đ</span>
        </Checkbox>
      ),
    },
    {
      title: 'Số tiền (VND)',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (val) => (
        <span className="font-bold text-slate-800 text-xs font-mono">
          {Number(val || 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={<span className="font-bold text-slate-900 text-base">Tạo Yêu Cầu Báo Giá (RFQ) Mới</span>}
      onCancel={onCancel}
      width={960}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Lưu Yêu Cầu Báo Giá"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            label={<span className="font-bold text-slate-700">Nhà cung cấp</span>}
            name="supplierName"
            rules={[{ required: true, message: 'Nhập tên nhà cung cấp!' }]}
          >
            <AutoComplete
              placeholder="Gõ tên hoặc chọn nhà cung cấp từ hệ thống..."
              allowClear
              options={suppliersList.map((s) => ({
                value: s.supplierName || s.name,
                label: `${s.supplierName || s.name}${s.productCode ? ` (Mã NCC: ${s.productCode})` : ''}`,
              }))}
              filterOption={(inputValue, option) =>
                String(option.value || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                String(option.label || '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold text-slate-700">Hạn đặt hàng</span>} name="dateOrder">
            <DatePicker showTime className="w-full rounded-lg" format="DD/MM/YYYY HH:mm" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Form.Item label={<span className="font-bold text-slate-700">Mã nhà cung cấp (Partner Ref)</span>} name="partnerRef">
            <Input placeholder="Ví dụ: TV 30/07/25" />
          </Form.Item>
          <Form.Item label={<span className="font-bold text-slate-700">Ngày hàng về dự kiến</span>} name="datePlanned">
            <DatePicker className="w-full rounded-lg" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label={<span className="font-bold text-slate-700">Tiền tệ</span>} name="currency">
            <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
          </Form.Item>
        </div>

        <Tabs
          items={[
            {
              key: 'items',
              label: <span className="font-bold">Sản phẩm</span>,
              children: (
                <div>
                  <Table
                    dataSource={items}
                    columns={itemColumns}
                    pagination={false}
                    size="small"
                    bordered
                  />
                  <Button
                    type="dashed"
                    onClick={handleAddItem}
                    block
                    icon={<PlusOutlined />}
                    className="mt-3 font-semibold text-xs"
                  >
                    Thêm sản phẩm
                  </Button>

                  <div className="flex justify-end mt-4">
                    <div className="text-right space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 w-72">
                      <div className="text-slate-600 text-xs flex justify-between">
                        <span>Số tiền trước thuế:</span>
                        <strong className="text-slate-900 font-mono">{subtotal.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div className="text-slate-600 text-xs flex justify-between">
                        <span>Thuế GTGT (10%):</span>
                        <strong className="text-slate-900 font-mono">{taxAmount.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div className="text-sm font-bold text-indigo-700 flex justify-between pt-1 border-t border-slate-200">
                        <span>Tổng tiền:</span>
                        <span className="font-mono text-base">{totalAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'other',
              label: <span className="font-bold">Thông tin khác</span>,
              children: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label={<span className="font-bold text-slate-700">Bên mua (Người phụ trách)</span>} name="buyerName">
                    <Input placeholder="Tên nhân viên phụ trách..." />
                  </Form.Item>

                  <Form.Item label={<span className="font-bold text-slate-700">Chứng từ gốc</span>} name="origin">
                    <Input placeholder="Bổ sung thủ công" />
                  </Form.Item>

                  <div className="sm:col-span-2">
                    <Form.Item label={<span className="font-bold text-slate-700">Ghi chú thêm</span>} name="notes">
                      <Input.TextArea rows={3} placeholder="Nhập ghi chú yêu cầu báo giá..." />
                    </Form.Item>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default CreatePurchaseModal;
