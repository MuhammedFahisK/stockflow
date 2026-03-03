import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function SignaturePad({ value, onChange, label = 'Signature', placeholder = 'Please sign here' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasDrawnRef = useRef(false);

  const getPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    hasDrawnRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const point = getPoint(e);
    if (point) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  }, [getPoint]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const point = getPoint(e);
    if (point) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }, [isDrawing, getPoint]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawnRef.current) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onChange?.(dataUrl);
      } catch (err) {
        console.warn('SignaturePad toDataURL:', err);
      }
    }
  }, [isDrawing, onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    onChange?.('');
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    }
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <p className="text-xs text-gray-500 mb-1">{placeholder}</p>
      <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden min-h-[7rem]">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair block"
          style={{ width: '100%', height: '112px', display: 'block' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Clear
      </button>
      {value && (
        <p className="text-xs text-green-600">Signature captured</p>
      )}
    </div>
  );
}
