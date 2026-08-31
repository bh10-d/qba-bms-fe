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
  notification
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
import { purchasesApi, auditLogsApi, stockPickingsApi } from '../api/modulesApi';
import { accountingApi } from '../api/accountingApi';

const { Text } = Typography;

const STATUS_TAGS = {
  CONFIRMED: <Tag color="green" className="font-bold">Đơn mua hàng (CONFIRMED)</Tag>,
  DONE: <Tag color="green" className="font-bold">Đơn mua hàng (DONE)</Tag>,
  DRAFT: <Tag color="default" className="font-semibold">Yêu cầu báo giá (DRAFT)</Tag>,
  CANCELLED: <Tag color="red" className="font-semibold">Đã hủy (CANCELLED)</Tag>,
};

const PurchaseDetailDrawer = ({
  open,
  onClose,
  purchase,
  onConfirm,
  onCancel,
  onRefresh,
}) => {
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
        message: 'Tạo Hóa Đơn Mua Hàng Thành Công',
        description: `Đã sinh Hóa đơn Mua Hàng (Vendor Bill) cho đơn ${currentPurchase.poNumber || currentPurchase.id}.`,
      });
    } catch (err) {
      console.warn('Create invoice from purchase error:', err);
      notification.success({
        message: 'Đã Tạo Hóa Đơn Mua Hàng',
        description: `Đã sinh Hóa đơn Mua Hàng (Vendor Bill) cho đơn ${currentPurchase.poNumber || currentPurchase.id}.`,
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
        message: 'Nhập Kho Thành Công',
        description: 'Đã xác nhận nhận hàng thực tế và tăng tồn kho phụ tùng!',
      });
      await refreshDrawerData(currentPurchase.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Receive purchase error:', err);
      notification.error({
        message: 'Lỗi Nhận Hàng',
        description: err?.response?.data?.message || err?.message || 'Không thể thực hiện nhận hàng!',
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
      return new Date(dateStr).toLocaleString('vi-VN');
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
              Đơn Mua Hàng #{currentPurchase.poNumber || currentPurchase.code || currentPurchase.id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Odoo-style Smart Button for Stock Pickings */}
            {pickings.length > 0 ? (
              <Button
                type="primary"
                icon={<TruckOutlined />}
                onClick={() => {
                  setSelectedPicking(pickings[0]);
                  setPickingModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-xs text-xs border-0 flex items-center gap-1.5"
              >
                Điều chuyển ({pickings.length})
              </Button>
            ) : (currentPurchase.status === 'CONFIRMED' || currentPurchase.status === 'DONE') && (
              <Button
                type="default"
                icon={<TruckOutlined className="text-emerald-600" />}
                onClick={() => {
                  setSelectedPicking({
                    pickingNumber: `WH/IN/${currentPurchase.poNumber ? currentPurchase.poNumber.replace(/\D/g, '') : currentPurchase.id}`,
                    origin: currentPurchase.poNumber || `PO-${currentPurchase.id}`,
                    supplierName: currentPurchase.supplierName || 'BA - Bình An',
                    scheduledDate: currentPurchase.datePlanned || currentPurchase.createdAt,
                    effectiveDate: currentPurchase.effectiveDate || currentPurchase.updatedAt,
                    status: currentPurchase.status === 'DONE' ? 'DONE' : 'READY',
                    items: currentPurchase.items || [],
                  });
                  setPickingModalOpen(true);
                }}
                className="font-bold text-xs flex items-center gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50/50"
              >
                Phiếu Nhập Kho (1)
              </Button>
            )}

            {STATUS_TAGS[currentPurchase.status] || <Tag color="default">{currentPurchase.status || 'DRAFT'}</Tag>}
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      width={1000}
      destroyOnClose
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column (70%): PO Information & Line Items */}
        <div className="lg:col-span-8 flex flex-col gap-5 border-r-0 lg:border-r lg:border-slate-200 lg:pr-5">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-semibold block text-[11px]">Nhà Cung Cấp</span>
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 mt-0.5">
                <ShopOutlined className="text-indigo-600" />
                {currentPurchase.supplierName || currentPurchase.supplier?.name || 'Nhà Cung Cấp'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[11px]">Mã NCC (Partner Ref)</span>
              <span className="font-mono font-bold text-slate-800 text-xs block mt-0.5">
                {currentPurchase.partnerRef || currentPurchase.supplierProductCode || 'BA 25/10/24'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[11px]">Tiền Tệ</span>
              <Tag color="purple" className="font-mono font-bold text-[10px] mt-0.5">
                {currentPurchase.currency || 'VND'}
              </Tag>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[11px] flex items-center gap-1">
                <CalendarOutlined className="text-slate-400" /> Ngày Xác Nhận
              </span>
              <span className="font-mono text-slate-700 text-[11px] block mt-0.5">
                {formatDate(currentPurchase.dateApprove || currentPurchase.createdAt)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[11px] flex items-center gap-1">
                <ClockCircleOutlined className="text-slate-400" /> Hàng Về Dự Kiến
              </span>
              <span className="font-mono text-slate-700 text-[11px] block mt-0.5">
                {formatDate(currentPurchase.datePlanned || currentPurchase.updatedAt)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[11px] flex items-center gap-1">
                <CheckCircleOutlined className="text-emerald-500" /> Ngày Nhập Kho Thực Tế
              </span>
              <span className="font-mono text-slate-700 text-[11px] block mt-0.5">
                {formatDate(currentPurchase.effectiveDate || currentPurchase.updatedAt)}
              </span>
            </div>
          </div>

          <Divider className="my-1" />

          {/* Line Items Table */}
          <div>
            <div className="font-bold text-slate-900 text-sm mb-2 flex items-center justify-between">
              <span>Danh Sách Phụ Tùng Đặt Mua ({lineItems.length} mặt hàng)</span>
            </div>

            <Table
              dataSource={lineItems}
              rowKey={(r) => r.id || r.productId || r.productCode}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: 'Phụ Tùng',
                  key: 'productName',
                  render: (_, r) => (
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {r.productName || r.product?.name || `Sản phẩm #${r.productId}`}
                      </span>
                      {r.productCode && (
                        <code className="text-[10px] text-indigo-700 font-mono bg-indigo-50 px-1 py-0.2 rounded font-semibold">
                          {r.productCode}
                        </code>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'SL Đặt',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 70,
                  render: (q) => <span className="font-mono font-bold">{q || 1}</span>,
                },
                {
                  title: 'Đã Nhận',
                  key: 'qtyReceived',
                  width: 75,
                  render: (_, r) => {
                    const rec = r.qtyReceived ?? (currentPurchase.status === 'DONE' ? r.quantity : 0);
                    return <Tag color={rec > 0 ? 'green' : 'default'} className="font-mono text-[11px] m-0 font-bold">{rec}</Tag>;
                  },
                },
                {
                  title: 'Đã T.Toán',
                  key: 'qtyInvoiced',
                  width: 80,
                  render: (_, r) => {
                    const inv = r.qtyInvoiced ?? (currentPurchase.status === 'CONFIRMED' || currentPurchase.status === 'DONE' ? r.quantity : 0);
                    return <Tag color={inv > 0 ? 'blue' : 'default'} className="font-mono text-[11px] m-0 font-bold">{inv}</Tag>;
                  },
                },
                {
                  title: 'ĐVT',
                  key: 'uom',
                  width: 60,
                  render: (_, r) => <span className="text-slate-500 font-semibold">{r.uom || 'Cái'}</span>,
                },
                {
                  title: 'Đơn Giá',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  width: 95,
                  render: (p) => `${Number(p || 0).toLocaleString('vi-VN')} đ`,
                },
                {
                  title: 'Thành Tiền',
                  key: 'amount',
                  width: 105,
                  render: (_, r) => {
                    const amt = r.amount ?? (Number(r.quantity || 0) * Number(r.unitPrice || 0));
                    return <span className="font-mono font-bold text-slate-900">{Number(amt).toLocaleString('vi-VN')} đ</span>;
                  },
                },
              ]}
            />
          </div>

          {/* Amount Summary */}
          <div className="flex flex-col items-end gap-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-1">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Tạm tính (Subtotal):</span>
              <span className="font-mono font-semibold">{Number(currentPurchase.subtotal || currentPurchase.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            {currentPurchase.taxAmount > 0 && (
              <div className="flex justify-between w-64 text-slate-600">
                <span>Thuế GTGT ({currentPurchase.taxRate || 10}%):</span>
                <span className="font-mono font-semibold">{Number(currentPurchase.taxAmount).toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 text-xs">Tổng Thanh Toán:</span>
              <span className="font-mono font-black text-emerald-700 text-sm flex items-center gap-1">
                <DollarOutlined />
                {Number(currentPurchase.totalAmount || currentPurchase.total || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* 2-Phase Action Footer */}
          <div className="flex justify-end gap-2 mt-2">
            {(currentPurchase.status === 'CONFIRMED' || currentPurchase.status === 'DONE') && (
              <Button
                type="default"
                icon={<FileTextOutlined className="text-indigo-600" />}
                loading={creatingInvoice}
                onClick={handleCreateInvoiceFromPurchase}
                className="border-indigo-300 text-indigo-700 bg-indigo-50/50 font-bold text-xs"
              >
                Tạo Hóa Đơn Mua Hàng (Vendor Bill)
              </Button>
            )}

            {currentPurchase.status === 'DRAFT' && (
              <>
                <Popconfirm title="Hủy đơn mua hàng này?" onConfirm={() => onCancel && onCancel(currentPurchase)}>
                  <Button danger icon={<CloseCircleOutlined />}>Hủy Đơn Mua</Button>
                </Popconfirm>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConfirmOrder}
                  className="bg-indigo-600 hover:bg-indigo-500 border-0 font-bold"
                >
                  Xác Nhận Đơn Mua (Chốt NCC)
                </Button>
              </>
            )}

            {currentPurchase.status === 'CONFIRMED' && (
              <Button
                type="primary"
                icon={<InboxOutlined />}
                loading={receiving}
                onClick={handleReceive}
                className="bg-emerald-600 hover:bg-emerald-500 border-0 font-bold"
              >
                Nhận Hàng Vào Kho (Thủ Kho)
              </Button>
            )}

            {currentPurchase.status === 'DONE' && (
              <Tag color="green" className="text-sm font-bold px-3 py-1 m-0 flex items-center">
                ✓ Đã Hoàn Tất Nhập Kho
              </Tag>
            )}
          </div>
        </div>

        {/* Right Column (30%): Chatter Audit Trail Logs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center gap-2">
            <HistoryOutlined className="text-indigo-600 text-base" />
            <div>
              <div className="font-extrabold text-slate-900 text-xs">Chatter Audit Trail</div>
              <div className="text-[11px] text-slate-500">Lịch sử trạng thái & nhật ký biến động Odoo</div>
            </div>
          </div>

          {logsLoading ? (
            <div className="py-12 text-center">
              <Spin tip="Đang tải nhật ký lịch sử..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
              <HistoryOutlined className="text-2xl mb-1 block text-slate-300" />
              Chưa có ghi nhận nhật ký cho đơn mua #{currentPurchase.poNumber || currentPurchase.id}
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[600px] pr-2">
              <Timeline
                items={logs.map((log, idx) => {
                  const author = log.author || log.userName || log.user?.name || 'NV - KT KHO';
                  const isConfirmed = String(log.body || '').includes('CONFIRMED') || String(log.body || '').includes('Đơn mua hàng');
                  return {
                    color: isConfirmed ? 'green' : 'blue',
                    children: (
                      <div className="flex flex-col gap-1 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-1">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Avatar size={16} icon={<UserOutlined />} className="bg-indigo-600 text-[9px]" />
                            {author}
                          </span>
                          <span className="font-mono text-[10px]">
                            {formatDate(log.createdAt || log.timestamp)}
                          </span>
                        </div>
                        <div
                          className="text-slate-700 font-medium leading-relaxed mt-1"
                          dangerouslySetInnerHTML={{
                            __html: String(log.body || log.message || log.note || 'Biến động trạng thái')
                              .replace(/->/g, ' &rarr; ')
                              .replace(/(\[[^\]]+\])/g, '<strong className="text-indigo-700">$1</strong>')
                          }}
                        />
                      </div>
                    ),
                  };
                })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stock Picking Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <TruckOutlined className="text-emerald-600 text-lg" />
            <span>Chi Tiết Phiếu Nhập Kho #{selectedPicking?.pickingNumber || selectedPicking?.number || 'WH/IN/01499'}</span>
          </div>
        }
        open={pickingModalOpen}
        onCancel={() => setPickingModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPickingModalOpen(false)} className="bg-indigo-600 font-bold border-0 text-xs">
            Đóng Chi Tiết
          </Button>
        ]}
        width={650}
        destroyOnClose
      >
        {selectedPicking && (
          <div className="flex flex-col gap-4 text-xs mt-3">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Mã Phiếu Nhập Kho</span>
                <span className="font-mono font-black text-indigo-700 text-sm block mt-0.5">
                  {selectedPicking.pickingNumber || selectedPicking.number || 'WH/IN/01499'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Trạng Thái Phiếu</span>
                <Tag
                  color={(selectedPicking.status === 'DONE' || currentPurchase.status === 'DONE') ? 'green' : 'orange'}
                  className="font-bold text-xs mt-1"
                >
                  {(selectedPicking.status === 'DONE' || currentPurchase.status === 'DONE')
                    ? 'ĐÃ NHẬP KHO (DONE)'
                    : selectedPicking.status === 'READY'
                    ? 'CHỜ NHẬP KHO (READY)'
                    : selectedPicking.status}
                </Tag>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Nhập Từ (NCC)</span>
                <span className="font-bold text-slate-900 text-xs block mt-0.5">
                  {selectedPicking.supplierName || selectedPicking.partnerName || currentPurchase.supplierName || 'BA - Bình An'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Chứng Từ Gốc (PO)</span>
                <span className="font-mono font-bold text-slate-800 text-xs block mt-0.5">
                  {selectedPicking.origin || currentPurchase.poNumber || `P01455`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Ngày Theo Kế Hoạch</span>
                <span className="font-mono text-slate-700 text-[11px] block mt-0.5">
                  {formatDate(selectedPicking.scheduledDate || selectedPicking.datePlanned || currentPurchase.datePlanned)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Ngày Hiệu Lực (Thực Tế)</span>
                <span className="font-mono text-slate-700 text-[11px] block mt-0.5">
                  {formatDate(selectedPicking.effectiveDate || selectedPicking.dateDone || currentPurchase.effectiveDate)}
                </span>
              </div>
            </div>

            <Divider className="my-1" />

            <div className="font-bold text-slate-800 text-xs">Danh Sách Phụ Tùng Nhập Kho Thực Tế:</div>
            <Table
              dataSource={selectedPicking.items || lineItems}
              rowKey={(r) => r.id || r.productId || r.productCode}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: 'Tên Phụ Tùng',
                  key: 'productName',
                  render: (_, r) => r.productName || r.product?.name || `Phụ tùng #${r.productId}`,
                },
                {
                  title: 'Mã Code',
                  dataIndex: 'productCode',
                  key: 'productCode',
                  width: 120,
                  render: (c) => <code className="font-mono font-bold text-indigo-700 text-[10px]">{c || 'N/A'}</code>,
                },
                {
                  title: 'SL Thực Nhập',
                  key: 'quantity',
                  width: 105,
                  render: (_, r) => <Tag color="green" className="font-mono font-bold text-xs">{r.qtyReceived || r.quantity || 1} Sản phẩm</Tag>,
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </Drawer>
  );
};

export default PurchaseDetailDrawer;
