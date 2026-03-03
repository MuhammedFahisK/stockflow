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
import { Plus, X, Download, Eye, Printer } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { printOutgoingDetail } from '../utils/printDetail';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import SignaturePad from '../components/SignaturePad';

export default function Outgoing() {
  const { user, userCompany, userRole } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    ewayBillNo: '',
    recipientName: '',
    recipientAddress: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    items: [
      {
        productName: '',
        barcode: '',
        batchNo: '',
        mfgDate: '',
        expDate: '',
        unit: 'Pcs',
        qtyDispatched: '',
        warehouseLocation: '',
      },
    ],
    supervisorSignature: '',
    accountsSignature: '',
    vehicleNo: '',
    notes: '',
    checklist: {
      invoiceChecklist: {
        invoiceNoVerified: false,
        ewayBillVerified: false,
      },
      productDetails: {
        totalQtyVerified: false,
        batchExpVerified: false,
      },
      driverDetails: {
        driverNamePhoneVerified: false,
        vehicleNoVerified: false,
      },
      docsToDriver: {
        originalInvoice: false,
        eWayBillCopy: false,
        deliveryChallan: false,
        gatePass: false,
      },
      finalConfirmation: {
        qtyRecountMatches: false,
        docsAttached: false,
        driverBriefed: false,
        tripSheetGiven: false,
      },
      driverChecklist: {
        tripSheet: false,
        license: false,
        insurance: false,
        fitness: false,
        pollution: false,
        fastag: false,
        permit: false,
        vehicleCondition: false,
        poVerified: false,
        sealsFixed: false,
        supervisorSigned: false,
      },
      certifications: {
        supervisorName: '',
        accountantName: '',
        supplyChainExecName: '',
        accountsManagerName: '',
      }
    }
  });

  const canCreate = hasPermission(userRole, PERMISSIONS.OUTGOING_CREATE);
  const canDelete = hasPermission(userRole, PERMISSIONS.OUTGOING_DELETE);

  useEffect(() => {
    fetchProducts();
    fetchShipments();
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

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'outgoingStock'),
        where('company', '==', userCompany)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setShipments(data.sort((a, b) => b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime()));
    } catch (error) {
      console.error('Error fetching shipments:', error);
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
          qtyDispatched: '',
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
        alert('Please add at least one product to the shipment');
        return;
      }

      const createdBy =
        user?.displayName || user?.email || user?.uid || '';

      await addDoc(collection(db, 'outgoingStock'), {
        ...formData,
        items: validItems,
        company: userCompany,
        createdBy,
        createdAt: Timestamp.now(),
        status: 'dispatched',
      });

      fetchShipments();
      setShowModal(false);
      setFormData({
        invoiceNo: '',
        ewayBillNo: '',
        recipientName: '',
        recipientAddress: '',
        dispatchDate: new Date().toISOString().split('T')[0],
        items: [
          {
            productName: '',
            barcode: '',
            batchNo: '',
            mfgDate: '',
            expDate: '',
            unit: 'Pcs',
            qtyDispatched: '',
            warehouseLocation: '',
          },
        ],
        supervisorSignature: '',
        accountsSignature: '',
        vehicleNo: '',
        notes: '',
        checklist: {
          invoiceChecklist: {
            invoiceNoVerified: false,
            ewayBillVerified: false,
          },
          productDetails: {
            totalQtyVerified: false,
            batchExpVerified: false,
          },
          driverDetails: {
            driverNamePhoneVerified: false,
            vehicleNoVerified: false,
          },
          docsToDriver: {
            originalInvoice: false,
            eWayBillCopy: false,
            deliveryChallan: false,
            gatePass: false,
          },
          finalConfirmation: {
            qtyRecountMatches: false,
            docsAttached: false,
            driverBriefed: false,
            tripSheetGiven: false,
          },
          driverChecklist: {
            tripSheet: false,
            license: false,
            insurance: false,
            fitness: false,
            pollution: false,
            fastag: false,
            permit: false,
            vehicleCondition: false,
            poVerified: false,
            sealsFixed: false,
            supervisorSigned: false,
          },
          certifications: {
            supervisorName: '',
            accountantName: '',
            supplyChainExecName: '',
            accountsManagerName: '',
          }
        }
      });
    } catch (error) {
      console.error('Error saving shipment:', error);
      alert('Error saving shipment. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        await deleteDoc(doc(db, 'outgoingStock', id));
        fetchShipments();
      } catch (error) {
        console.error('Error deleting shipment:', error);
        alert('Error deleting shipment');
      }
    }
  };

  const handleExport = () => {
    if (shipments.length === 0) {
      alert('No shipments to export');
      return;
    }

    const exportData = shipments.map((ship) => ({
      'Delivery Note No': ship.invoiceNo,
      'E-Way Bill': ship.ewayBillNo || 'N/A',
      'Recipient': ship.recipientName,
      'Dispatch Date': ship.dispatchDate,
      'Items Count': ship.items?.length || 0,
      'Total Qty Dispatched': ship.items?.reduce((sum, item) => sum + parseInt(item.qtyDispatched || 0), 0) || 0,
      'Vehicle No': ship.vehicleNo || 'N/A',
      'Status': ship.status,
      'Created': ship.createdAt?.toDate?.()?.toLocaleDateString() || '-',
    }));

    exportToExcel(exportData, 'outgoing_stock.xlsx', 'Outgoing Stock');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">Outgoing Stock</h1>
          <p className="text-gray-600 text-sm mt-1">Record stock dispatches and shipments</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all font-medium"
            >
              <Plus size={18} />
              New Shipment
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

      {/* Shipments Table */}
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📤</div>
            <p className="text-gray-500 text-lg">No shipments recorded yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first shipment to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">Delivery Note No</th>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">E-Way Bill</th>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">Recipient</th>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">Items</th>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">Total Qty</th>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">Vehicle</th>
                  <th className="px-6 py-4 text-left font-bold text-orange-900">Date</th>
                  <th className="px-6 py-4 text-center font-bold text-orange-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shipments.map((ship) => (
                  <tr key={ship.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-orange-600">{ship.invoiceNo}</td>
                    <td className="px-6 py-4 text-gray-600">{ship.ewayBillNo || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{ship.recipientName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                        {ship.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-orange-600">
                      {ship.items?.reduce((sum, item) => sum + parseInt(item.qtyDispatched || 0), 0) || 0} units
                    </td>
                    <td className="px-6 py-4 text-gray-600">{ship.vehicleNo || '-'}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {ship.createdAt?.toDate?.()?.toLocaleDateString() || '-'}
                    </td>
                    <td className="px-6 py-4 text-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedShipment(ship);
                          setShowDetailModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 p-2 rounded-lg transition inline-block"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(ship.id)}
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

      {/* New Shipment Modal */}
      {showModal && canCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-6">
            <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Create Outgoing Stock Record</h3>
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
                      Delivery Note No * <span className="text-gray-500 font-normal">(Confirms goods delivered)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="DN-001"
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
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) =>
                        setFormData({ ...formData, recipientName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Recipient/Customer Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle No
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleNo}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="DL-01-AB-1234"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Address
                    </label>
                    <textarea
                      value={formData.recipientAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, recipientAddress: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                      rows="2"
                      placeholder="Complete address of recipient"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={formData.dispatchDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dispatchDate: e.target.value })
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
                            disabled
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
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                            disabled
                          />
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Qty Dispatched *
                          </label>
                          <input
                            type="number"
                            value={item.qtyDispatched}
                            onChange={(e) =>
                              handleItemChange(index, 'qtyDispatched', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                          />
                        </div>
                        <div className="flex items-center mt-1 md:mt-6">
                          <label className="inline-flex items-center text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.verified || false}
                              onChange={(e) =>
                                handleItemChange(index, 'verified', e.target.checked)
                              }
                              className="w-4 h-4 border border-gray-300 rounded mr-2"
                            />
                            Qty matches invoice / dispatch checklist done
                          </label>
                        </div>
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
                  <h4 className="font-bold mb-4 text-xl text-orange-800 flex items-center gap-2">
                    <span className="bg-orange-100 p-2 rounded-lg">📋</span>
                    Dispatch & Driver Checklist
                  </h4>

                  <div className="space-y-6">
                    {/* Warehouse Dispatch Checklist */}
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <h5 className="font-bold text-orange-900 mb-3 text-sm uppercase tracking-wider underline">Warehouse PO Dispatch Checklist</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="font-semibold text-xs text-orange-800 uppercase">Verification</p>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.checklist.invoiceChecklist.invoiceNoVerified}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  invoiceChecklist: { ...formData.checklist.invoiceChecklist, invoiceNoVerified: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-sm">Invoice Number Verified</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.checklist.productDetails.totalQtyVerified}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  productDetails: { ...formData.checklist.productDetails, totalQtyVerified: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-sm">Total Quantity Verified</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.checklist.driverDetails.driverNamePhoneVerified}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  driverDetails: { ...formData.checklist.driverDetails, driverNamePhoneVerified: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-sm">Driver Details Verified</span>
                          </label>
                        </div>

                        <div className="space-y-3">
                          <p className="font-semibold text-xs text-orange-800 uppercase">Documents Handed Over</p>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.checklist.docsToDriver.originalInvoice}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  checklist: {
                                    ...formData.checklist,
                                    docsToDriver: { ...formData.checklist.docsToDriver, originalInvoice: e.target.checked }
                                  }
                                })}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-sm">Original Invoice</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.checklist.docsToDriver.deliveryChallan}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  checklist: {
                                    ...formData.checklist,
                                    docsToDriver: { ...formData.checklist.docsToDriver, deliveryChallan: e.target.checked }
                                  }
                                })}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-sm">Delivery Challan</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.checklist.docsToDriver.eWayBillCopy}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  checklist: {
                                    ...formData.checklist,
                                    docsToDriver: { ...formData.checklist.docsToDriver, eWayBillCopy: e.target.checked }
                                  }
                                })}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-sm">E-Way Bill Copy</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.checklist.docsToDriver.gatePass}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  checklist: {
                                    ...formData.checklist,
                                    docsToDriver: { ...formData.checklist.docsToDriver, gatePass: e.target.checked }
                                  }
                                })}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-sm">Gate Pass</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Driver Checklist Section */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h5 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wider underline">Driver Checklist (Section A - Loading)</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.keys(formData.checklist.driverChecklist).map((key) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-blue-200 hover:bg-blue-100">
                            <input
                              type="checkbox"
                              checked={formData.checklist.driverChecklist[key]}
                              onChange={(e) => setFormData({
                                ...formData,
                                checklist: {
                                  ...formData.checklist,
                                  driverChecklist: { ...formData.checklist.driverChecklist, [key]: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Department Certifications */}
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <h5 className="font-bold text-purple-900 mb-3 text-sm uppercase tracking-wider">Departmental Verifications</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">Supervisor</label>
                          <input
                            type="text"
                            value={formData.checklist.certifications.supervisorName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, supervisorName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm"
                            placeholder="Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">Acc. Dept</label>
                          <input
                            type="text"
                            value={formData.checklist.certifications.accountantName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, accountantName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm"
                            placeholder="Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">S.C. Exec</label>
                          <input
                            type="text"
                            value={formData.checklist.certifications.supplyChainExecName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, supplyChainExecName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm"
                            placeholder="Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-600 mb-1">Acc. Manager</label>
                          <input
                            type="text"
                            value={formData.checklist.certifications.accountsManagerName}
                            onChange={(e) => setFormData({
                              ...formData,
                              checklist: {
                                ...formData.checklist,
                                certifications: { ...formData.checklist.certifications, accountsManagerName: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm"
                            placeholder="Name"
                          />
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
                    Save Shipment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Delivery Note Details (confirms goods delivered) - {selectedShipment.invoiceNo}</h3>
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
                  <p className="text-gray-600 text-sm">Delivery Note No</p>
                  <p className="font-semibold">{selectedShipment.invoiceNo}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Recipient</p>
                  <p className="font-semibold">{selectedShipment.recipientName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">E-Way Bill</p>
                  <p className="font-semibold">{selectedShipment.ewayBillNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Vehicle No</p>
                  <p className="font-semibold">{selectedShipment.vehicleNo || 'N/A'}</p>
                </div>
              </div>

              {selectedShipment.recipientAddress && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Recipients Address</p>
                  <p>{selectedShipment.recipientAddress}</p>
                </div>
              )}

              <h4 className="font-semibold mb-3">Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left">Barcode</th>
                      <th className="px-3 py-2 text-left">Batch</th>
                      <th className="px-3 py-2 text-left">Exp Date</th>
                      <th className="px-3 py-2 text-center">Qty Dispatched</th>
                      <th className="px-3 py-2 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedShipment.items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2 font-mono text-xs">{item.barcode}</td>
                        <td className="px-3 py-2">{item.batchNo}</td>
                        <td className="px-3 py-2">{item.expDate}</td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {item.qtyDispatched}
                        </td>
                        <td className="px-3 py-2">{item.warehouseLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedShipment.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Notes</p>
                  <p>{selectedShipment.notes}</p>
                </div>
              )}

              {/* Checklist Detail Section */}
              {selectedShipment.checklist && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-bold text-lg mb-4 text-orange-800 flex items-center gap-2">
                    <span className="bg-orange-100 p-2 rounded-lg">📋</span>
                    Dispatch & Driver Checklist Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-bold text-xs uppercase text-gray-500 mb-2">PO Dispatch Verification</p>
                      <div className="space-y-1">
                        <p className="text-sm flex justify-between">
                          <span>Invoice No Verified:</span>
                          <span>{selectedShipment.checklist.invoiceChecklist.invoiceNoVerified ? "✅" : "❌"}</span>
                        </p>
                        <p className="text-sm flex justify-between">
                          <span>Total Qty Verified:</span>
                          <span>{selectedShipment.checklist.productDetails.totalQtyVerified ? "✅" : "❌"}</span>
                        </p>
                        <p className="text-sm flex justify-between">
                          <span>Driver Details Verified:</span>
                          <span>{selectedShipment.checklist.driverDetails.driverNamePhoneVerified ? "✅" : "❌"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-bold text-xs uppercase text-gray-500 mb-2">Documents to Driver</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-xs">{selectedShipment.checklist.docsToDriver.originalInvoice ? "✅" : "❌"} Invoice</p>
                        <p className="text-xs">{selectedShipment.checklist.docsToDriver.deliveryChallan ? "✅" : "❌"} Challan</p>
                        <p className="text-xs">{selectedShipment.checklist.docsToDriver.eWayBillCopy ? "✅" : "❌"} E-Way Bill</p>
                        <p className="text-xs">{selectedShipment.checklist.docsToDriver.gatePass ? "✅" : "❌"} Gate Pass</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <p className="font-bold text-xs uppercase text-blue-600 mb-2">Driver Checklist (Loading)</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(selectedShipment.checklist.driverChecklist).map(([key, val]) => (
                        <span key={key} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {key.replace(/([A-Z])/g, ' $1').toUpperCase()}: {val ? 'OK' : 'NO'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 bg-purple-50 p-4 rounded-lg">
                    <p className="font-bold text-xs uppercase text-purple-600 mb-2">Departmental Verifications</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Supervisor</p>
                        <p className="text-xs font-semibold">{selectedShipment.checklist.certifications.supervisorName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Accounts</p>
                        <p className="text-xs font-semibold">{selectedShipment.checklist.certifications.accountantName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Supply Chain</p>
                        <p className="text-xs font-semibold">{selectedShipment.checklist.certifications.supplyChainExecName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-400 uppercase font-bold">Acc. Mgr</p>
                        <p className="text-xs font-semibold">{selectedShipment.checklist.certifications.accountsManagerName || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t justify-end mt-6">
                <button
                  onClick={() => printOutgoingDetail(selectedShipment)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
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
