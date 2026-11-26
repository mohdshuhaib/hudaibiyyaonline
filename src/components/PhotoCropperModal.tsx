"use client";

import React, { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Check, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedCompressedBlob } from "@/lib/image-utils";

interface PhotoCropperModalProps {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
}

export default function PhotoCropperModal({
  imageSrc,
  onCancel,
  onCropComplete,
}: PhotoCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedCompressedBlob(imageSrc, croppedAreaPixels, 400);
      const previewUrl = URL.createObjectURL(blob);
      onCropComplete(blob, previewUrl);
    } catch (err) {
      console.error("Crop error:", err);
      alert("ഫോട്ടോ പ്രോസസ്സ് ചെയ്യാൻ സാധിച്ചില്ല. (Could not process photo. Please try another image.)");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between bg-blue-900 text-white px-5 py-4">
          <div>
            <h3 className="font-semibold text-base">
              ഫോട്ടോ ക്രമീകരിക്കുക (Crop Photo)
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              മുഖം വൃത്തത്തിനുള്ളിൽ കൃത്യമായി വയ്ക്കുക • Center face inside circle
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-blue-100 hover:bg-blue-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative h-72 w-full bg-slate-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="p-5 space-y-4 bg-white">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-blue-700 cursor-pointer"
              aria-label="Zoom"
            />
            <ZoomIn className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              റദ്ദാക്കുക (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>സേവ് ചെയ്യുന്നു...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ഉറപ്പിക്കുക (Save Photo)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
