/**
 * Utility for printing clean, professional documents (Quotations, Stock Pickings)
 */

const getBasePrintStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    padding: 32px;
    font-size: 13px;
    line-height: 1.5;
  }

  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .brand-logo {
    font-size: 22px;
    font-weight: 900;
    color: #4f46e5;
    letter-spacing: -0.025em;
  }

  .brand-sub {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    margin-top: 2px;
  }

  .doc-meta {
    text-align: right;
    font-size: 12px;
    color: #334155;
  }

  .doc-meta-item {
    margin-bottom: 3px;
  }

  .doc-title {
    text-align: center;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.05em;
    margin: 24px 0;
    text-transform: uppercase;
  }

  .info-box {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 24px;
  }

  .info-label {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
  }

  .info-value {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    margin-top: 2px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 24px;
  }

  .data-table th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }

  .data-table td {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    color: #1e293b;
    font-size: 12px;
  }

  .data-table tr:nth-child(even) {
    background: #fafafa;
  }

  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .font-bold { font-weight: 700; }

  .summary-box {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .summary-card {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px 20px;
    text-align: right;
  }

  .summary-label {
    font-size: 11px;
    color: #166534;
    font-weight: 700;
    text-transform: uppercase;
  }

  .summary-amount {
    font-size: 18px;
    font-weight: 900;
    color: #15803d;
    font-family: ui-monospace, monospace;
    margin-top: 2px;
  }

  .signature-section {
    margin-top: 60px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    text-align: center;
  }

  .sig-title {
    font-weight: 800;
    font-size: 12px;
    color: #0f172a;
    text-transform: uppercase;
  }

  .sig-space {
    height: 70px;
  }

  .sig-note {
    font-size: 11px;
    color: #94a3b8;
  }

  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
`;

/**
 * Print Sales Order Quotation PDF
 */
export const printQuotation = (order) => {
  if (!order) return;

  const orderNo = order.orderNumber || order.name || `SO-${order.id || Date.now()}`;
  const customerName = order.partnerName || order.customer?.name || order.partner?.name || 'Khách hàng';
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
  const items = Array.isArray(order.orderLines) ? order.orderLines : (Array.isArray(order.lines) ? order.lines : []);
  const totalAmount = Number(order.totalAmount || order.amountTotal || 0).toLocaleString('vi-VN');

  const win = window.open('', '_blank');
  if (!win) return;

  const tableRowsHtml = items.length > 0
    ? items.map((item, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td>
            <div class="font-bold">${item.productName || item.name || `Sản phẩm #${item.productId}`}</div>
            ${item.productCode || item.sku ? `<div class="font-mono" style="font-size:10px;color:#64748b;">${item.productCode || item.sku}</div>` : ''}
          </td>
          <td class="text-center font-mono font-bold">${item.quantity || 1}</td>
          <td class="text-right font-mono">${Number(item.unitPrice || item.priceUnit || 0).toLocaleString('vi-VN')} đ</td>
          <td class="text-right font-mono font-bold">${Number(item.amount || ((item.quantity || 1) * (item.unitPrice || 0))).toLocaleString('vi-VN')} đ</td>
        </tr>
      `).join('')
    : `<tr><td colspan="5" class="text-center" style="color:#64748b;padding:16px;">Chưa có danh sách sản phẩm trong báo giá</td></tr>`;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>Báo Giá - ${orderNo}</title>
      <style>${getBasePrintStyles()}</style>
    </head>
    <body>
      <div class="print-header">
        <div>
          <div class="brand-logo">QBA BMS PORTAL</div>
          <div class="brand-sub">Hệ Thống Quản Lý Phụ Tùng Xe Tải & Tồn Kho</div>
        </div>
        <div class="doc-meta">
          <div class="doc-meta-item"><strong>Mã Báo Giá:</strong> <span class="font-mono">${orderNo}</span></div>
          <div class="doc-meta-item"><strong>Ngày Tạo:</strong> ${dateStr}</div>
        </div>
      </div>

      <div class="doc-title">BẢNG BÁO GIÁ PHỤ TÙNG</div>

      <div class="info-box">
        <div>
          <div class="info-label">Khách Hàng / Đối Tác</div>
          <div class="info-value">${customerName}</div>
        </div>
        <div>
          <div class="info-label">Trạng Thái Đơn Hàng</div>
          <div class="info-value">${order.status || 'Báo giá'}</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px;" class="text-center">STT</th>
            <th>Tên Phụ Tùng / Sản Phẩm</th>
            <th style="width:70px;" class="text-center">Số Lượng</th>
            <th style="width:130px;" class="text-right">Đơn Giá</th>
            <th style="width:140px;" class="text-right">Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="summary-box">
        <div class="summary-card">
          <div class="summary-label">Tổng Cộng Tiền Báo Giá</div>
          <div class="summary-amount">${totalAmount} VNĐ</div>
        </div>
      </div>

      <div class="signature-section">
        <div>
          <div class="sig-title">ĐẠI DIỆN KHÁCH HÀNG</div>
          <div class="sig-space"></div>
          <div class="sig-note">(Ký & ghi rõ họ tên)</div>
        </div>
        <div>
          <div class="sig-title">ĐẠI DIỆN QBA BMS</div>
          <div class="sig-space"></div>
          <div class="sig-note">(Ký & ghi rõ họ tên)</div>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
};

/**
 * Print Stock Picking Slip PDF
 */
export const printPickingSlip = (picking) => {
  if (!picking) return;

  const pickingName = picking.name || picking.reference || `WH/PICK/#${picking.id || Date.now()}`;
  const origin = picking.origin || 'N/A';
  const pickingType = picking.pickingType || picking.type || 'WH/INT';
  const typeText = pickingType.includes('IN') ? 'PHIẾU NHẬP KHO' : (pickingType.includes('OUT') ? 'PHIẾU XUẤT KHO' : 'PHIẾU ĐIỀU CHUYỂN KHO NỘI BỘ');
  const dateStr = picking.createdAt ? new Date(picking.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

  const moveLines = Array.isArray(picking.moveLines)
    ? picking.moveLines
    : (Array.isArray(picking.moves) ? picking.moves : []);

  const win = window.open('', '_blank');
  if (!win) return;

  const tableRowsHtml = moveLines.length > 0
    ? moveLines.map((item, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td class="font-mono font-bold">${item.defaultCode || item.sku || item.productCode || 'N/A'}</td>
          <td class="font-bold">${item.productName || item.product?.name || `Sản phẩm #${item.productId}`}</td>
          <td class="text-center font-mono font-bold">${item.qtyDemand || item.quantity || item.productQty || 1}</td>
          <td class="text-center font-mono font-bold" style="color:#059669;">${item.qtyDone ?? item.quantity ?? 1}</td>
          <td class="text-center">${item.unit || 'Cái'}</td>
          <td class="text-center font-mono">${item.location || item.locationName || 'WH/Stock'}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="7" class="text-center" style="color:#64748b;padding:16px;">Chi tiết mã lệnh kho ${pickingName} - Đã ghi nhận biến động kho</td></tr>`;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>${typeText} - ${pickingName}</title>
      <style>${getBasePrintStyles()}</style>
    </head>
    <body>
      <div class="print-header">
        <div>
          <div class="brand-logo">QBA BMS PORTAL</div>
          <div class="brand-sub">Hệ Thống Quản Lý Phụ Tùng Xe Tải & Tồn Kho</div>
        </div>
        <div class="doc-meta">
          <div class="doc-meta-item"><strong>Mã Lệnh Kho:</strong> <span class="font-mono">${pickingName}</span></div>
          <div class="doc-meta-item"><strong>Chứng Từ Gốc:</strong> <span class="font-mono">${origin}</span></div>
          <div class="doc-meta-item"><strong>Ngày Lập:</strong> ${dateStr}</div>
        </div>
      </div>

      <div class="doc-title">${typeText}</div>

      <div class="info-box">
        <div>
          <div class="info-label">Vị Trí Nguồn (Source Location)</div>
          <div class="info-value font-mono">${picking.locationName || picking.location || 'WH/Stock'}</div>
        </div>
        <div>
          <div class="info-label">Vị Trí Đích (Destination Location)</div>
          <div class="info-value font-mono">${picking.locationDestName || picking.locationDest || 'WH/Output'}</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px;" class="text-center">STT</th>
            <th style="width:130px;">Mã SKU / OEM</th>
            <th>Tên Phụ Tùng / Sản Phẩm</th>
            <th style="width:70px;" class="text-center">Yêu Cầu</th>
            <th style="width:70px;" class="text-center">Thực Xuất</th>
            <th style="width:60px;" class="text-center">ĐVT</th>
            <th style="width:100px;" class="text-center">Ô / Kệ Kho</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="signature-section">
        <div>
          <div class="sig-title">NGƯỜI LẬP PHIẾU</div>
          <div class="sig-space"></div>
          <div class="sig-note">(Ký & ghi rõ họ tên)</div>
        </div>
        <div>
          <div class="sig-title">THỦ KHO XUẤT / NHẬP</div>
          <div class="sig-space"></div>
          <div class="sig-note">(Ký & ghi rõ họ tên)</div>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
};
