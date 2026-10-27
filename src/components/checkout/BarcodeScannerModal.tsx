import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const { products } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    if (isOpen) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          mediaStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setStreamActive(true);
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError('Camera access not available or blocked in this environment. Use quick-scan or manual code entry below.');
        });
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  const handleSelectSample = (barcode: string) => {
    onScanSuccess(barcode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold">Barcode Scanner (USB & Camera)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport or Mock Frame */}
        <div className="relative bg-black h-48 flex items-center justify-center overflow-hidden">
          {streamActive ? (
            <video ref={videoRef} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6 text-slate-400">
              <Camera className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60" />
              <p className="text-xs text-slate-300 font-medium">Position product barcode in front of the lens</p>
              <p className="text-2xs text-slate-500 mt-1">USB handheld laser scanners work automatically on any screen!</p>
            </div>
          )}

          {/* Scanner Overlay Sight */}
          <div className="absolute inset-x-12 inset-y-8 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-md" />
          </div>
        </div>

        {cameraError && (
          <div className="px-4 py-2 bg-amber-50 text-amber-800 text-2xs border-b border-amber-200">
            {cameraError}
          </div>
        )}

        <div className="p-4">
          {/* Manual Barcode Input */}
          <form onSubmit={handleManualSubmit} className="mb-4">
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
              Direct Barcode or SKU Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 6161101234567"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
              >
                Scan
              </button>
            </div>
          </form>

          {/* Quick Click Samples */}
          <div>
            <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Tap Sample Barcode to Scan:
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {products.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectSample(p.barcode)}
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-colors text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="block text-2xs text-slate-500 font-mono">{p.barcode}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
