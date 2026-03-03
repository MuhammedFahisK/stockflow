import { Html5Qrcode } from 'html5-qrcode';

let html5QrcodeScanner = null;

export const startBarcodeScan = (elementId, onScanSuccess, onScanError) => {
  try {
    html5QrcodeScanner = new Html5Qrcode(elementId);

    const qrbox = (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      // allow a smaller minimum so small barcodes can be scanned up-close
      const size = Math.max(120, Math.floor(minEdge * 0.6));
      return { width: size, height: size };
    };

    const config = {
      fps: 20,
      qrbox,
      rememberLastUsedCamera: true,
      aspectRatio: 1.77778,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      // Request higher-res video and a continuous focus mode where supported
      videoConstraints: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [
          // Some browsers/hardware expose focusMode via advanced constraints
          { focusMode: 'continuous' }
        ]
      }
    };

    // start() returns a Promise; once running, try to configure the video track
    html5QrcodeScanner
      .start({ facingMode: 'environment' }, config, onScanSuccess, onScanError)
      .then(() => {
        // attempt to auto-configure zoom / focus for close-up barcodes
        try {
          configureVideoForCloseScans(elementId);
        } catch (err) {
          console.warn('Failed to configure camera for close-up scans', err);
        }
      })
      .catch((err) => {
        console.error('Error starting html5QrcodeScanner:', err);
      });
  } catch (err) {
    console.error('Error starting barcode scanner:', err);
  }
};

// Try to enable zoom and continuous focus when supported by the camera track.
const configureVideoForCloseScans = async (elementId) => {
  try {
    const container = document.getElementById(elementId);
    if (!container) return;

    // html5-qrcode places a video element inside the container; find it
    const video = container.querySelector('video');
    if (!video) return;

    const stream = video.srcObject;
    if (!stream) return;

    const track = stream.getVideoTracks && stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    const advanced = [];

    if ('zoom' in capabilities) {
      // try ~2x zoom or the maximum allowed
      const preferred = Math.min(capabilities.max || 2, Math.max(capabilities.min || 1, 2));
      advanced.push({ zoom: preferred });
    }

    // focusMode or focusDistance may be available on some devices
    if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
      advanced.push({ focusMode: 'continuous' });
    } else if ('focusDistance' in capabilities) {
      // move focus to the near end if possible
      const near = capabilities.focusDistance.min ?? 0;
      advanced.push({ focusDistance: near });
    }

    if (advanced.length) {
      await track.applyConstraints({ advanced });
    }
  } catch (err) {
    // non-fatal; just log and continue
    console.warn('configureVideoForCloseScans error:', err);
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
