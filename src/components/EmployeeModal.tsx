import React, { useState, useEffect, useRef } from 'react';
import { Employee, Department, PersonnelType, ORDERED_DEPARTMENTS } from '../types';
import { X, CheckCircle2, Camera, Upload, Trash2, Link as LinkIcon, User, Loader2, Sparkles, PenTool } from 'lucide-react';
import { optimizeImageFile, optimizeSignatureImage } from '../utils/imageOptimizer';
import { SignaturePadModal } from './SignaturePadModal';

interface EmployeeModalProps {
  employee?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState<Department>('สำนักปลัดเทศบาล');
  const [personnelType, setPersonnelType] = useState<PersonnelType>('ข้าราชการ');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [vacationQuota, setVacationQuota] = useState(10);
  const [sickQuota, setSickQuota] = useState(30);
  const [personalQuota, setPersonalQuota] = useState(45);
  const [isPhotoUrlInputOpen, setIsPhotoUrlInputOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setPosition(employee.position);
      setDepartment(employee.department || 'สำนักปลัดเทศบาล');
      setPersonnelType(employee.personnelType || 'ข้าราชการ');
      setPhone(employee.phone || '');
      setStartDate(employee.startDate || '');
      setPhotoUrl(employee.photoUrl || employee.avatar || '');
      setSignatureUrl(employee.signatureUrl || '');
      setVacationQuota(employee.leaveQuotas?.vacation ?? 10);
      setSickQuota(employee.leaveQuotas?.sick ?? 30);
      setPersonalQuota(employee.leaveQuotas?.personal ?? 45);
    } else {
      setName('');
      setPosition('');
      setDepartment('สำนักปลัดเทศบาล');
      setPersonnelType('ข้าราชการ');
      setPhone('');
      setStartDate('');
      setPhotoUrl('');
      setSignatureUrl('');
      setVacationQuota(10);
      setSickQuota(30);
      setPersonalQuota(45);
    }
    setIsPhotoUrlInputOpen(false);
    setIsProcessingPhoto(false);
    setIsProcessingSignature(false);
    setIsSignatureModalOpen(false);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const departments: Department[] = ORDERED_DEPARTMENTS;

  const personnelTypes: PersonnelType[] = [
    'ข้าราชการ',
    'ลูกจ้างประจำ',
    'พนักงานจ้างตามภารกิจ',
    'พนักงานจ้างทั่วไป'
  ];

