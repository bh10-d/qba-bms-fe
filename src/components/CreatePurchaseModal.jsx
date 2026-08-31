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
  AutoComplete,
  Checkbox,
  Tooltip,
  App
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { purchasesApi, productsApi, supplierInfoApi } from '../api/modulesApi';
import dayjs from 'dayjs';
import CurrencyInputNumber from './CurrencyInputNumber';

const CreatePurchaseModal = ({ open, onCancel, onSuccess, currentUser }) => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
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
      { key: Date.now() + Math.random(), productId: null, quantity: 1, uom: 'PCS', unitPrice: 0, amount: 0, isSample: false },
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
          title: t('common.error'),
          description: t('common.error'),
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
          uom: i.uom || 'PCS',
        })),
      };

      await purchasesApi.create(payload);
      notification.success({
        title: t('common.success'),
        description: t('purchases.title'),
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Create RFQ error:', err);
      notification.error({
        title: t('common.error'),
        description: t('common.error'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns = [
    {
      title: t('products.name'),
      dataIndex: 'productId',
      key: 'productId',
      width: 280,
      render: (val, record) => (
        <div className="w-full min-w-0">
          <Select
            showSearch
            className="w-full min-w-0 text-xs"
            placeholder={t('common.select')}
            value={val}
            onChange={(v) => handleItemChange(record.key, 'productId', v)}
            optionFilterProp="label"
            options={productsList.map((p) => ({
              value: p.id,
              label: `[${p.defaultCode || p.brandSku || p.id}] ${p.name || p.title}`,
            }))}
            labelRender={(option) => (
              <Tooltip title={option.label} placement="top">
                <span className="truncate block w-full text-xs">{option.label}</span>
              </Tooltip>
            )}
          />
        </div>
      ),
    },
    {
      title: t('purchases.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 85,
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
      title: t('products.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 140,
      render: (val, record) => (
        <CurrencyInputNumber
          min={0}
          step={10000}
          className="w-full text-xs"
          value={val}
          onChange={(v) => handleItemChange(record.key, 'unitPrice', v)}
        />
      ),
    },
    {
      title: t('purchases.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (val) => (
        <span className="font-bold text-slate-800 text-xs font-mono tabular-nums whitespace-nowrap">
          {Number(val || 0).toLocaleString()} đ
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Tooltip title={t('common.delete')}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveItem(record.key)}
            aria-label={t('common.delete')}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={<span className="font-bold text-slate-900 text-base">{t('purchases.createNew')}</span>}
      onCancel={onCancel}
      width={960}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            label={<span className="font-bold text-slate-700">{t('suppliers.title')}</span>}
            name="supplierName"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <AutoComplete
              placeholder={t('common.select')}
              allowClear
              options={suppliersList.reduce((acc, s) => {
                const val = s.supplierName || s.name;
                if (val && !acc.some((item) => item.value === val)) {
                  acc.push({
                    value: val,
                    label: `${val}${s.productCode ? ` (${s.productCode})` : ''}`,
                  });
                }
                return acc;
              }, [])}
              filterOption={(inputValue, option) =>
                String(option.value || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                String(option.label || '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold text-slate-700">{t('common.createdAt')}</span>} name="dateOrder">
            <DatePicker showTime className="w-full rounded-lg" format="DD/MM/YYYY HH:mm" />
          </Form.Item>
        </div>

        <Tabs
          items={[
            {
              key: 'items',
              label: <span className="font-bold">{t('products.title')}</span>,
              children: (
                <div>
                  <Table
                    tableLayout="fixed"
                    dataSource={items}
                    columns={itemColumns}
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ x: 940 }}
                  />
                  <Button
                    type="dashed"
                    onClick={handleAddItem}
                    block
                    icon={<PlusOutlined />}
                    className="mt-3 font-semibold text-xs"
                  >
                    {t('purchases.createNew')}
                  </Button>

                  <div className="flex justify-end mt-4">
                    <div className="text-right space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 w-72">
                      <div className="text-slate-600 text-xs flex justify-between">
                        <span>Subtotal:</span>
                        <strong className="text-slate-900 font-mono tabular-nums">{subtotal.toLocaleString()} đ</strong>
                      </div>
                      <div className="text-sm font-bold text-indigo-700 flex justify-between pt-1 border-t border-slate-200">
                        <span>Total:</span>
                        <span className="font-mono tabular-nums text-base">{totalAmount.toLocaleString()} đ</span>
                      </div>
                    </div>
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
