import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Download, Eye, Printer } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { printIncomingDetail } from '../utils/printDetail';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import SignaturePad from '../components/SignaturePad';

export default function Incoming() {
  const { userCompany, userRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    ewayBillNo: '',
    vendorSupplier: '',
    receivedDate: new Date().toISOString().split('T')[0],
    items: [
      {
        productName: '',
        barcode: '',
        batchNo: '',
        mfgDate: '',
        expDate: '',
        unit: 'Pcs',
        qtyReceived: '',
        rejectedQty: '',
        discrepancy: false,
        discrepancyReason: '',
        warehouseLocation: '',
      },
    ],
    supervisorSignature: '',
    accountsSignature: '',
    notes: '',
  });

  const canCreate = hasPermission(userRole, PERMISSIONS.INCOMING_CREATE);
  const canDelete = hasPermission(userRole, PERMISSIONS.INCOMING_DELETE);

  useEffect(() => {
    fetchProducts();
    fetchInvoices();
  }, [userCompany]);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('company', '==', userCompany));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'incomingStock'),
        where('company', '==', userCompany)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoices(data.sort((a, b) => b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime()));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleProductSelect = (index, productName) => {
    const selected = products.find((p) => p.productName === productName);
    if (selected) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        productName: selected.productName,
        barcode: selected.barcode,
        batchNo: '',
        mfgDate: '',
        expDate: '',
        unit: selected.unit,
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const getBatchOptionsForProduct = (productName) => {
    const p = products.find((pr) => pr.productName === productName);
    if (!p) return [];
    if (p.batches?.length) return p.batches;
    if (p.batchNo) {
      return p.batchNo.split(',').map((b) => ({ batchNo: b.trim(), mfgDate: p.mfgDate, expDate: p.expDate }));
    }
    return [];
  };

  const handleBatchSelect = (index, batchNo) => {
    const productName = formData.items[index]?.productName;
    const batches = getBatchOptionsForProduct(productName);
    const batch = batches.find((b) => b.batchNo === batchNo);
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      batchNo: batchNo || '',
      mfgDate: batch?.mfgDate || '',
      expDate: batch?.expDate || '',
    };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productName: '',
          barcode: '',
          batchNo: '',
          mfgDate: '',
          expDate: '',
          unit: 'Pcs',
          qtyReceived: '',
          rejectedQty: '',
          discrepancy: false,
          discrepancyReason: '',
          warehouseLocation: '',
        },
      ],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.invoiceNo || formData.items.length === 0) {
        alert('Please enter invoice number and add at least one item');
        return;
      }

      const validItems = formData.items.filter(item => item.productName);
      if (validItems.length === 0) {
        alert('Please add at least one product to the invoice');
        return;
      }

      await addDoc(collection(db, 'incomingStock'), {
        ...formData,
        items: validItems,
        company: userCompany,
        createdAt: Timestamp.now(),
        status: 'completed',
      });

      fetchInvoices();
      setShowModal(false);
      setFormData({
        invoiceNo: '',
        ewayBillNo: '',
        vendorSupplier: '',
        receivedDate: new Date().toISOString().split('T')[0],
        items: [
          {
            productName: '',
            barcode: '',
            batchNo: '',
            mfgDate: '',
            expDate: '',
            unit: 'Pcs',
            qtyReceived: '',
            rejectedQty: '',
            discrepancy: false,
            discrepancyReason: '',
            warehouseLocation: '',
          },
        ],
        supervisorSignature: '',
        accountsSignature: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'incomingStock', id));
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice');
      }
    }
  };

  const handleExport = () => {
    if (invoices.length === 0) {
      alert('No invoices to export');
      return;
    }

    const exportData = invoices.map((inv) => ({
      'GRN No': inv.invoiceNo,
      'E-Way Bill': inv.ewayBillNo || 'N/A',
      'Vendor/Supplier': inv.vendorSupplier,
      'Received Date': inv.receivedDate,
      'Items Count': inv.items?.length || 0,
      'Total Qty': inv.items?.reduce((sum, item) => sum + parseInt(item.qtyReceived || 0), 0) || 0,
      'Status': inv.status,
      'Created': inv.createdAt?.toDate?.()?.toLocaleDateString() || '-',
    }));

    exportToExcel(exportData, 'incoming_stock.xlsx', 'Incoming Stock');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incoming Stock</h1>
          <p className="text-gray-600 text-sm mt-1">Record newly received stock items</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium"
            >
              <Plus size={18} />
              New Invoice
            </button>
          )}
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-green-700 transition font-medium"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📥</div>
            <p className="text-gray-500 text-lg">No invoices recorded yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">GRN No</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">E-Way Bill</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Vendor</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Items</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Total Qty</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-gray-900">{inv.invoiceNo}</td>
                    <td className="px-6 py-3 text-gray-600">{inv.ewayBillNo || '-'}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">{inv.vendorSupplier}</td>
                    <td className="px-6 py-3">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        {inv.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">
                      {inv.items?.reduce((sum, item) => sum + parseInt(item.qtyReceived || 0), 0) || 0} units
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {inv.createdAt?.toDate?.()?.toLocaleDateString() || '-'}
                    </td>
                    <td className="px-6 py-3 text-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded transition inline-block"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded transition inline-block"
                          title="Delete"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {showModal && canCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-6">
            <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Record New Incoming Stock</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GRN No * <span className="text-gray-500 font-normal">(Goods Received Note)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="GRN-001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-Way Bill No (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.ewayBillNo}
                      onChange={(e) =>
                        setFormData({ ...formData, ewayBillNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="EWB-123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor/Supplier *
                    </label>
                    <input
                      type="text"
                      value={formData.vendorSupplier}
                      onChange={(e) =>
                        setFormData({ ...formData, vendorSupplier: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Supplier Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received Date
                    </label>
                    <input
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) =>
                        setFormData({ ...formData, receivedDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 text-lg">Line Items</h4>
                  {formData.items.map((item, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50 relative">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product *
                          </label>
                          <select
                            value={item.productName}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.productName}>
                                {p.productName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Barcode
                          </label>
                          <input
                            type="text"
                            value={item.barcode}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batch No
                          </label>
                          <select
                            value={item.batchNo}
                            onChange={(e) => handleBatchSelect(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="">Select batch</option>
                            {getBatchOptionsForProduct(item.productName).map((b) => (
                              <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            MFG Date
                          </label>
                          <input
                            type="date"
                            value={item.mfgDate}
                            onChange={(e) => handleItemChange(index, 'mfgDate', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Exp Date
                          </label>
                          <input
                            type="date"
                            value={item.expDate}
                            onChange={(e) => handleItemChange(index, 'expDate', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option>Pcs</option>
                            <option>Box</option>
                            <option>Carton</option>
                            <option>Kg</option>
                            <option>Liter</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Warehouse Location
                          </label>
                          <input
                            type="text"
                            value={item.warehouseLocation}
                            onChange={(e) =>
                              handleItemChange(index, 'warehouseLocation', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="A-02"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Qty Received *
                          </label>
                          <input
                            type="number"
                            value={item.qtyReceived}
                            onChange={(e) =>
                              handleItemChange(index, 'qtyReceived', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Rejected Qty
                          </label>
                          <input
                            type="number"
                            value={item.rejectedQty}
                            onChange={(e) =>
                              handleItemChange(index, 'rejectedQty', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Discrepancy?
                          </label>
                          <input
                            type="checkbox"
                            checked={item.discrepancy}
                            onChange={(e) =>
                              handleItemChange(index, 'discrepancy', e.target.checked)
                            }
                            className="w-4 h-4 border border-gray-300 rounded mt-1"
                          />
                        </div>
                      </div>

                      {item.discrepancy && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Discrepancy Reason
                          </label>
                          <input
                            type="text"
                            value={item.discrepancyReason}
                            onChange={(e) =>
                              handleItemChange(index, 'discrepancyReason', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    + Add Another Item
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                  <SignaturePad
                    label="Supervisor Signature"
                    placeholder="Please sign here"
                    value={formData.supervisorSignature}
                    onChange={(dataUrl) =>
                      setFormData({ ...formData, supervisorSignature: dataUrl || '' })
                    }
                  />
                  <SignaturePad
                    label="Accounts Signature"
                    placeholder="Please sign here"
                    value={formData.accountsSignature}
                    onChange={(dataUrl) =>
                      setFormData({ ...formData, accountsSignature: dataUrl || '' })
                    }
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Save Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">GRN Details - {selectedInvoice.invoiceNo} <span className="text-gray-500 font-normal text-sm">(Goods Received Note)</span></h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-gray-600 text-sm">GRN No</p>
                  <p className="font-semibold">{selectedInvoice.invoiceNo}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Vendor/Supplier</p>
                  <p className="font-semibold">{selectedInvoice.vendorSupplier}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">E-Way Bill</p>
                  <p className="font-semibold">{selectedInvoice.ewayBillNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Received Date</p>
                  <p className="font-semibold">{selectedInvoice.receivedDate}</p>
                </div>
              </div>

              <h4 className="font-semibold mb-3">Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left">Barcode</th>
                      <th className="px-3 py-2 text-left">Batch</th>
                      <th className="px-3 py-2 text-left">Exp Date</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-center">Rejected</th>
                      <th className="px-3 py-2 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2 font-mono text-xs">{item.barcode}</td>
                        <td className="px-3 py-2">{item.batchNo}</td>
                        <td className="px-3 py-2">{item.expDate}</td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {item.qtyReceived}
                        </td>
                        <td className="px-3 py-2 text-center text-red-600">
                          {item.rejectedQty}
                        </td>
                        <td className="px-3 py-2">{item.warehouseLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedInvoice.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Notes</p>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t justify-end mt-6">
                <button
                  onClick={() => printIncomingDetail(selectedInvoice)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