  const processAndSetImage = async (file: File) => {
    try {
      setIsProcessingPhoto(true);
      const optimizedUrl = await optimizeImageFile(file, 600, 600, 0.85);
      setPhotoUrl(optimizedUrl);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processAndSetSignature = async (file: File) => {
    try {
      setIsProcessingSignature(true);
      const optimizedUrl = await optimizeSignatureImage(file, {
        removeBackground: true,
        inkColor: 'blue',
        maxWidth: 480,
        maxHeight: 200
      });
      setSignatureUrl(optimizedUrl);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถนำเข้ารูปลายเซ็นได้');
    } finally {
      setIsProcessingSignature(false);
      if (signatureInputRef.current) {
        signatureInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndSetImage(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndSetSignature(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processAndSetImage(file);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุลบุคลากร');
      return;
    }

    const updatedEmployee: Employee = {
      id: employee ? employee.id : `emp-${Date.now()}`,
      name: name.trim(),
      position: position.trim() || 'เจ้าหน้าที่ประจำเทศบาล',
      department,
      personnelType,
      phone: phone.trim() || '080-000-0000',
      startDate: startDate.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      avatar: photoUrl.trim() || undefined,
      signatureUrl: signatureUrl.trim() || undefined,
      leaveQuotas: {
        vacation: isNaN(Number(vacationQuota)) ? 10 : Number(vacationQuota),
        sick: isNaN(Number(sickQuota)) ? 30 : Number(sickQuota),
        personal: isNaN(Number(personalQuota)) ? 45 : Number(personalQuota)
      }
    };
    onSave(updatedEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-none duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-800">
              {employee ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[72vh] overflow-y-auto px-1">
          {/* Employee Photo Upload Section */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`p-4 rounded-3xl border-2 transition-all ${
              isDragging 
                ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/20' 
                : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-700">
                รูปถ่ายบุคลากร (รูปติดบัตร / รูปหน้าตรง)
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> ปรับขนาดและบีบอัดอัตโนมัติ
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-5">
              <div className="relative group shrink-0">
                {isProcessingPhoto ? (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-emerald-50 border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-700 shadow-sm animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin mb-1" />
                    <span className="text-[11px] font-bold">กำลังประมวลผล...</span>
                  </div>
                ) : photoUrl ? (
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt={name || 'Employee preview'}
                      referrerPolicy="no-referrer"
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      title="ลบรูปถ่าย"
                      className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-md transition-all hover:scale-110 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-slate-200 via-slate-100 to-emerald-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-emerald-700 shadow-xs transition-colors"
                  >
                    <User className="w-10 h-10 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold">คลิกเลือกรูป</span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 flex-1 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    disabled={isProcessingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{photoUrl ? 'เปลี่ยนรูปถ่าย' : 'อัปโหลดรูปภาพ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPhotoUrlInputOpen(!isPhotoUrlInputOpen)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>ระบุ URL</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  เลือกรูปถ่ายหรือลากไฟล์มาวางที่นี่ (รองรับรูปกล้องมือถือ, JPG, PNG) ระบบจะย่อขนาดให้อัตโนมัติ จึงเพิ่มรูปได้ครบทุกคนแบบไม่จำกัด
                </p>
              </div>
            </div>

            {isPhotoUrlInputOpen && (
              <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  วางลิงก์รูปภาพ (Image URL)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPhotoUrlInputOpen(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อ - นามสกุล</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น นายสมชาย ใจดี"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">สังกัดส่วนราชการ / สำนัก / กอง</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {departments.map((d, index) => (
                  <option key={d} value={d}>
                    {index + 1}. {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ประเภทบุคลากร</label>
              <select
                value={personnelType}
                onChange={(e) => setPersonnelType(e.target.value as PersonnelType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {personnelTypes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ตำแหน่ง</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="เช่น นักวิชาการศึกษาชำนาญการ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              วันที่บรรจุ / เริ่มปฏิบัติงาน (เข้ารับราชการ)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              ระบุเพื่อแสดงในแบบประวัติการลาและคำนวณอายุราชการ / สิทธิการลา
            </p>
          </div>

          {/* Digital Signature Upload & Draw Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-blue-700" />
                <span>ลายเซ็นดิจิทัลประจำตัวบุคลากร</span>
              </label>
              {signatureUrl && (
                <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  มีลายเซ็นแล้ว ✓
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div 
                className="w-40 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-1 relative shrink-0 overflow-hidden shadow-2xs"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '8px 8px'
                }}
              >
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Employee Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">ยังไม่มีลายเซ็น</span>
                )}
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <input
                  type="file"
                  ref={signatureInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isProcessingSignature}
                    onClick={() => signatureInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-blue-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{signatureUrl ? 'นำเข้ารูปลายเซ็นใหม่' : 'นำเข้ารูปลายเซ็น'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5 text-blue-700" />
                    <span>วาดลายเซ็น</span>
                  </button>

                  {signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setSignatureUrl('')}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  อัปโหลดรูปถ่ายลายเซ็น (ระบบจะตัดพื้นหลังกระดาษให้โปร่งใสอัตโนมัติ) หรือวาดด้วยนิ้วมือ/เมาส์
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">โควตาวันลาประจำปี (วัน)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">ลาพักผ่อน</label>
                <input
                  type="number"
                  value={vacationQuota}
                  onChange={(e) => setVacationQuota(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center font-bold"
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">ลาป่วย</label>
                <input
                  type="number"
                  value={sickQuota}
                  onChange={(e) => setSickQuota(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center font-bold"
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">ลากิจ</label>
                <input
                  type="number"
                  value={personalQuota}
                  onChange={(e) => setPersonalQuota(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center font-bold"
                  min={0}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>

        {isSignatureModalOpen && (
          <SignaturePadModal
            isOpen={isSignatureModalOpen}
            onClose={() => setIsSignatureModalOpen(false)}
            onSave={(dataUrl) => {
              setSignatureUrl(dataUrl);
              setIsSignatureModalOpen(false);
            }}
            title={`วาดลายเซ็น: ${name || 'บุคลากร'}`}
            roleName={position || 'บุคลากร'}
          />
        )}
      </div>
    </div>
  );
};
