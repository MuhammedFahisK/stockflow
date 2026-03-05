import React, { useState, useEffect } from 'react';
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
import { Plus, X, Download, Eye, Printer, Briefcase } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { printReturnsDetail } from '../utils/printDetail';
import { PERMISSIONS, hasPermission, DEFAULT_UNITS } from '../utils/permissions';
import SignaturePad from '../components/SignaturePad';

export default function Returns() {
  const { user, userCompany, userRole, userName } = useAuth();
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [formData, setFormData] = useState({
    returnNo: '',
    invoiceNo: '',
    invoiceAmount: '',
    ewayBillNo: '',
    isEwayBillRequired: false,
    returnDate: new Date().toISOString().split('T')[0],
    vendors: '',
    items: [
      {
        productName: '',
        barcode: '',
        batchNo: '',
        mfgDate: '',
        expDate: '',
        unit: DEFAULT_UNITS[0],
        qtyReturned: '',
        reason: '',
        action: '',
      },
    ],
    supervisorSignature: '',
    accountsSignature: '',
    notes: '',
    checklist: {
      invoiceDebitNote: {
        partyNameVerified: false,
        invoiceNoVerified: false,
        ewayBillVerified: false,
      },
      replenishmentTimeline: '',
      communicationStatus: {
        accountsDept: false,
        sales: false,
        oh: false,
      },
      docsToAccounts: {
        debitNoteSigned: false,
        grnSigned: false,
      },
      certifications: {
        supervisorName: '',
        supplyChainExecName: '',
        accountsManagerName: '',
      }
    }
  });

  const canCreate = hasPermission(userRole, PERMISSIONS.RETURNS_CREATE);
  const canDelete = hasPermission(userRole, PERMISSIONS.RETURNS_DELETE);

  const returnReasons = [
    'Damaged',
    'Expired',
    'Defective',
    'Wrong Item',
    'Quantity Mismatch',
    'Quality Issue',
    'Customer Return',
    'Other',
  ];

  const returnActions = ['dispose', 'move_to_stock', 'rework', 'scrap'];

  useEffect(() => {
    if (userCompany) {
      fetchProducts();
      fetchReturns();
      fetchCompanyUsers();
      fetchVendors();
    }
  }, [userCompany]);

  const fetchVendors = async () => {
    try {
      const q = query(collection(db, 'vendors'), where('company', '==', userCompany));
      const snapshot = await getDocs(q);
      setVendors(snapshot.docs.map(d => d.data().name));
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const fetchCompanyUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('company', '==', userCompany));
      const res = await getDocs(q);
      const activeUsers = res.docs
        .map(d => d.data())
        .filter(u => u.status === 'active' && u.fullName);
      setCompanyUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'returns'),
        where('company', '==', userCompany)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReturns(data.sort((a, b) => b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime()));
    } catch (error) {
      console.error('Error fetching returns:', error);
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
          qtyReturned: '',
          reason: '',
          action: '',
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
      if (!formData.returnNo || formData.items.length === 0) {
        alert('Please enter return number and add at least one item');
        return;
      }

      const validItems = formData.items.filter(item => item.productName);
      if (validItems.length === 0) {
        alert('Please add at least one product to the return');
        return;
      }

      const createdBy = userName || user?.email || 'User';

      // Save Vendor if new
      if (formData.vendors && !vendors.includes(formData.vendors)) {
        await addDoc(collection(db, 'vendors'), {
          name: formData.vendors,
          company: userCompany,
          createdAt: new Date()
        });
        fetchVendors();
      }

      const ref = await addDoc(collection(db, 'returns'), {
        ...formData,
        items: validItems,
        company: userCompany,
        createdBy,
        createdAt: Timestamp.now(),
        status: 'pending',
      });

      fetchReturns();
      setShowModal(false);
      setFormData({
        returnNo: '',
        invoiceNo: '',
        invoiceAmount: '',
        ewayBillNo: '',
        isEwayBillRequired: false,
        returnDate: new Date().toISOString().split('T')[0],
        vendors: '',
        items: [
          {
            productName: '',
            barcode: '',
            batchNo: '',
            mfgDate: '',
            expDate: '',
            unit: 'Pcs',
            qtyReturned: '',
            reason: '',
            action: '',
          },
        ],
        supervisorSignature: '',
        accountsSignature: '',
        notes: '',
        checklist: {
          invoiceDebitNote: {
            partyNameVerified: false,
            invoiceNoVerified: false,
            ewayBillVerified: false,
          },
          replenishmentTimeline: '',
          communicationStatus: {
            accountsDept: false,
            sales: false,
            oh: false,
          },
          docsToAccounts: {
            debitNoteSigned: false,
            grnSigned: false,
          },
          certifications: {
            supervisorName: '',
            supplyChainExecName: '',
            accountsManagerName: '',
          }
        }
      });
    } catch (error) {
      console.error('Error saving return:', error);
      alert('Error saving return. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this return record?')) {
      try {
        await deleteDoc(doc(db, 'returns', id));
        fetchReturns();
      } catch (error) {
        console.error('Error deleting return:', error);
        alert('Error deleting return');
      }
    }
  };

  const handleExport = () => {
    if (returns.length === 0) {
      alert('No returns to export');
      return;
    }

    const exportData = returns.map((ret) => ({
      'Return No': ret.returnNo,
      'Invoice No': ret.invoiceNo || 'N/A',
      'Vendor': ret.vendors,
      'Items Count': ret.items?.length || 0,
      'Total Qty Returned': ret.items?.reduce((sum, item) => sum + parseInt(item.qtyReturned || 0), 0) || 0,
      'Status': ret.status,
      'Return Date': ret.returnDate,
      'Created': ret.createdAt?.toDate?.()?.toLocaleDateString() || '-',
    }));

    exportToExcel(exportData, 'returns.xlsx', 'Returns');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">Returns Management</h1>
          <p className="text-gray-600 text-sm mt-1">Track product returns and disposal</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all font-medium"
            >
              <Plus size={18} />
              New Return
            </button>
          )}
          <button
            onClick={handleExport}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all font-medium"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">↩️</div>
            <p className="text-gray-500 text-lg">No return records yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first return to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-200">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Return No</th>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Invoice No</th>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Vendor</th>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Items</th>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Total Qty</th>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-red-900">Return Date</th>
                  <th className="px-6 py-4 text-center font-bold text-red-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-red-600">{ret.returnNo}</td>
                    <td className="px-6 py-4 text-gray-600">{ret.invoiceNo || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{ret.vendors}</td>
                    <td className="px-6 py-4">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                        {ret.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {ret.items?.reduce((sum, item) => sum + parseInt(item.qtyReturned || 0), 0) || 0} units
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${ret.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        ret.status === 'disposed' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{ret.returnDate}</td>
                    <td className="px-6 py-4 text-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedReturn(ret);
                          setShowDetailModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition inline-block"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(ret.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition inline-block"
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

      {/* New Return Modal */}
      {showModal && canCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-6">
            <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Create Return Record</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return No *
                    </label>
                    <input
                      type="text"
                      value={formData.returnNo}
                      onChange={(e) =>
                        setFormData({ ...formData, returnNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="RET-001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice No (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="INV-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.invoiceAmount}
                      onChange={(e) => {
                        const amount = e.target.value;
                        setFormData({
                          ...formData,
                          invoiceAmount: amount,
                          isEwayBillRequired: Number(amount) > 50000,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor/Supplier *
                    </label>
                    <input
                      list="vendor-options"
                      type="text"
                      value={formData.vendors}
                      onChange={(e) =>
                        setFormData({ ...formData, vendors: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Vendor/Supplier Name"
                      required
                    />
                    <datalist id="vendor-options">
                      {vendors.map((v, i) => <option key={i} value={v} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) =>
                        setFormData({ ...formData, returnDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {formData.isEwayBillRequired && (
                    <div className="md:col-span-2 bg-orange-50 p-4 rounded-lg border border-orange-200 flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-Way Bill Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.ewayBillNo}
                          onChange={(e) => setFormData({ ...formData, ewayBillNo: e.target.value })}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                          placeholder="Ex: 123456789012"
                          required={formData.isEwayBillRequired}
                        />
                      </div>
                      <div className="flex items-center mt-4 md:mt-0">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-orange-900">
                          <input
                            type="checkbox"
                            checked={formData.isEwayBillRequired}
                            onChange={(e) => setFormData({ ...formData, isEwayBillRequired: e.target.checked })}
                            className="w-5 h-5 text-orange-600 rounded"
                          />
                          E-Way Bill Requirement Fullfilled
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 text-lg">Returned Items</h4>
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

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            MFG Date
                          </label>
                          <input
                            type="date"
                            value={item.mfgDate}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Exp Date
                          </label>
                          <input
                            type="date"
                            value={item.expDate}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          >
                            <option value="">Select</option>
                            {DEFAULT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Qty Returned *
                          </label>
                          <input
                            type="number"
                            value={item.qtyReturned}
                            onChange={(e) =>
                              handleItemChange(index, 'qtyReturned', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Return Reason *
                          </label>
                          <select
                            value={item.reason}
                            onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                          >
                            <option value="">Select Reason</option>
                            {returnReasons.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="inline-flex items-center text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={item.verified || false}
                            onChange={(e) =>
                              handleItemChange(index, 'verified', e.target.checked)
                            }
                            className="w-4 h-4 border border-gray-300 rounded mr-2"
                          />
                          Returned quantity counted & matched with documents
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Action on Return
                        </label>
                        <select
                          value={item.action}
                          onChange={(e) => handleItemChange(index, 'action', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">— Select Action —</option>
                          <option value="dispose">Dispose</option>
                          <option value="move_to_stock">Move to Stock</option>
                          <option value="rework">Rework</option>
                          <option value="scrap">Scrap</option>
                        </select>
                      </div>
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

                {/* Checklist Section */}
                <div className="border-t pt-6">
                  <h4 className="font-bold mb-4 text-xl text-red-800 flex items-center gap-2">
                    <span className="bg-red-100 p-2 rounded-lg">📋</span>
                    Warehouse Stock Return Checklist
                  </h4>

                  <div className="space-y-6">
                    {/* Invoice/Debit Note Checklist */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <h5 className="font-bold text-red-900 mb-3 text-sm uppercase tracking-wider">Invoice / Debit Note Verification</h5>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition">
                          <input
                            type="checkbox"
                            checked={formData.checklist.invoiceDebitNote.partyNameVerified}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                invoiceDebitNote: { ...formData.checklist.invoiceDebitNote, partyNameVerified: e.target.checked }
                              }
                            })}
                            className="w-5 h-5 text-red-600 rounded"
                          />
                          <span className="text-sm font-medium">Party Name Verified</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition">
                          <input
                            type="checkbox"
                            checked={formData.checklist.invoiceDebitNote.invoiceNoVerified}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                invoiceDebitNote: { ...formData.checklist.invoiceDebitNote, invoiceNoVerified: e.target.checked }
                              }
                            })}
                            className="w-5 h-5 text-red-600 rounded"
                          />
                          <span className="text-sm font-medium">Invoice Number Verified</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition">
                          <input
                            type="checkbox"
                            checked={formData.checklist.invoiceDebitNote.ewayBillVerified}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                invoiceDebitNote: { ...formData.checklist.invoiceDebitNote, ewayBillVerified: e.target.checked }
                              }
                            })}
                            className="w-5 h-5 text-red-600 rounded"
                          />
                          <span className="text-sm font-medium">E-WAY Bill Verified</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Replenishment Timeline */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h5 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Replenishment Timeline</h5>
                        <input
                          type="date"
                          value={formData.checklist.replenishmentTimeline}
                          onChange={(e) => setFormData({
                            ...formData,
                            checklist: {
                              ...formData.checklist,
                              replenishmentTimeline: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      {/* Communication Status */}
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                        <h5 className="font-bold text-yellow-900 mb-3 text-sm uppercase tracking-wider">Communication Status</h5>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.checklist.communicationStatus.accountsDept}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  communicationStatus: { ...formData.checklist.communicationStatus, accountsDept: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-yellow-600 rounded"
                            />
                            <span className="text-sm">Accounts Dept</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.checklist.communicationStatus.sales}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  communicationStatus: { ...formData.checklist.communicationStatus, sales: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-yellow-600 rounded"
                            />
                            <span className="text-sm">Sales</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.checklist.communicationStatus.oh}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  communicationStatus: { ...formData.checklist.communicationStatus, oh: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-yellow-600 rounded"
                            />
                            <span className="text-sm">OH</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Docs to Accounts */}
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <h5 className="font-bold text-green-900 mb-3 text-sm uppercase tracking-wider">Documents Submitted to Accounts Dept</h5>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition">
                          <input
                            type="checkbox"
                            checked={formData.checklist.docsToAccounts.debitNoteSigned}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                docsToAccounts: { ...formData.checklist.docsToAccounts, debitNoteSigned: e.target.checked }
                              }
                            })}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                          <span className="text-sm font-medium">Debit Note (Signed)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition">
                          <input
                            type="checkbox"
                            checked={formData.checklist.docsToAccounts.grnSigned}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                docsToAccounts: { ...formData.checklist.docsToAccounts, grnSigned: e.target.checked }
                              }
                            })}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                          <span className="text-sm font-medium">GRN (Signed)</span>
                        </label>
                      </div>
                    </div>

                    {/* Department Certifications */}
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <h5 className="font-bold text-purple-900 mb-3 text-sm uppercase tracking-wider">Departmental Verifications</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">Supervisor Name</label>
                          <select
                            value={formData.checklist.certifications.supervisorName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, supervisorName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white"
                          >
                            <option value="">Select Supervisor</option>
                            {companyUsers.filter(u => u.department === 'Supervisor').map((u, i) => <option key={i} value={u.fullName}>{u.fullName}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">Supply Chain Exec</label>
                          <select
                            value={formData.checklist.certifications.supplyChainExecName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, supplyChainExecName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white"
                          >
                            <option value="">Select SC Exec</option>
                            {companyUsers.filter(u => u.department === 'Supply Chain Exec').map((u, i) => <option key={i} value={u.fullName}>{u.fullName}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">Accounts Manager</label>
                          <select
                            value={formData.checklist.certifications.accountsManagerName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, accountsManagerName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white"
                          >
                            <option value="">Select Accounts Mgr</option>
                            {companyUsers.filter(u => u.department === 'Accountant').map((u, i) => <option key={i} value={u.fullName}>{u.fullName}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    Save Return Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Return Details - {selectedReturn.returnNo}</h3>
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
                  <p className="text-gray-600 text-sm">Return No</p>
                  <p className="font-semibold">{selectedReturn.returnNo}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Vendor/Supplier</p>
                  <p className="font-semibold">{selectedReturn.vendors}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Invoice No</p>
                  <p className="font-semibold">{selectedReturn.invoiceNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Return Date</p>
                  <p className="font-semibold">{selectedReturn.returnDate}</p>
                </div>
              </div>

              <h4 className="font-semibold mb-3">Returned Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left">Batch</th>
                      <th className="px-3 py-2 text-left">Exp Date</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-left">Reason</th>
                      <th className="px-3 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2">{item.batchNo}</td>
                        <td className="px-3 py-2">{item.expDate}</td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {item.qtyReturned}
                        </td>
                        <td className="px-3 py-2">{item.reason}</td>
                        <td className="px-3 py-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {item.action ? item.action.replace('_', ' ').toUpperCase() : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedReturn.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Notes</p>
                  <p>{selectedReturn.notes}</p>
                </div>
              )}

              {/* Checklist Detail Section */}
              {selectedReturn.checklist && (
                <div className="mt-6 border-t pt-6 text-sm">
                  <h4 className="font-bold text-lg mb-4 text-red-800 flex items-center gap-2">
                    <span className="bg-red-100 p-2 rounded-lg">📋</span>
                    Return Checklist Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-bold text-xs uppercase text-gray-500 mb-2">Invoice/Debit Note Verification</p>
                      <div className="space-y-1">
                        <p className="flex justify-between">
                          <span>Party Name Verified:</span>
                          <span>{selectedReturn.checklist.invoiceDebitNote.partyNameVerified ? "✅" : "❌"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Invoice No Verified:</span>
                          <span>{selectedReturn.checklist.invoiceDebitNote.invoiceNoVerified ? "✅" : "❌"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>E-Way Bill Verified:</span>
                          <span>{selectedReturn.checklist.invoiceDebitNote.ewayBillVerified ? "✅" : "❌"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="font-bold text-xs uppercase text-yellow-600 mb-2">Communication & Timeline</p>
                      <p className="mb-2">Replenishment Date: <span className="font-semibold">{selectedReturn.checklist.replenishmentTimeline || 'N/A'}</span></p>
                      <div className="flex gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedReturn.checklist.communicationStatus.accountsDept ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>Accounts Dept</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedReturn.checklist.communicationStatus.sales ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>Sales</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedReturn.checklist.communicationStatus.oh ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>OH</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-purple-50 p-4 rounded-lg">
                    <p className="font-bold text-xs uppercase text-purple-600 mb-2">Departmental Verifications</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Supervisor</p>
                        <p className="font-semibold">{selectedReturn.checklist.certifications.supervisorName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Supply Chain</p>
                        <p className="font-semibold">{selectedReturn.checklist.certifications.supplyChainExecName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Accounts Mgr</p>
                        <p className="font-semibold">{selectedReturn.checklist.certifications.accountsManagerName || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t justify-end mt-6">
                <button
                  onClick={() => printReturnsDetail(selectedReturn)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
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
