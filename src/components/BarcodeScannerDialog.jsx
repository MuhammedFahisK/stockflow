import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  isBarcodeScannerSupported,
  startBarcodeScan,
  stopBarcodeScan,
} from '../utils/barcodeScanner';

export default function BarcodeScannerDialog({ open, onClose, onDetected }) {
  const reactId = useId();
  const scannerId = useMemo(() => `barcode_scanner_${String(reactId).replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId]);
  const didDetectRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    didDetectRef.current = false;
    setError('');

    if (!isBarcodeScannerSupported()) {
      setError('Camera scanning is not supported in this browser.');
      return;
    }

    startBarcodeScan(
      scannerId,
      async (decodedText) => {
        if (didDetectRef.current) return;
        didDetectRef.current = true;

        try {
          await stopBarcodeScan();
        } finally {
          onDetected?.(decodedText);
        }
      },
      (_err) => {
        // noisy by nature; keep UI clean
      }
    );

    return () => {
      stopBarcodeScan();
    };
  }, [open, scannerId, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="text-sm font-semibold text-gray-900">Scan barcode</p>
            <p className="text-xs text-gray-500">Point your camera at the barcode</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await stopBarcodeScan();
              onClose?.();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-black relative overflow-hidden">
              <div id={scannerId} className="w-full" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-cyan-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500 text-center">
            Move the camera until the barcode fits inside the box. Small barcodes may need to be closer.
          </p>

          <button
            type="button"
            onClick={async () => {
              await stopBarcodeScan();
              onClose?.();
            }}
            className="mt-4 w-full bg-gray-100 text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

