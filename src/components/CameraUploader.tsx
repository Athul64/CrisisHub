"use client";

import React, { useRef, useState } from "react";
import { Camera, Upload, X, ImageIcon } from "lucide-react";

interface CameraUploaderProps {
  onImageCapture: (base64: string) => void;
  currentImage: string | null;
}

export default function CameraUploader({
  onImageCapture,
  currentImage,
}: CameraUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) convertToBase64(file);
  };

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageCapture(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      convertToBase64(file);
    }
  };

  const clearImage = () => {
    onImageCapture("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-300 mb-2">
        <Camera className="w-4 h-4 inline mr-1.5 -mt-0.5" />
        Photo Evidence
      </label>

      {currentImage ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-600 bg-gray-800">
          <img
            src={currentImage}
            alt="Emergency evidence"
            className="w-full h-48 object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors cursor-pointer"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative w-full h-36 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-200
            ${
              dragOver
                ? "border-red-400 bg-red-500/10"
                : "border-gray-600 bg-gray-800/50 hover:border-red-500/50 hover:bg-gray-800"
            }`}
        >
          <div className="flex items-center gap-3 text-gray-400">
            <ImageIcon className="w-8 h-8" />
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-400">
            Tap to take photo or upload
          </p>
          <p className="text-xs text-gray-500">Drag & drop also supported</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-upload-input"
      />
    </div>
  );
}
