import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, Upload, PenTool, Sparkles, RefreshCw } from 'lucide-react';
import { optimizeSignatureImage } from '../utils/imageOptimizer';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  signerName?: string;
  roleName?: string;
  currentSignatureUrl?: string | null;
  onSaveSignature?: (dataUrl: string) => void;
  onSave?: (dataUrl: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  title,
  signerName,
  roleName,
  currentSignatureUrl,
  onSaveSignature,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState('#0f2b82'); // Authentic Thai official blue ink
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = signerName || roleName || 'ผู้ลงนาม';

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);

        if (currentSignatureUrl && currentSignatureUrl.startsWith('data:image')) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDrawn(true);
          };
          img.src = currentSignatureUrl;
        }
      }
    }
  }, [isOpen, currentSignatureUrl]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = strokeWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSaveSignature) {
      onSaveSignature(dataUrl);
    }
    if (onSave) {
      onSave(dataUrl);
    }
    onClose();
  };

  const processUploadedFile = async (file: File) => {
    try {
      setIsProcessing(true);
      const optimizedUrl = await optimizeSignatureImage(file, {
        removeBackground: true,
        inkColor: inkColor === '#0f2b82' ? 'blue' : inkColor === '#1e293b' ? 'black' : 'original',
        maxWidth: 420,
        maxHeight: 180,
      });

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasDrawn(true);
        }
      };
      img.src = optimizedUrl;
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถประมวลผลไฟล์ลายเซ็นได้');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processUploadedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">สำหรับ: {displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signature Canvas / Drop Area */}
        <div 
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          className="space-y-2"
        >
          <div className={`relative border-2 border-dashed rounded-2xl overflow-hidden touch-none flex justify-center items-center shadow-inner transition-all ${
            isDragging ? 'border-blue-500 bg-blue-100/50' : 'border-blue-300 bg-blue-50/20'
          }`}>
            <canvas
              ref={canvasRef}
              width={420}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair bg-transparent w-full h-[180px]"
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center space-x-2 text-blue-900 font-bold text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังตัดพื้นหลังลายเซ็นอัตโนมัติ...</span>
              </div>
            )}

            {!hasDrawn && !isProcessing && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-blue-400/60 space-y-1">
                <PenTool className="w-7 h-7" />
                <span className="text-xs font-semibold">เซ็นชื่อด้วยนิ้วมือ/เมาส์ หรือลากไฟล์รูปภาพมาวาง</span>
              </div>
            )}
          </div>

          {/* Color & Tool Options */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">สีหมึก:</span>
              <button
                type="button"
                onClick={() => setInkColor('#0f2b82')}
                className={`w-6 h-6 rounded-full bg-[#0f2b82] ring-2 transition-all cursor-pointer ${
                  inkColor === '#0f2b82' ? 'ring-emerald-500 scale-110' : 'ring-transparent'
                }`}
                title="หมึกสีน้ำเงินราชการ"
              />
              <button
                type="button"
                onClick={() => setInkColor('#1e293b')}
                className={`w-6 h-6 rounded-full bg-[#1e293b] ring-2 transition-all cursor-pointer ${
                  inkColor === '#1e293b' ? 'ring-emerald-500 scale-110' : 'ring-transparent'
                }`}
                title="หมึกสีดำ"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้ารูป</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้าง</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ใช้ลายเซ็นนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};

