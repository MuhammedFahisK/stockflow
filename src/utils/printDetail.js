export function printIncomingDetail(inv) {
  const items = inv.items || [];
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productName || ''}</td><td>${i.barcode || ''}</td><td>${i.batchNo || ''}</td><td>${i.expDate || ''}</td><td>${i.qtyReceived || ''}</td><td>${i.rejectedQty || ''}</td><td>${i.warehouseLocation || ''}</td></tr>`
    )
    .join('');
  const html = `
<!DOCTYPE html><html><head><title>GRN - ${inv.invoiceNo}</title>
<style>body{font-family:Inter,sans-serif;padding:24px;font-size:14px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;} h1{font-size:20px;} .meta{margin-bottom:20px;}</style>
</head><body>
<h1>GRN: Goods Received Note</h1>
<div class="meta"><strong>GRN No:</strong> ${inv.invoiceNo} | <strong>Vendor:</strong> ${inv.vendorSupplier || ''} | <strong>E-Way Bill:</strong> ${inv.ewayBillNo || 'N/A'} | <strong>Date:</strong> ${inv.receivedDate || ''}</div>
<table><thead><tr><th>Product</th><th>Barcode</th><th>Batch</th><th>Exp Date</th><th>Qty</th><th>Rejected</th><th>Location</th></tr></thead><tbody>${rows}</tbody></table>
${inv.notes ? `<p><strong>Notes:</strong> ${inv.notes}</p>` : ''}
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}

export function printOutgoingDetail(ship) {
  const items = ship.items || [];
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productName || ''}</td><td>${i.barcode || ''}</td><td>${i.batchNo || ''}</td><td>${i.expDate || ''}</td><td>${i.qtyDispatched || ''}</td><td>${i.warehouseLocation || ''}</td></tr>`
    )
    .join('');
  const html = `
<!DOCTYPE html><html><head><title>Delivery Note - ${ship.invoiceNo}</title>
<style>body{font-family:Inter,sans-serif;padding:24px;font-size:14px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;} h1{font-size:20px;} .meta{margin-bottom:20px;}</style>
</head><body>
<h1>Delivery Note (Confirms goods delivered)</h1>
<div class="meta"><strong>Delivery Note No:</strong> ${ship.invoiceNo} | <strong>Recipient:</strong> ${ship.recipientName || ''} | <strong>E-Way Bill:</strong> ${ship.ewayBillNo || 'N/A'} | <strong>Vehicle:</strong> ${ship.vehicleNo || 'N/A'}</div>
<table><thead><tr><th>Product</th><th>Barcode</th><th>Batch</th><th>Exp Date</th><th>Qty Dispatched</th><th>Location</th></tr></thead><tbody>${rows}</tbody></table>
${ship.notes ? `<p><strong>Notes:</strong> ${ship.notes}</p>` : ''}
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}

export function printReturnsDetail(ret) {
  const items = ret.items || [];
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productName || ''}</td><td>${i.batchNo || ''}</td><td>${i.expDate || ''}</td><td>${i.qtyReturned || ''}</td><td>${i.reason || ''}</td><td>${(i.action || '').replace('_', ' ')}</td></tr>`
    )
    .join('');
  const html = `
<!DOCTYPE html><html><head><title>Return - ${ret.returnNo}</title>
<style>body{font-family:Inter,sans-serif;padding:24px;font-size:14px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;} h1{font-size:20px;} .meta{margin-bottom:20px;}</style>
</head><body>
<h1>Return Record</h1>
<div class="meta"><strong>Return No:</strong> ${ret.returnNo} | <strong>Vendor:</strong> ${ret.vendors || ''} | <strong>Invoice No:</strong> ${ret.invoiceNo || 'N/A'} | <strong>Return Date:</strong> ${ret.returnDate || ''} | <strong>Status:</strong> ${ret.status || ''}</div>
<table><thead><tr><th>Product</th><th>Batch</th><th>Exp Date</th><th>Qty</th><th>Reason</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
${ret.notes ? `<p><strong>Notes:</strong> ${ret.notes}</p>` : ''}
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}
