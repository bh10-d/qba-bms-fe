import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Typography, Tag, notification } from 'antd';
import { QrcodeOutlined, PrinterOutlined, BarcodeOutlined, SendOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { labelsApi, productsApi } from '../api/modulesApi';

const { Title, Text } = Typography;

const LabelWizardPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLabel, setGeneratedLabel] = useState(null);
  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productsApi.getAll();
        const data = res?.data || res;
        if (Array.isArray(data)) {
          setProductsList(data);
        }
      } catch (err) {
        console.warn('API products fetch for LabelWizard failed:', err);
      }
    };
    fetchProducts();
  }, []);

  const handleGenerateLabel = async (values) => {
    setIsGenerating(true);
    setGeneratedLabel(null);

    const selectedProd = productsList.find((p) => String(p.id) === String(values.productId));
    const productName = values.customName || selectedProd?.name || selectedProd?.title || 'Phụ Tùng';

    try {
      const res = await labelsApi.createLabel(values);
      const data = res?.data || res;
      setGeneratedLabel(data);
      notification.success({
        message: t('common.success'),
        description: productName,
      });
    } catch (err) {
      console.warn('Label API offline, using fallback label generator:', err);
      setGeneratedLabel({
        productId: values.productId,
        supplierProductCode: values.supplierProductCode || selectedProd?.code || 'SUP-VG1540080015',
        customName: productName,
        nhapDate: values.nhapDate || new Date().toLocaleDateString(),
        dinhLuong: values.dinhLuong || '1 Pc / Box',
        barcode: `8938500${values.productId || 101}`,
      });
      notification.success({
        message: t('common.success'),
        description: productName,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <QrcodeOutlined className="text-indigo-600" /> {t('labels.title')}
          </h2>
          <Text className="text-slate-500 text-xs mt-1 block">
            {t('labels.previewTitle')}
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          disabled={!generatedLabel}
          className="bg-indigo-600 hover:bg-indigo-500 font-bold shadow-sm shadow-indigo-100 text-xs border-0 w-full md:w-auto"
        >
          {t('labels.print')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Wizard */}
        <Card title={<span className="font-bold text-slate-900">{t('labels.selectProduct')}</span>} className="rounded-xl border-slate-200">
          <Form form={form} layout="vertical" onFinish={handleGenerateLabel} initialValues={{ dinhLuong: '1 Pc / Box' }}>
            <Form.Item label={t('products.name')} name="productId" rules={[{ required: true, message: t('common.required') }]}>
              <Select
                placeholder={t('common.select')}
                showSearch
                optionFilterProp="label"
                options={productsList.map((p) => ({
                  value: p.id,
                  label: `${p.name || p.title} (${p.code || p.sku || `ID #${p.id}`})`,
                }))}
              />
            </Form.Item>

            <Form.Item label={t('products.brandSku')} name="supplierProductCode">
              <Input placeholder="SUP-VG1540080015" />
            </Form.Item>

            <Form.Item label={t('products.name')} name="customName">
              <Input placeholder="ENGINE OIL FILTER HOWO A7" />
            </Form.Item>

            <Form.Item label={t('labels.format')} name="dinhLuong">
              <Input placeholder="1 Pc / Box" />
            </Form.Item>

            <Form.Item label={t('common.createdAt')} name="nhapDate" initialValue="2026-09-01">
              <Input placeholder="2026-09-01" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SendOutlined />}
              loading={isGenerating}
              block
              className="bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-md shadow-indigo-100 mt-2"
            >
              {t('labels.generate')}
            </Button>
          </Form>
        </Card>

        {/* Printable Label Output Preview */}
        <Card title={<span className="font-bold text-slate-900">{t('labels.previewTitle')}</span>} className="rounded-xl border-slate-200 flex flex-col justify-between">
          {generatedLabel ? (
            <div className="p-6 bg-white border-2 border-slate-900 rounded-xl shadow-md max-w-md mx-auto my-auto flex flex-col gap-4 font-sans text-slate-900">
              {/* Top Header Label */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                    QBA
                  </div>
                  <div>
                    <div className="font-black text-sm tracking-tight leading-tight">QBA SPARE PARTS</div>
                    <div className="text-[9px] font-bold text-slate-600 uppercase">Original Auto Parts</div>
                  </div>
                </div>
                <Tag color="black" className="m-0 font-extrabold text-[10px]">
                  ORIGINAL
                </Tag>
              </div>

              {/* Product Info */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('products.name')}:</span>
                <div className="font-black text-base leading-snug uppercase text-slate-900">
                  {generatedLabel.customName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-300 py-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">{t('products.brandSku')}:</span>
                  <span className="font-bold font-mono text-slate-800">{generatedLabel.supplierProductCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">{t('labels.format')}:</span>
                  <span className="font-bold text-slate-800">{generatedLabel.dinhLuong}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">{t('common.createdAt')}:</span>
                  <span className="font-bold text-slate-800">{generatedLabel.nhapDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Standard:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <SafetyCertificateOutlined /> ISO 9001
                  </span>
                </div>
              </div>

              {/* Barcode Mockup */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="flex items-center gap-1 mb-1">
                  <BarcodeOutlined className="text-4xl text-slate-900" />
                  <QrcodeOutlined className="text-4xl text-slate-900" />
                </div>
                <div className="font-mono font-bold text-xs tracking-widest text-slate-900">
                  *{generatedLabel.barcode || '8938500101'}*
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <BarcodeOutlined className="text-5xl text-slate-300" />
              <span className="text-sm font-medium">{t('labels.generate')}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LabelWizardPage;
