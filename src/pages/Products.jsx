import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit2, Plus, Search, Download, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import BarcodeScannerDialog from '../components/BarcodeScannerDialog';

export default function Products() {
  const { userCompany, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    barcode: '',
    unit: 'Pcs',
    batches: [{ batchNo: '', mfgDate: '', expDate: '', qty: '' }],
  });

  const canCreate = hasPermission(userRole, PERMISSIONS.PRODUCT_CREATE);
  const canUpdate = hasPermission(userRole, PERMISSIONS.PRODUCT_UPDATE);
  const canDelete = hasPermission(userRole, PERMISSIONS.PRODUCT_DELETE);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [userCompany]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('company', '==', userCompany));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleBatchChange = (index, field, value) => {
    const newBatches = [...formData.batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    setFormData({ ...formData, batches: newBatches });
  };

  const addBatch = () => {
    setFormData({
      ...formData,
      batches: [...formData.batches, { batchNo: '', mfgDate: '', expDate: '', qty: '' }],
    });
  };

  const removeBatch = (index) => {
    if (formData.batches.length <= 1) return;
    setFormData({
      ...formData,
      batches: formData.batches.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validBatches = formData.batches.filter((b) => b.batchNo && String(b.qty).trim() !== '');
      if (validBatches.length === 0) {
        alert('Add at least one batch with Batch No and Qty');
        return;
      }
      const totalQty = validBatches.reduce((sum, b) => sum + parseInt(b.qty || 0, 10), 0);
      const payload = {
        productName: formData.productName,
        barcode: formData.barcode,
        unit: formData.unit,
        batches: validBatches,
        qty: totalQty,
        batchNo: validBatches.map((b) => b.batchNo).join(', '),
        mfgDate: validBatches[0]?.mfgDate || '',
        expDate: validBatches[0]?.expDate || '',
      };
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...payload,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          company: userCompany,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      fetchProducts();
      setShowModal(false);
      setFormData({
        productName: '',
        barcode: '',
        unit: 'Pcs',
        batches: [{ batchNo: '', mfgDate: '', expDate: '', qty: '' }],
      });
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    const batches = product.batches?.length
      ? product.batches
      : [{ batchNo: product.batchNo || '', mfgDate: product.mfgDate || '', expDate: product.expDate || '', qty: product.qty || '' }];
    setFormData({
      productName: product.productName,
      barcode: product.barcode,
      unit: product.unit || 'Pcs',
      batches,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      alert('No products to export');
      return;
    }
    exportToExcel(
      filteredProducts.map(({ id, createdAt, updatedAt, ...rest }) => rest),
      'products.xlsx',
      'Products'
    );
  };

  const batchOptions = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.batches?.length) {
        p.batches.forEach((b) => b.batchNo && set.add(b.batchNo));
      } else if (p.batchNo) {
        p.batchNo.split(',').forEach((b) => set.add(b.trim()));
      }
    });
    return [...set].filter(Boolean).sort();
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (!batchFilter) return true;
    const batches = product.batches || (product.batchNo ? [{ batchNo: product.batchNo }] : []);
    const batchNos = product.batchNo?.split(',').map((b) => b.trim()) || batches.map((b) => b.batchNo);
    return batchNos.some((b) => b === batchFilter);
  });

  const getProductBatches = (product) => {
    if (product.batches?.length) return product.batches;
    if (product.batchNo) {
      return product.batchNo.split(',').map((b) => ({
        batchNo: b.trim(),
        mfgDate: product.mfgDate || '',
        expDate: product.expDate || '',
        qty: product.qty || '',
      }));
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 text-sm mt-1">Manage product inventory</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {canCreate && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  productName: '',
                  barcode: '',
                  unit: 'Pcs',
                  batches: [{ batchNo: '', mfgDate: '', expDate: '', qty: '' }],
                });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium"
            >
              <Plus size={18} />
              Add Product
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by product name or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="sm:w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All batches</option>
          {batchOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-2">Start by adding your first product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-10"></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Barcode</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Qty</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const batches = getProductBatches(product);
                  const isExpanded = expandedProductId === product.id;
                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          {batches.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-600"
                              aria-label={isExpanded ? 'Collapse batches' : 'Expand batches'}
                            >
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          ) : (
                            <span className="inline-block w-8" />
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{product.productName}</td>
                        <td className="px-6 py-3 text-sm font-mono text-gray-600">{product.barcode}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{product.unit || 'Pcs'}</td>
                        <td className="px-6 py-3 text-sm font-bold text-right text-gray-900">{product.qty}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded transition inline-block"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded transition inline-block"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && batches.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <div className="pl-12">
                              <h4 className="font-semibold text-gray-800 mb-3">Batches</h4>
                              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Batch No</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">MFG Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Exp Date</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Qty</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {batches.map((batch, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-2 text-sm font-mono text-gray-900">{batch.batchNo}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">
                                        {batch.mfgDate ? new Date(batch.mfgDate).toLocaleDateString() : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        {batch.expDate ? (
                                          <span className={new Date(batch.expDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                            {new Date(batch.expDate).toLocaleDateString()}
                                          </span>
                                        ) : (
                                          '-'
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-sm font-bold text-right text-gray-900">{batch.qty ?? '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && canCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter barcode"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setScanOpen(true)}
                      className="shrink-0 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition inline-flex items-center justify-center"
                      title="Scan barcode with camera"
                      aria-label="Scan barcode with camera"
                    >
                      <Camera size={18} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="Pcs">Pieces</option>
                    <option value="Box">Box</option>
                    <option value="Carton">Carton</option>
                    <option value="Kg">Kilogram</option>
                    <option value="Liter">Liter</option>
                  </select>
                </div>

                {/* Batches */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Batches *
                    </label>
                    <button
                      type="button"
                      onClick={addBatch}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add batch
                    </button>
                  </div>
                  {formData.batches.map((batch, index) => (
                    <div
                      key={index}
                      className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 relative"
                    >
                      {formData.batches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBatch(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-1"
                          aria-label="Remove batch"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Batch No *</label>
                          <input
                            type="text"
                            value={batch.batchNo}
                            onChange={(e) => handleBatchChange(index, 'batchNo', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. BATCH 2025"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label>
                          <input
                            type="number"
                            min="0"
                            value={batch.qty}
                            onChange={(e) => handleBatchChange(index, 'qty', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">MFG Date</label>
                          <input
                            type="date"
                            value={batch.mfgDate}
                            onChange={(e) => handleBatchChange(index, 'mfgDate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Exp Date</label>
                          <input
                            type="date"
                            value={batch.expDate}
                            onChange={(e) => handleBatchChange(index, 'expDate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <BarcodeScannerDialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(code) => {
          setFormData((prev) => ({ ...prev, barcode: code }));
          setScanOpen(false);
        }}
      />
    </div>
  );
}
