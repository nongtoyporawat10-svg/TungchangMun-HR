import React, { useState, useRef } from 'react';
import { Employee, OfficialSignatures } from '../types';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  User, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  PenTool, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Sliders,
  Check,
  Building2,
  FileCheck
} from 'lucide-react';
import { optimizeSignatureImage } from '../utils/imageOptimizer';
import { DEPARTMENT_SUPERVISORS_LIST, DepartmentSupervisorInfo } from '../utils/supervisorConfig';

interface BatchSignatureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onUpdateEmployee: (emp: Employee) => void;
  officialSignatures?: OfficialSignatures;
  onUpdateOfficialSignatures?: (signatures: OfficialSignatures) => void;
}

interface SignatureMatchItem {
  id: string;
  file: File;
  previewUrl: string;
  matchedEmployeeId: string;
  matchedLeadershipRole?: string; // 'mayor' | 'clerk' | 'checker' | deptKey
  status: 'matched' | 'unmatched' | 'saved';
}

export const BatchSignatureUploadModal: React.FC<BatchSignatureUploadModalProps> = ({
  isOpen,
  onClose,
  employees,
  onUpdateEmployee,
  officialSignatures = {},
  onUpdateOfficialSignatures,
}) => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'leadership'>('personnel');
  const [sigItems, setSigItems] = useState<SignatureMatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inkColorMode, setInkColorMode] = useState<'blue' | 'black' | 'original'>('blue');
  const [removeBackground, setRemoveBackground] = useState<boolean>(true);
  
  // Leadership signatures local state
  const [leadershipSigs, setLeadershipSigs] = useState<OfficialSignatures>(officialSignatures);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const leadershipInputRef = useRef<HTMLInputElement>(null);
  const [activeLeadershipTarget, setActiveLeadershipTarget] = useState<string | null>(null);

  if (!isOpen) return null;

  const processAndMatchFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: SignatureMatchItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const optimizedUrl = await optimizeSignatureImage(file, {
          removeBackground,
          inkColor: inkColorMode,
          maxWidth: 480,
          maxHeight: 200,
        });

        const fileName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();

        // 1. Check if leadership signature
        let matchedLeadership = '';
        if (fileName.includes('นายก') || fileName.includes('วินัย') || fileName.includes('mayor')) {
          matchedLeadership = 'mayor';
        } else if (fileName.includes('ปลัด') || fileName.includes('clerk') || fileName.includes('deputy')) {
          matchedLeadership = 'clerk';
        } else if (fileName.includes('ตรวจ') || fileName.includes('สุพรรณี') || fileName.includes('checker') || fileName.includes('hr')) {
          matchedLeadership = 'checker';
        } else if (fileName.includes('ติยภา') || fileName.includes('ติยาภา')) {
          matchedLeadership = 'dept_office_of_clerk';
        } else if (fileName.includes('สุวารี') || fileName.includes('คลัง')) {
          matchedLeadership = 'dept_finance';
        } else if (fileName.includes('สุกิจ') || fileName.includes('ช่าง')) {
          matchedLeadership = 'dept_engineering';
        } else if (fileName.includes('ดาเรศ') || fileName.includes('สาธารณสุข')) {
          matchedLeadership = 'dept_public_health';
        } else if (fileName.includes('บานเย็น') || fileName.includes('ศึกษา')) {
          matchedLeadership = 'dept_education';
        } else if (fileName.includes('วิชชุดา') || fileName.includes('ยุทธศาสตร์') || fileName.includes('งบประมาณ')) {
          matchedLeadership = 'dept_strategy';
        }

        // 2. Try to find matching employee by name or index
        let matchedEmpId = '';
        if (!matchedLeadership) {
          const foundByName = employees.find(emp => {
            const empNameClean = emp.name.toLowerCase().replace(/นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\./g, '').trim();
            return fileName.includes(empNameClean) || empNameClean.includes(fileName);
          });

          if (foundByName) {
            matchedEmpId = foundByName.id;
          } else {
            // Check if file name is numeric index e.g. "1.png", "01.jpg"
            const num = parseInt(fileName, 10);
            if (!isNaN(num) && num > 0 && num <= employees.length) {
              matchedEmpId = employees[num - 1].id;
            }
          }
        }

        newItems.push({
          id: `sig-${Date.now()}-${i}-${Math.random()}`,
          file,
          previewUrl: optimizedUrl,
          matchedEmployeeId: matchedEmpId,
          matchedLeadershipRole: matchedLeadership,
          status: (matchedEmpId || matchedLeadership) ? 'matched' : 'unmatched'
        });
      } catch (err) {
        console.error('Error optimizing signature image:', err);
      }
    }

    setSigItems(prev => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndMatchFiles(e.dataTransfer.files);
    }
  };

  const handleApplyAllPersonnelSignatures = () => {
    let savedCount = 0;
    sigItems.forEach(item => {
      if (item.matchedEmployeeId) {
        const emp = employees.find(e => e.id === item.matchedEmployeeId);
        if (emp) {
          onUpdateEmployee({
            ...emp,
            signatureUrl: item.previewUrl
          });
          savedCount++;
        }
      } else if (item.matchedLeadershipRole) {
        setLeadershipSigs(prev => {
          const updated = {
            ...prev,
            [item.matchedLeadershipRole as string]: item.previewUrl
          };
          if (onUpdateOfficialSignatures) {
            onUpdateOfficialSignatures(updated);
          }
          return updated;
        });
        savedCount++;
      }
    });

    // Update statuses
    setSigItems(prev => prev.map(item => ({ ...item, status: 'saved' })));
    alert(`นำเข้าและบันทึกลายเซ็นสำเร็จทั้งหมด ${savedCount} รายการ`);
  };

  const handleLeadershipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLeadershipTarget) return;

    try {
      setIsProcessing(true);
      const optimizedUrl = await optimizeSignatureImage(file, {
        removeBackground: true,
        inkColor: 'blue',
        maxWidth: 480,
        maxHeight: 200,
      });

      let updated: OfficialSignatures;
      if (activeLeadershipTarget.startsWith('dept_')) {
        const deptKey = activeLeadershipTarget.replace('dept_', '');
        updated = {
          ...leadershipSigs,
          deptHeadByDept: {
            ...(leadershipSigs.deptHeadByDept || {}),
            [deptKey]: optimizedUrl
          }
        };
      } else {
        updated = {
          ...leadershipSigs,
          [activeLeadershipTarget]: optimizedUrl
        };
      }

      setLeadershipSigs(updated);
      if (onUpdateOfficialSignatures) {
        onUpdateOfficialSignatures(updated);
      }
      try {
        localStorage.setItem('thungchang_official_signatures', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to persist official signatures to localStorage', err);
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถนำเข้ารูปลายเซ็นได้');
    } finally {
      setIsProcessing(false);
      setActiveLeadershipTarget(null);
      if (leadershipInputRef.current) leadershipInputRef.current.value = '';
    }
  };

  const handleRemoveLeadershipSig = (target: string) => {
    let updated: OfficialSignatures = { ...leadershipSigs };
    if (target.startsWith('dept_')) {
      const deptKey = target.replace('dept_', '');
      if (updated.deptHeadByDept) {
        const newDeptSigs = { ...updated.deptHeadByDept };
        delete newDeptSigs[deptKey];
        updated.deptHeadByDept = newDeptSigs;
      }
    } else {
      delete updated[target as keyof OfficialSignatures];
    }
    setLeadershipSigs(updated);
    if (onUpdateOfficialSignatures) {
      onUpdateOfficialSignatures(updated);
    }
    try {
      localStorage.setItem('thungchang_official_signatures', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist official signatures', err);
    }
  };

  const matchedCount = sigItems.filter(i => i.matchedEmployeeId || i.matchedLeadershipRole).length;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-blue-100 text-blue-900 rounded-2xl flex items-center justify-center shadow-xs">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>ระบบนำเข้าและจัดการลายเซ็นดิจิทัล</span>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                  AI Ink Isolation
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                นำเข้ารูปลายเซ็นจากภาพถ่ายหรือสแกน พร้อมระบบตัดพื้นหลังกระดาษให้โปร่งใสอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex space-x-2 pt-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('personnel')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'personnel'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-950/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>นำเข้าลายเซ็นบุคลากร ({employees.filter(e => !!e.signatureUrl).length}/{employees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leadership')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'leadership'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-950/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ลายเซ็นผู้บริหารและผู้ตรวจสอบ</span>
          </button>
        </div>

        {/* TAB 1: PERSONNEL SIGNATURES BATCH IMPORT */}
        {activeTab === 'personnel' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            
            {/* Options Bar */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <span>ลบพื้นหลังกระดาษอัตโนมัติ (ทำให้โปร่งใส)</span>
                </label>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-medium">สีหมึก:</span>
                  <button
                    type="button"
                    onClick={() => setInkColorMode('blue')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      inkColorMode === 'blue'
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    น้ำเงินราชการ
                  </button>
                  <button
                    type="button"
                    onClick={() => setInkColorMode('black')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      inkColorMode === 'black'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ดำ
                  </button>
                  <button
                    type="button"
                    onClick={() => setInkColorMode('original')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      inkColorMode === 'original'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    สีเดิมของรูป
                  </button>
                </div>
              </div>

              <div className="text-slate-500 text-[11px]">
                💡 รองรับไฟล์ JPG, PNG, WebP (จากมือถือหรือเครื่องสแกน)
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processAndMatchFiles(e.target.files);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์ หรือ ลากรูปลายเซ็นหลายๆ ไฟล์มาวางที่นี่
                </h4>
                <p className="text-xs text-slate-500 max-w-md">
                  ระบบจะจับคู่ชื่อไฟล์กับรายชื่อบุคลากรในเทศบาลให้โดยอัตโนมัติ (เช่น "สายรุ้ง_sign.jpg" หรือ "01_ลายเซ็น.png")
                </p>
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-center space-x-3 text-blue-900">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">กำลังตัดพื้นหลังและปรับคุณภาพรูปลายเซ็น...</span>
              </div>
            )}

            {/* Uploaded Signatures Grid */}
            {sigItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-2">
                    <span>รายการลายเซ็นที่เลือก ({sigItems.length} รูป)</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      จับคู่ได้ {matchedCount}/{sigItems.length}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSigItems([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    ล้างรายการทั้งหมด
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {sigItems.map((item) => {
                    const matchedEmp = employees.find(e => e.id === item.matchedEmployeeId);
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center space-x-3 bg-white shadow-xs ${
                          item.matchedEmployeeId || item.matchedLeadershipRole
                            ? 'border-emerald-200 ring-1 ring-emerald-100'
                            : 'border-amber-200 bg-amber-50/20'
                        }`}
                      >
                        {/* Signature Preview Thumbnail with transparency checkerboard */}
                        <div 
                          className="w-24 h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1 relative shrink-0 overflow-hidden"
                          style={{
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                            backgroundSize: '8px 8px'
                          }}
                        >
                          <img
                            src={item.previewUrl}
                            alt="Signature Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        {/* Details & Match Selector */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-[11px] font-bold text-slate-600 truncate" title={item.file.name}>
                            {item.file.name}
                          </p>

                          <select
                            value={item.matchedEmployeeId}
                            onChange={(e) => {
                              const newEmpId = e.target.value;
                              setSigItems(prev => prev.map(si => 
                                si.id === item.id 
                                  ? { ...si, matchedEmployeeId: newEmpId, status: newEmpId ? 'matched' : 'unmatched' }
                                  : si
                              ));
                            }}
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">-- เลือกบุคลากรเจ้าของลายเซ็น --</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.department})
                              </option>
                            ))}
                          </select>

                          {matchedEmp && (
                            <p className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ตรงกับ: {matchedEmp.name} ({matchedEmp.position})</span>
                            </p>
                          )}
                        </div>

                        {/* Remove item */}
                        <button
                          type="button"
                          onClick={() => setSigItems(prev => prev.filter(si => si.id !== item.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of currently enrolled personnel signatures */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                สถานะลายเซ็นของบุคลากรในระบบ ({employees.filter(e => !!e.signatureUrl).length}/{employees.length} คน)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    className={`p-2 rounded-xl border text-xs flex flex-col justify-between ${
                      emp.signatureUrl
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="font-bold text-slate-800 truncate" title={emp.name}>
                      {emp.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mb-1">
                      {emp.position}
                    </div>
                    {emp.signatureUrl ? (
                      <div className="h-8 bg-white/80 rounded-lg border border-blue-100 flex items-center justify-center p-0.5">
                        <img src={emp.signatureUrl} alt={emp.name} className="max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic py-1 text-center">
                        ยังไม่มีลายเซ็น
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LEADERSHIP SIGNATURES */}
        {activeTab === 'leadership' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-800" />
                <span>ลายเซ็นตำแหน่งผู้บริหารและผู้ตรวจสอบประจำสำนักงานเทศบาลตำบลทุ่งช้าง</span>
              </p>
              <p className="text-slate-600">
                เมื่อนำเข้าลายเซ็นในส่วนนี้ ลายเซ็นจะถูกนำไปใช้ในเอกสารแบบใบลาของทุกคนโดยอัตโนมัติ ไม่ต้องเซ็นใหม่ทุกครั้ง
              </p>
            </div>

            <input
              type="file"
              ref={leadershipInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLeadershipUpload}
            />

            {/* 1. Main Executives & Checker */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-800" />
                <span>1. ผู้บริหารและผู้ตรวจสอบสถิติวันลา</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1.1 นายกเทศมนตรีตำบลทุ่งช้าง */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">นายกเทศมนตรีตำบลทุ่งช้าง</h4>
                      <p className="text-[11px] text-slate-600">นายวินัย พนาขวา</p>
                      <span className="text-[10px] text-blue-700 font-medium">ผู้อนุมัติคำสั่งการลา</span>
                    </div>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                      ผู้มีอำนาจ
                    </span>
                  </div>

                  <div 
                    className="h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1.5 relative"
                    style={{
                      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                      backgroundSize: '8px 8px'
                    }}
                  >
                    {leadershipSigs.mayor ? (
                      <img src={leadershipSigs.mayor} alt="Mayor Signature" className="max-h-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">ใช้ลายเซ็นดิจิทัลมาตรฐาน</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-1.5">
                    {leadershipSigs.mayor && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeadershipSig('mayor')}
                        className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        ลบออก
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLeadershipTarget('mayor');
                        leadershipInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>อัปโหลด</span>
                    </button>
                  </div>
                </div>

                {/* 1.2 ปลัดเทศบาลตำบลทุ่งช้าง / ผู้รักษาราชการแทน */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">ปลัดเทศบาลตำบลทุ่งช้าง</h4>
                      <p className="text-[11px] text-slate-600">นางสาวติยภา สัจจา</p>
                      <span className="text-[10px] text-slate-500 font-medium">รักษาราชการแทนปลัดฯ</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
                      ความเห็นปลัดฯ
                    </span>
                  </div>

                  <div 
                    className="h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1.5 relative"
                    style={{
                      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                      backgroundSize: '8px 8px'
                    }}
                  >
                    {leadershipSigs.clerk ? (
                      <img src={leadershipSigs.clerk} alt="Clerk Signature" className="max-h-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">ใช้ลายเซ็นดิจิทัลมาตรฐาน</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-1.5">
                    {leadershipSigs.clerk && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeadershipSig('clerk')}
                        className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        ลบออก
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLeadershipTarget('clerk');
                        leadershipInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>อัปโหลด</span>
                    </button>
                  </div>
                </div>

                {/* 1.3 ผู้ตรวจสอบสถิติวันลา */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">ผู้ตรวจสอบสถิติวันลา</h4>
                      <p className="text-[11px] text-slate-600">นางสาวสุพรรณี มีสา</p>
                      <span className="text-[10px] text-slate-500 font-medium">นักทรัพยากรบุคคลชำนาญการ</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
                      งานเจ้าหน้าที่
                    </span>
                  </div>

                  <div 
                    className="h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1.5 relative"
                    style={{
                      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                      backgroundSize: '8px 8px'
                    }}
                  >
                    {leadershipSigs.checker ? (
                      <img src={leadershipSigs.checker} alt="Checker Signature" className="max-h-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">ใช้ลายเซ็นดิจิทัลมาตรฐาน</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-1.5">
                    {leadershipSigs.checker && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeadershipSig('checker')}
                        className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        ลบออก
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLeadershipTarget('checker');
                        leadershipInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>อัปโหลด</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Department Supervisors (6 Segments) */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>2. ผู้บังคับบัญชาเบื้องต้นตามสังกัด (6 ส่วนราชการ)</span>
                </h3>
                <span className="text-[11px] text-slate-500">ระบบจะดึงชื่อ/ตำแหน่ง/ลายเซ็นตามสังกัดของผู้ลาอัตโนมัติ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEPARTMENT_SUPERVISORS_LIST.map(sup => {
                  const deptSig = leadershipSigs.deptHeadByDept?.[sup.deptKey];
                  return (
                    <div key={sup.deptKey} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {sup.departmentName}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{sup.name}</h4>
                          <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight">{sup.position}</p>
                        </div>
                      </div>

                      <div 
                        className="h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1 relative"
                        style={{
                          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                          backgroundSize: '8px 8px'
                        }}
                      >
                        {deptSig ? (
                          <img src={deptSig} alt={sup.name} className="max-h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">ใช้ลายเซ็นดิจิทัลเฉพาะกอง</span>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-1.5">
                        {deptSig && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLeadershipSig(`dept_${sup.deptKey}`)}
                            className="px-2 py-0.5 text-[10px] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer font-medium"
                          >
                            ลบออก
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLeadershipTarget(`dept_${sup.deptKey}`);
                            leadershipInputRef.current?.click();
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          <span>อัปโหลด</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'personnel' && sigItems.length > 0 && (
              <span>พร้อมนำเข้า {matchedCount} รายการ</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {activeTab === 'personnel' && sigItems.length > 0 && (
              <button
                type="button"
                onClick={handleApplyAllPersonnelSignatures}
                disabled={matchedCount === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกและนำเข้าลายเซ็นทั้งหมด ({matchedCount})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
