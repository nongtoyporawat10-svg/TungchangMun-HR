import React, { useState, useRef } from 'react';
import { Employee } from '../types';
import { X, Upload, CheckCircle2, User, Image as ImageIcon, Trash2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimizer';

interface BatchPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onUpdateEmployee: (emp: Employee) => void;
}

interface PhotoMatchItem {
  id: string;
  file: File;
  previewUrl: string;
  matchedEmployeeId: string;
  status: 'matched' | 'unmatched' | 'saved';
}

export const BatchPhotoUploadModal: React.FC<BatchPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  employees,
  onUpdateEmployee,
}) => {
  const [photoItems, setPhotoItems] = useState<PhotoMatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: PhotoMatchItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const optimizedUrl = await optimizeImageFile(file, 600, 600, 0.85);
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();

        // Try to find matching employee by name or index
        let matchedEmpId = '';
        const foundByName = employees.find(emp => {
          const empNameClean = emp.name.toLowerCase().replace(/นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\./g, '').trim();
          return fileNameWithoutExt.includes(empNameClean) || empNameClean.includes(fileNameWithoutExt);
        });

        if (foundByName) {
          matchedEmpId = foundByName.id;
        } else {
          // Check if file name is numeric index e.g. "1.jpg", "01.jpg"
          const num = parseInt(fileNameWithoutExt, 10);
          if (!isNaN(num) && num > 0 && num <= employees.length) {
            matchedEmpId = employees[num - 1].id;
          }
        }

        newItems.push({
          id: `photo-${Date.now()}-${i}-${Math.random()}`,
          file,
          previewUrl: optimizedUrl,
          matchedEmployeeId: matchedEmpId,
          status: matchedEmpId ? 'matched' : 'unmatched'
        });
      } catch (err) {
        console.error('Error optimizing batch image:', err);
      }
    }

    setPhotoItems(prev => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveItem = (id: string) => {
    setPhotoItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSelectEmployee = (itemId: string, empId: string) => {
    setPhotoItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          matchedEmployeeId: empId,
          status: empId ? 'matched' : 'unmatched'
        };
      }
      return item;
    }));
  };

  const handleSaveAll = () => {
    let savedCount = 0;
    photoItems.forEach(item => {
      if (item.matchedEmployeeId) {
        const emp = employees.find(e => e.id === item.matchedEmployeeId);
        if (emp) {
          onUpdateEmployee({
            ...emp,
            photoUrl: item.previewUrl,
            avatar: item.previewUrl
          });
          savedCount++;
        }
      }
    });

    alert(`แนบรูปถ่ายบุคลากรสำเร็จ ${savedCount} ท่าน เรียบร้อยแล้ว (ซิงค์ทุกอุปกรณ์ทันที)`);
    onClose();
  };

  const matchedCount = photoItems.filter(p => p.matchedEmployeeId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
              <Upload className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">แนบรูปถ่ายบุคลากร (ทีละหลายรูปพร้อมกัน)</h3>
              <p className="text-xs text-slate-500">
                เลือกรูปภาพจากเครื่อง ระบบจะจับคู่กับชื่อบุคลากรอัตโนมัติ หรือเลือกจับคู่ได้เอง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div className="my-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/80 ring-4 ring-emerald-500/20'
                : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shadow-xs">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                คลิกเลือกไฟล์รูปภาพ หรือ ลากไฟล์รูปถ่ายหลายๆ รูปมาวางที่นี่
              </p>
              <p className="text-xs text-slate-500">
                รองรับไฟล์ JPG, PNG (รูปจากกล้องมือถือ/คอมพิวเตอร์) ระบบจะบีบอัดรูปถ่ายให้อัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Match / Preview List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[150px]">
          {isProcessing && (
            <div className="p-8 text-center bg-slate-50 rounded-2xl animate-pulse flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-700">กำลังประมวลผลและปรับขนาดรูปภาพ...</p>
            </div>
          )}

          {!isProcessing && photoItems.length === 0 && (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100">
              <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">ยังไม่มีรูปภาพที่เลือก กรุณาคลิกเลือกรูปภาพด้านบน</p>
            </div>
          )}

          {!isProcessing && photoItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                item.matchedEmployeeId
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <img
                  src={item.previewUrl}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {idx + 1}. {item.file.name}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500 shrink-0 font-medium">แนบให้กับ:</span>
                    <select
                      value={item.matchedEmployeeId}
                      onChange={(e) => handleSelectEmployee(item.id, e.target.value)}
                      className="text-xs py-1 px-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 max-w-xs truncate"
                    >
                      <option value="">-- กรุณาเลือกบุคลากร --</option>
                      {employees.map((emp, empIdx) => {
                        const hasPic = Boolean(emp.photoUrl || emp.avatar);
                        return (
                          <option key={emp.id} value={emp.id}>
                            {hasPic ? '✓ [มีรูปแล้ว]' : '⚠️ [ยังไม่มีรูป]'} {empIdx + 1}. {emp.name} ({emp.department})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {item.matchedEmployeeId ? (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> จับคู่แล้ว
                  </span>
                ) : (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1 text-amber-600" /> รอเลือกบุคลากร
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="ลบรูปนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
          <span className="text-xs text-slate-600 font-medium">
            เลือกรูปทั้งหมด {photoItems.length} รูป (จับคู่สำเร็จ {matchedCount} คน)
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={matchedCount === 0}
              onClick={handleSaveAll}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกรูปถ่าย ({matchedCount} คน)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
