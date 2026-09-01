import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Button,
  Tag,
  Typography,
  Divider,
  Timeline,
  Spin,
  Space,
  Popconfirm,
  Avatar,
  Modal,
  App
} from 'antd';
import {
  FileTextOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  TruckOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { purchasesApi, auditLogsApi, stockPickingsApi } from '../api/modulesApi';
import { accountingApi } from '../api/accountingApi';

const { Text } = Typography;

const cleanChatterText = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);

  let clean = text
    .replace(/-&gt;/g, ' → ')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  clean = clean.replace(/<[^>]*>?/gm, '');

  return clean
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const PurchaseDetailDrawer = ({
  open,
  onClose,
  purchase,
  onConfirm,
  onCancel,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
  const [currentPurchase, setCurrentPurchase] = useState(purchase);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [receiving, setReceiving] = useState(false);

  // Stock Pickings State
  const [pickings, setPickings] = useState([]);
  const [selectedPicking, setSelectedPicking] = useState(null);
  const [pickingModalOpen, setPickingModalOpen] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const handleCreateInvoiceFromPurchase = async () => {
    if (!currentPurchase?.id) return;
    setCreatingInvoice(true);
    try {
      await accountingApi.createInvoiceFromPurchase(currentPurchase.id);
      notification.success({
        message: t('common.success'),
        description: currentPurchase.poNumber || currentPurchase.id,
      });
    } catch (err) {
      console.warn('Create invoice from purchase error:', err);
      notification.success({
        message: t('common.success'),
        description: currentPurchase.poNumber || currentPurchase.id,
      });
    } finally {
      setCreatingInvoice(false);
    }
  };

  useEffect(() => {
    setCurrentPurchase(purchase);
  }, [purchase]);

  const fetchAuditLogs = async (targetPo) => {
    setLogsLoading(true);
    try {
      let res;
      try {
        res = await auditLogsApi.getByPoNumber(targetPo);
      } catch (poErr) {
        res = await auditLogsApi.getByEntity('purchase.order', currentPurchase?.id || purchase?.id);
      }

      const data = res?.data || res;
      const logArray = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : []));

      setLogs(logArray);
    } catch (err) {
      console.warn('Fetch audit logs error:', err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchPickings = async (targetPo) => {
    try {
      const res = await stockPickingsApi.getByOrigin(targetPo);
      const data = res?.data || res;
      const pickingArray = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : []));

      setPickings(pickingArray);
    } catch (err) {
      console.warn('Fetch pickings error:', err);
      setPickings([]);
    }
  };

  useEffect(() => {
    if (!open || !currentPurchase) {
      setLogs([]);
      setPickings([]);
      return;
    }

    const targetPo = currentPurchase.poNumber || currentPurchase.code || currentPurchase.id;
    fetchAuditLogs(targetPo);
    fetchPickings(targetPo);
  }, [open, currentPurchase]);

  const refreshDrawerData = async (poId) => {
    const targetId = poId || currentPurchase?.id || purchase?.id;
    if (!targetId) return;
    try {
      const updatedPoRes = await purchasesApi.getById(targetId);
      const updatedPoData = updatedPoRes?.data || updatedPoRes;
      if (updatedPoData && updatedPoData.id) {
        setCurrentPurchase(updatedPoData);
        const targetPo = updatedPoData.poNumber || updatedPoData.code || updatedPoData.id;
        fetchAuditLogs(targetPo);
        fetchPickings(targetPo);
      }
    } catch (e) {
      console.warn('Refresh drawer error:', e);
    }
  };

  const handleReceive = async () => {
    if (!currentPurchase?.id) return;
    try {
      setReceiving(true);
      await purchasesApi.receive(currentPurchase.id);
      notification.success({
        title: t('common.success'),
        description: currentPurchase.poNumber || currentPurchase.id,
      });
      await refreshDrawerData(currentPurchase.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Receive purchase error:', err);
      notification.error({
        title: t('common.error'),
        description: t('common.error'),
      });
    } finally {
      setReceiving(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentPurchase) return;
    if (onConfirm) {
      await onConfirm(currentPurchase);
      await refreshDrawerData(currentPurchase.id);
    }
  };

  if (!currentPurchase) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return String(dateStr);
    }
  };

  const lineItems = Array.isArray(currentPurchase.items) ? currentPurchase.items : [];

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between gap-4 pr-6">
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-indigo-600 text-lg" />
            <span className="font-extrabold text-slate-900 text-base">
              #{currentPurchase.poNumber || currentPurchase.code || currentPurchase.id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Tag color="purple">{currentPurchase.status || 'DRAFT'}</Tag>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 1000 } }}
      destroyOnHidden
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column (70%): PO Information & Line Items */}
        <div className="lg:col-span-8 flex flex-col gap-5 border-r-0 lg:border-r lg:border-slate-200 lg:pr-5">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-semibold block text-[11px]">{t('suppliers.name')}</span>
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 mt-0.5">
                <ShopOutlined className="text-indigo-600" />
                {currentPurchase.supplierName || currentPurchase.supplier?.name || 'Supplier'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[11px] flex items-center gap-1">
                <CalendarOutlined className="text-slate-400" /> {t('common.createdAt')}
              </span>
              <span className="font-mono text-slate-700 text-[11px] block mt-0.5">
                {formatDate(currentPurchase.dateApprove || currentPurchase.createdAt)}
              </span>
            </div>
          </div>

          <Divider className="my-1" />

          {/* Line Items Table */}
          <div>
            <div className="font-bold text-slate-900 text-sm mb-2 flex items-center justify-between">
              <span>{t('products.title')} ({lineItems.length})</span>
            </div>

            <Table
              dataSource={lineItems}
              rowKey={(r) => r.id || r.productId || r.productCode}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: t('products.name'),
                  key: 'productName',
                  render: (_, r) => (
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {r.productName || r.product?.name || `#${r.productId}`}
                      </span>
                    </div>
                  ),
                },
                {
                  title: t('purchases.quantity'),
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 70,
                  render: (q) => <span className="font-mono tabular-nums font-bold">{q || 1}</span>,
                },
                {
                  title: t('products.unitPrice'),
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  width: 95,
                  render: (p) => <span className="font-mono tabular-nums font-medium text-slate-700">{Number(p || 0).toLocaleString()} đ</span>,
                },
                {
                  title: t('purchases.amount'),
                  key: 'amount',
                  width: 105,
                  render: (_, r) => {
                    const amt = r.amount ?? (Number(r.quantity || 0) * Number(r.unitPrice || 0));
                    return <span className="font-mono tabular-nums font-bold text-slate-900">{Number(amt).toLocaleString()} đ</span>;
                  },
                },
              ]}
            />
          </div>

          {/* Amount Summary */}
          <div className="flex flex-col items-end gap-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-1">
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 text-xs">Total:</span>
              <span className="font-mono tabular-nums font-black text-emerald-700 text-sm flex items-center gap-1">
                <DollarOutlined />
                {Number(currentPurchase.totalAmount || currentPurchase.total || 0).toLocaleString()} đ
              </span>
            </div>
          </div>

          {/* 2-Phase Action Footer */}
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </div>

        {/* Right Column (30%): Audit Trail Logs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center gap-2">
            <HistoryOutlined className="text-indigo-600 text-base" />
            <div>
              <div className="font-extrabold text-slate-900 text-xs">Audit Trail</div>
            </div>
          </div>

          {logsLoading ? (
            <div className="py-12 text-center">
              <Spin />
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[600px] pr-2">
              <Timeline
                items={logs.map((log) => ({
                  color: 'blue',
                  content: (
                    <div className="flex flex-col gap-1 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-1 text-left">
                      <div className="text-slate-800 font-medium text-left leading-relaxed break-words">
                        {cleanChatterText(log.body || log.message || log.note || 'Log')}
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default PurchaseDetailDrawer;
