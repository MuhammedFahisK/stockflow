import { Html5Qrcode } from 'html5-qrcode';

let html5QrcodeScanner = null;

export const startBarcodeScan = (elementId, onScanSuccess, onScanError) => {
  try {
    html5QrcodeScanner = new Html5Qrcode(elementId);

    const qrbox = (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.max(220, Math.floor(minEdge * 0.75));
      return { width: size, height: size };
    };

    const config = {
      fps: 12,
      qrbox,
      rememberLastUsedCamera: true,
      aspectRatio: 1.77778,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    };

    html5QrcodeScanner.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      onScanError
    );
  } catch (err) {
    console.error('Error starting barcode scanner:', err);
  }
};

export const stopBarcodeScan = async () => {
  if (html5QrcodeScanner) {
    try {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner = null;
    } catch (err) {
      console.error('Error stopping barcode scanner:', err);
    }
  }
};

export const isBarcodeScannerSupported = () => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};
