import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Check, Image as ImageIcon, Sparkles, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoUploadProps {
  value?: string;
  onChange: (base64String: string) => void;
  onClear: () => void;
}

export default function PhotoUpload({ value, onChange, onClear }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawImage(event.target.result as string);
          setIsCropping(true);
          setZoom(1);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const applyCrop = () => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    if (!ctx) return;

    // Draw the image onto the canvas with visual cropping applied
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    
    // Create circular clip path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Source coordinates calculated based on zoom
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const minDim = Math.min(imgWidth, imgHeight);

    const sourceSize = minDim / zoom;
    const sx = (imgWidth - sourceSize) / 2;
    const sy = (imgHeight - sourceSize) / 2;

    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);

    // Output base64 data URL
    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
    onChange(croppedBase64);
    setIsCropping(false);
    setRawImage(null);
  };

  const loadUnsplashPreset = () => {
    const keywords = ["fitness", "athlete", "bodybuilder", "runner", "yoga", "swimmer", "trainer"];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const id = Math.floor(Math.random() * 1000);
    const unsplashUrl = `https://images.unsplash.com/photo-${1500000000000 + id}?q=80&w=200&auto=format&fit=crop&q=random-${randomKeyword}`;
    onChange(unsplashUrl);
  };

  return (
    <div className="space-y-4 font-sans">
      <AnimatePresence>
        {isCropping && rawImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-55"
          >
            <div className="bg-[#0C0C0E] border border-white/10 rounded-[32px] p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-blue-500" /> Frame and Crop Photo
                </h4>
                <button 
                  type="button"
                  onClick={() => { setIsCropping(false); setRawImage(null); }}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Cropping circle viewport */}
              <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-dashed border-blue-500/50 overflow-hidden flex items-center justify-center bg-black">
                <img 
                  ref={imageRef} 
                  src={rawImage} 
                  alt="Raw Profile Source" 
                  className="max-w-none transition-transform duration-75"
                  style={{
                    transform: `scale(${zoom})`,
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain"
                  }}
                />
              </div>

              {/* Slider scale controller */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.05" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsCropping(false); setRawImage(null); }}
                  className="flex-1 py-2.5 text-xs bg-zinc-900 text-zinc-400 font-medium rounded-xl border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCrop}
                  className="flex-1 py-2.5 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Lock Photo
                </button>
              </div>

              {/* Hidden canvas helper for pixel-cropping */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4 ${
          dragActive 
            ? "border-blue-500 bg-blue-500/5" 
            : "border-white/5 bg-[#070708] hover:border-white/10"
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="hidden" 
        />

        {value ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="relative w-24 h-24 rounded-full border-2 border-white/10 shadow-lg group">
              <img 
                referrerPolicy="no-referrer"
                src={value} 
                alt="Profile Preview" 
                className="w-full h-full rounded-full object-cover" 
              />
              <button
                type="button"
                onClick={onClear}
                className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg shadow-red-500/20"
                title="Remove photo"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium font-mono text-center">Base64 biometric sync loaded successfully.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-blue-400 hover:text-white bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/20 rounded-lg px-2.5 py-1 transition-all"
              >
                Choose Another
              </button>
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] text-red-400 hover:text-white bg-red-500/5 border border-red-500/10 hover:bg-red-500/20 rounded-lg px-2.5 py-1 transition-all"
              >
                Delete Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-zinc-500 mx-auto">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-300">Drag & drop profile photo here</p>
              <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG up to 10MB or choose dynamic preset</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-zinc-300 bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 font-medium hover:text-white hover:border-white/10 transition-colors"
              >
                Browse Files
              </button>
              <button
                type="button"
                onClick={loadUnsplashPreset}
                className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-1.5 font-medium hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
                title="Mock instant athletic camera shot via Unsplash premium index"
              >
                <Sparkles size={10} /> Generate Camera Preset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
