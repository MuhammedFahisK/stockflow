export function printGRNDetail(inv) {
  const items = inv.items || [];
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productName || ''}</td><td>${i.barcode || ''}</td><td>${i.batchNo || ''}</td><td>${i.expDate || ''}</td><td>${i.qtyReceived || ''}</td><td>${i.rejectedQty || ''}</td><td>${i.warehouseLocation || ''}</td></tr>`
    )
    .join('');
  const html = `
<!DOCTYPE html><html><head><title>GRN - ${inv.invoiceNo}</title>
<style>
body{font-family:Inter,sans-serif;padding:24px;font-size:14px;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ddd;padding:8px;text-align:left;}
th{background:#f5f5f5;}
h1{font-size:20px;}
.meta{margin-bottom:12px;}
.section{margin-top:24px;}
.sign-row{display:flex;gap:40px;margin-top:24px;}
.sign-box{flex:1;}
.sign-label{font-weight:bold;margin-bottom:4px;}
.sign-line{margin-top:32px;border-top:1px solid #333;width:180px;}
.sign-img{max-height:60px;display:block;margin:8px 0;}
</style>
</head><body>
<h1>GRN: Goods Received Note</h1>
<div class="meta"><strong>GRN No:</strong> ${inv.invoiceNo} | <strong>Vendor:</strong> ${inv.vendorSupplier || ''}</div>
<div class="meta"><strong>E-Way Bill:</strong> ${inv.ewayBillNo || 'N/A'} | <strong>Date:</strong> ${inv.receivedDate || ''}</div>
<div class="meta"><strong>Print Date:</strong> ${new Date().toLocaleString()}</div>
${inv.createdBy ? `<div class="meta"><strong>Recorded by:</strong> ${inv.createdBy}</div>` : ''}
<table><thead><tr><th>Product</th><th>Barcode</th><th>Batch</th><th>Exp Date</th><th>Qty</th><th>Rejected</th><th>Location</th></tr></thead><tbody>${rows}</tbody></table>
${inv.checklist ? `
<div class="section">
  <strong>Checklist Verification:</strong>
  <ul>
    <li>Invoice No Verified: ${inv.checklist.invoiceChecklist.invoiceNoVerified ? 'YES' : 'NO'}</li>
    <li>E-Way Bill Verified: ${inv.checklist.invoiceChecklist.ewayBillVerified ? 'YES' : 'NO'}</li>
    <li>Qty Recount matches invoice: ${inv.checklist.finalConfirmation.qtyRecountMatches ? 'YES' : 'NO'}</li>
  </ul>
</div>
<div class="section">
  <strong>Departmental Certifications:</strong>
  <div style="display:flex; flex-wrap:wrap; gap:20px; font-size:12px; margin-top:8px;">
    <div>Supervisor: ${inv.checklist.certifications.supervisorName || 'N/A'}</div>
    <div>Acc. Dept: ${inv.checklist.certifications.accDeptName || 'N/A'}</div>
    <div>Supply Chain: ${inv.checklist.certifications.supplyChainExecName || 'N/A'}</div>
    <div>Accounts Mgr: ${inv.checklist.certifications.accountsManagerName || 'N/A'}</div>
  </div>
</div>
` : ''}
${inv.notes ? `<div class="section"><strong>Notes:</strong> ${inv.notes}</div>` : ''}
<div class="section sign-row">
  <div class="sign-box">
    <div class="sign-label">Supervisor Signature</div>
    ${inv.supervisorSignature
      ? `<img class="sign-img" src="${inv.supervisorSignature}" alt="Supervisor Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Acc. Dept Signature</div>
    ${inv.accountsSignature
      ? `<img class="sign-img" src="${inv.accountsSignature}" alt="Acc. Dept Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Supply Chain Exec Signature</div>
    ${inv.supplyChainExecSignature
      ? `<img class="sign-img" src="${inv.supplyChainExecSignature}" alt="Supply Chain Exec Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Accounts Manager Signature</div>
    ${inv.accountsManagerSignature
      ? `<img class="sign-img" src="${inv.accountsManagerSignature}" alt="Accounts Manager Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
</div>
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
<style>
body{font-family:Inter,sans-serif;padding:24px;font-size:14px;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ddd;padding:8px;text-align:left;}
th{background:#f5f5f5;}
h1{font-size:20px;}
.meta{margin-bottom:12px;}
.section{margin-top:24px;}
.sign-row{display:flex;gap:40px;margin-top:24px;}
.sign-box{flex:1;}
.sign-label{font-weight:bold;margin-bottom:4px;}
.sign-line{margin-top:32px;border-top:1px solid #333;width:180px;}
.sign-img{max-height:60px;display:block;margin:8px 0;}
</style>
</head><body>
<h1>Delivery Note (Confirms goods delivered)</h1>
<div class="meta"><strong>Delivery Note No:</strong> ${ship.invoiceNo} | <strong>Recipient:</strong> ${ship.recipientName || ''}</div>
<div class="meta"><strong>E-Way Bill:</strong> ${ship.ewayBillNo || 'N/A'} | <strong>Vehicle:</strong> ${ship.vehicleNo || 'N/A'}</div>
<div class="meta"><strong>Print Date:</strong> ${new Date().toLocaleString()}</div>
${ship.dispatchDate ? `<div class="meta"><strong>Dispatch Date:</strong> ${ship.dispatchDate}</div>` : ''}
${ship.createdBy ? `<div class="meta"><strong>Recorded by:</strong> ${ship.createdBy}</div>` : ''}
<table><thead><tr><th>Product</th><th>Barcode</th><th>Batch</th><th>Exp Date</th><th>Qty Dispatched</th><th>Location</th></tr></thead><tbody>${rows}</tbody></table>
${ship.checklist ? `
<div class="section">
  <strong>Checklist Verification:</strong>
  <ul>
    <li>Invoice No Verified: ${ship.checklist.invoiceChecklist.invoiceNoVerified ? 'YES' : 'NO'}</li>
    <li>Total Qty Verified: ${ship.checklist.productDetails.totalQtyVerified ? 'YES' : 'NO'}</li>
    <li>Driver Details Verified: ${ship.checklist.driverDetails.driverNamePhoneVerified ? 'YES' : 'NO'}</li>
    <li>Vehicle No Verified: ${ship.checklist.driverDetails.vehicleNoVerified ? 'YES' : 'NO'}</li>
  </ul>
</div>
<div class="section">
  <strong>Departmental Certifications:</strong>
  <div style="display:flex; flex-wrap:wrap; gap:20px; font-size:12px; margin-top:8px;">
    <div>Supervisor: ${ship.checklist.certifications.supervisorName || 'N/A'}</div>
    <div>Accountant: ${ship.checklist.certifications.accountantName || 'N/A'}</div>
    <div>Supply Chain: ${ship.checklist.certifications.supplyChainExecName || 'N/A'}</div>
    <div>Accounts Manager: ${ship.checklist.certifications.accountsManagerName || 'N/A'}</div>
  </div>
</div>
` : ''}
${ship.notes ? `<div class="section"><strong>Notes:</strong> ${ship.notes}</div>` : ''}
<div class="section sign-row">
  <div class="sign-box">
    <div class="sign-label">Supervisor Signature</div>
    ${ship.supervisorSignature
      ? `<img class="sign-img" src="${ship.supervisorSignature}" alt="Supervisor Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Accounts Signature</div>
    ${ship.accountsSignature
      ? `<img class="sign-img" src="${ship.accountsSignature}" alt="Accounts Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Supply Chain Exec Signature</div>
    ${ship.supplyChainExecSignature
      ? `<img class="sign-img" src="${ship.supplyChainExecSignature}" alt="Supply Chain Exec Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Accounts Manager Signature</div>
    ${ship.accountsManagerSignature
      ? `<img class="sign-img" src="${ship.accountsManagerSignature}" alt="Accounts Manager Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
</div>
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
<style>
body{font-family:Inter,sans-serif;padding:24px;font-size:14px;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ddd;padding:8px;text-align:left;}
th{background:#f5f5f5;}
h1{font-size:20px;}
.meta{margin-bottom:12px;}
.section{margin-top:24px;}
.sign-row{display:flex;gap:40px;margin-top:24px;}
.sign-box{flex:1;}
.sign-label{font-weight:bold;margin-bottom:4px;}
.sign-line{margin-top:32px;border-top:1px solid #333;width:180px;}
.sign-img{max-height:60px;display:block;margin:8px 0;}
</style>
</head><body>
<h1>Return Record</h1>
<div class="meta"><strong>Return No:</strong> ${ret.returnNo} | <strong>Vendor:</strong> ${ret.vendors || ''}</div>
<div class="meta"><strong>Invoice No:</strong> ${ret.invoiceNo || 'N/A'} | <strong>Return Date:</strong> ${ret.returnDate || ''}</div>
<div class="meta"><strong>Print Date:</strong> ${new Date().toLocaleString()}</div>
<div class="meta"><strong>Status:</strong> ${ret.status || ''}</div>
${ret.createdBy ? `<div class="meta"><strong>Recorded by:</strong> ${ret.createdBy}</div>` : ''}
<table><thead><tr><th>Product</th><th>Batch</th><th>Exp Date</th><th>Qty</th><th>Reason</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
${ret.checklist ? `
<div class="section">
  <strong>Checklist Verification:</strong>
  <ul>
    <li>Party Name Verified: ${ret.checklist.invoiceDebitNote.partyNameVerified ? 'YES' : 'NO'}</li>
    <li>Invoice No Verified: ${ret.checklist.invoiceDebitNote.invoiceNoVerified ? 'YES' : 'NO'}</li>
    <li>E-Way Bill Verified: ${ret.checklist.invoiceDebitNote.ewayBillVerified ? 'YES' : 'NO'}</li>
  </ul>
</div>
<div class="section">
  <strong>Departmental Certifications:</strong>
  <div style="display:flex; flex-wrap:wrap; gap:20px; font-size:12px; margin-top:8px;">
    <div>Supervisor: ${ret.checklist.certifications.supervisorName || 'N/A'}</div>
    <div>Acc. Dept: ${ret.checklist.certifications.accDeptName || 'N/A'}</div>
    <div>Supply Chain: ${ret.checklist.certifications.supplyChainExecName || 'N/A'}</div>
    <div>Accounts Mgr: ${ret.checklist.certifications.accountsManagerName || 'N/A'}</div>
  </div>
</div>
` : ''}
${ret.notes ? `<div class="section"><strong>Notes:</strong> ${ret.notes}</div>` : ''}
<div class="section sign-row">
  <div class="sign-box">
    <div class="sign-label">Supervisor Signature</div>
    ${ret.supervisorSignature
      ? `<img class="sign-img" src="${ret.supervisorSignature}" alt="Supervisor Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Acc. Dept Signature</div>
    ${ret.accountsSignature
      ? `<img class="sign-img" src="${ret.accountsSignature}" alt="Acc. Dept Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Supply Chain Exec Signature</div>
    ${ret.supplyChainExecSignature
      ? `<img class="sign-img" src="${ret.supplyChainExecSignature}" alt="Supply Chain Exec Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
  <div class="sign-box">
    <div class="sign-label">Accounts Manager Signature</div>
    ${ret.accountsManagerSignature
      ? `<img class="sign-img" src="${ret.accountsManagerSignature}" alt="Accounts Manager Signature" />`
      : '<div class="sign-line"></div>'}
  </div>
</div>
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}
