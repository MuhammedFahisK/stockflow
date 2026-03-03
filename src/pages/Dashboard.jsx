import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Box, BarChart3, RefreshCw, Eye, Camera } from "lucide-react";
import BarcodeScannerDialog from "../components/BarcodeScannerDialog";

export default function Dashboard() {
  const { userCompany } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    incomingCount: 0,
    outgoingCount: 0,
    returnsCount: 0,
    totalUsers: 0,
  });
  const [barcode, setBarcode] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [userCompany]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const productsQuery = query(
        collection(db, "products"),
        where("company", "==", userCompany)
      );
      const productsSnap = await getDocs(productsQuery);
      const totalProducts = productsSnap.size;
      const totalQuantity = productsSnap.docs.reduce(
        (sum, doc) => sum + parseInt(doc.data().qty || 0),
        0
      );

      const incomingQuery = query(
        collection(db, "incomingStock"),
        where("company", "==", userCompany)
      );
      const incomingSnap = await getDocs(incomingQuery);

      const outgoingQuery = query(
        collection(db, "outgoingStock"),
        where("company", "==", userCompany)
      );
      const outgoingSnap = await getDocs(outgoingQuery);

      const returnsQuery = query(
        collection(db, "returns"),
        where("company", "==", userCompany)
      );
      const returnsSnap = await getDocs(returnsQuery);

      const usersQuery = query(
        collection(db, "users"),
        where("company", "==", userCompany)
      );
      const usersSnap = await getDocs(usersQuery);

      setStats({
        totalProducts,
        totalQuantity,
        incomingCount: incomingSnap.size,
        outgoingCount: outgoingSnap.size,
        returnsCount: returnsSnap.size,
        totalUsers: usersSnap.size,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = barcode?.trim();
    if (!code) {
      setVerifyResult({ status: "error", message: "Enter or scan a barcode first" });
      return;
    }
    setVerifyResult({ status: "loading" });
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("company", "==", userCompany)
      );
      const snapshot = await getDocs(productsQuery);
      const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const found = products.find((p) => {
        if (p.barcode === code) return true;
        if (p.batchNo && p.batchNo.split(",").some((b) => b.trim() === code)) return true;
        if (p.batches?.some((b) => b.batchNo === code)) return true;
        return false;
      });
      if (found) {
        setVerifyResult({
          status: "found",
          product: {
            name: found.productName,
            barcode: found.barcode,
            unit: found.unit || "Pcs",
            qty: found.qty,
          },
        });
      } else {
        setVerifyResult({ status: "not_found", message: "No product found with this barcode" });
      }
    } catch (err) {
      console.error("Verify error:", err);
      setVerifyResult({ status: "error", message: "Failed to verify barcode" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Overview of current stock activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Products"
          value={loading ? "..." : stats.totalProducts}
          description="Unique products in catalog"
          icon={<Box className="text-blue-500" size={24} />}
        />
        <Card
          title="Total Stock Quantity"
          value={loading ? "..." : stats.totalQuantity}
          description="Total units across all products"
          icon={<BarChart3 className="text-green-500" size={24} />}
        />
        <Card
          title="Incoming Today"
          value={loading ? "..." : stats.incomingCount}
          description="Number of incoming invoices"
          icon={<RefreshCw className="text-purple-500" size={24} />}
        />
        <Card
          title="Outgoing Today"
          value={loading ? "..." : stats.outgoingCount}
          description="Number of outgoing invoices"
          icon={<RefreshCw className="text-orange-500" size={24} />}
        />
      </div>

      {/* Process Transaction */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Transaction</h3>
        <p className="text-gray-600 text-sm mb-4">
          Scan a product barcode to identify it before recording a transaction on the stock pages.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Eye className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Enter barcode manually..."
              value={barcode}
              onChange={(e) => {
                setBarcode(e.target.value);
                setVerifyResult(null);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Scan
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifyResult?.status === "loading"}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition sm:w-auto w-full"
            >
              {verifyResult?.status === "loading" ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
        {verifyResult && verifyResult.status !== "loading" && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              verifyResult.status === "found"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {verifyResult.status === "found" ? (
              <div>
                <p className="font-semibold">Product found</p>
                <p className="text-sm mt-1">
                  {verifyResult.product.name} — {verifyResult.product.qty} {verifyResult.product.unit}
                </p>
              </div>
            ) : (
              <p className="text-sm">{verifyResult.message}</p>
            )}
          </div>
        )}
      </div>

      <BarcodeScannerDialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(code) => {
          setBarcode(code);
          setVerifyResult(null);
          setScanOpen(false);
        }}
      />

      {/* Current Stock Levels */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Stock Levels</h3>
        <p className="text-gray-600 text-sm mb-4">
          An overview of all items currently in stock.
        </p>
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          Stock summary and recent changes will appear here.
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, description, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-gray-600 text-xs">{description}</p>
    </div>
  );
}