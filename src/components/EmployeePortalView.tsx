import React, { useState, useRef, useEffect } from 'react';
import { 
  Employee, 
  LeaveRecord, 
  LeaveType, 
  Department, 
  ORDERED_DEPARTMENTS,
  AdminUser
} from '../types';
import { 
  Building2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Send, 
  User, 
  Search, 
  Sparkles, 
  PenTool, 
  Paperclip, 
  AlertCircle, 
  Printer, 
  Eye, 
  ChevronRight, 
  Phone, 
  Briefcase, 
  CalendarDays, 
  Info,
  Layers,
  ArrowRight,
  PlusCircle,
  Download,
  Lock,
  RotateCcw,
  Check,
  Upload
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.jpg';
import { OfficialLeaveFormModal } from './OfficialLeaveFormModal';
import { getEmployeeSignatureUrl } from '../utils/supervisorConfig';

interface EmployeePortalViewProps {
  employees: Employee[];
  leaveRecords: LeaveRecord[];
  onSubmitLeave: (newRecord: LeaveRecord) => void;
  onOpenAdminLogin: () => void;
  currentAdmin: AdminUser | null;
  onSwitchToBackoffice: () => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  employees,
  leaveRecords,
  onSubmitLeave,
  onOpenAdminLogin,
  currentAdmin,
  onSwitchToBackoffice
}) => {
  const { theme } = useTheme();
  
  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    return employees[0]?.id || '';
  });
  const [searchEmpQuery, setSearchEmpQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Active View Tab: 'submit' (ยื่นคำขอลา) or 'history' (ติดตามสถานะใบลา)
  const [portalTab, setPortalTab] = useState<'submit' | 'history'>('submit');

  // Selected leave record for official print/view modal
  const [viewingLeaveRecord, setViewingLeaveRecord] = useState<LeaveRecord | null>(null);

  // Form Submission State
  const [leaveType, setLeaveType] = useState<LeaveType>('ลาพักผ่อน');
  const [startDate, setStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [totalDays, setTotalDays] = useState<number>(1);
  const [reason, setReason] = useState<string>('พักผ่อนประจำปี');
  const [phone, setPhone] = useState<string>('');
  
  // Travel Specific
  const [destination, setDestination] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [transportType, setTransportType] = useState<string>('รถยนต์ส่วนบุคคล');
  const [withBudget, setWithBudget] = useState<boolean>(false);
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [fundingSource, setFundingSource] = useState<string>('งบกลาง');
  const [companionNames, setCompanionNames] = useState<string>('');

  // Signature Pad State: 'profile' (ดึงจากข้อมูลบุคคลอัตโนมัติ) | 'draw' (วาดใหม่) | 'upload' (อัปโหลดใหม่)
  const [signatureMode, setSignatureMode] = useState<'profile' | 'draw' | 'upload'>('profile');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Canvas Ref for Signature Drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  // Sync phone and auto-pull signature when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      setPhone(selectedEmployee.phone || '');
      // Automatically pull signature from employee profile data!
      const autoSig = getEmployeeSignatureUrl(selectedEmployee);
      setSignatureDataUrl(autoSig);
      setSignatureMode('profile');
    }
  }, [selectedEmployee]);

  // Calculate working days
  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setTotalDays(1);
      return;
    }
    
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    setTotalDays(days > 0 ? days : 1);
  }, [startDate, endDate]);

  // Handle Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Blue ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Compute Employee Quota Statistics
  const employeeLeaveRecords = leaveRecords.filter(r => r.employeeId === selectedEmployee?.id);
  const usedVacationDays = employeeLeaveRecords
    .filter(r => r.leaveType === 'ลาพักผ่อน' && r.status === 'อนุมัติ')
    .reduce((sum, r) => sum + r.totalDays, 0);
  
  const accumulatedDays = selectedEmployee?.accumulatedLeaveDays || 0;
  const thisYearQuota = selectedEmployee?.leaveQuotas?.vacation || 10;
  const totalVacationAvailable = accumulatedDays + thisYearQuota;
  const remainingVacationDays = Math.max(0, totalVacationAvailable - usedVacationDays);

  const usedSickDays = employeeLeaveRecords
    .filter(r => r.leaveType === 'ลาป่วย' && r.status === 'อนุมัติ')
    .reduce((sum, r) => sum + r.totalDays, 0);

  const usedPersonalDays = employeeLeaveRecords
    .filter(r => r.leaveType === 'ลากิจส่วนตัว' && r.status === 'อนุมัติ')
    .reduce((sum, r) => sum + r.totalDays, 0);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (!reason.trim()) {
      alert('กรุณาระบุเหตุผลการลา');
      return;
    }

    setIsSubmitting(true);

    const applicantSig = signatureDataUrl || getEmployeeSignatureUrl(selectedEmployee);

    const newRecord: LeaveRecord = {
      id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      department: selectedEmployee.department,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
      status: 'รออนุมัติ',
      createdAt: new Date().toISOString().split('T')[0],
      attachmentName: attachmentName || undefined,
      attachmentUrl: attachmentUrl || undefined,
      applicantSignatureUrl: applicantSig || undefined,
      applicantSignedAt: new Date().toISOString().split('T')[0],
      currentApprovalStage: 'pending_checker',
      detectedSignatures: {
        applicant: !!applicantSig,
        checker: false,
        deptHead: false,
        clerk: false,
        mayor: false
      },
      destination: leaveType === 'ไปราชการ' ? destination : undefined,
      orderNumber: leaveType === 'ไปราชการ' ? orderNumber : undefined,
      transportType: leaveType === 'ไปราชการ' ? transportType : undefined,
      withBudget: leaveType === 'ไปราชการ' ? withBudget : undefined,
      budgetAmount: leaveType === 'ไปราชการ' ? budgetAmount : undefined,
      fundingSource: leaveType === 'ไปราชการ' ? fundingSource : undefined,
      companionNames: leaveType === 'ไปราชการ' ? companionNames : undefined,
    };

    setTimeout(() => {
      onSubmitLeave(newRecord);
      setIsSubmitting(false);
      setSubmitSuccessMsg(`ยื่นคำขอ "${leaveType}" จำนวน ${totalDays} วัน สำเร็จแล้ว! คำขอจะถูกส่งให้ผู้บังคับบัญชาและงานบุคคลพิจารณา`);
      setPortalTab('history');
      
      // Auto clear message after 6s
      setTimeout(() => setSubmitSuccessMsg(''), 6000);
    }, 500);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchEmpQuery.toLowerCase()) ||
    e.position.toLowerCase().includes(searchEmpQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchEmpQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.primaryGradient} opacity-15 rounded-full blur-3xl pointer-events-none`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-1.5 shadow-lg border border-slate-700/80 flex items-center justify-center shrink-0">
              <img 
                src={logoImg} 
                alt="ตราสัญลักษณ์เทศบาลตำบลทุ่งช้าง" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                  ระบบบริการพนักงานออนไลน์ (Self-Service)
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">เทศบาลตำบลทุ่งช้าง</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                ยื่นใบลาและตรวจสอบวันลาคงเหลือ
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                พนักงานสามารถเลือกชื่อ ยื่นใบลาทุกประเภท ติดตามผลการอนุมัติ และพิมพ์แบบใบลาได้ทันที
              </p>
            </div>
          </div>

          {/* Admin Backoffice Entry */}
          <div className="flex items-center space-x-2 shrink-0">
            {currentAdmin ? (
              <button
                onClick={onSwitchToBackoffice}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบหลังบ้าน ({currentAdmin.name})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>เข้าสู่ระบบเจ้าหน้าที่ (Admin Login)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submitSuccessMsg && (
        <div className="bg-emerald-900/90 border border-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="flex-1 text-sm font-medium">
            {submitSuccessMsg}
          </div>
        </div>
      )}

      {/* Employee Selector Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              เลือกข้อมูลบุคลากรผู้ยื่นคำขอ
            </label>
            <div className="relative">
              <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-w-md">
                <Search className="w-4 h-4 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchEmpQuery}
                  onChange={(e) => {
                    setSearchEmpQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="พิมพ์ค้นหาชื่อ หรือเลือกจากรายชื่อ..."
                  className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 max-w-md mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto z-40 p-2 divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      ไม่พบบุคลากรที่ตรงกับคำค้นหา
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmpId(emp.id);
                          setSearchEmpQuery('');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          selectedEmpId === emp.id ? 'bg-indigo-50/80 font-bold text-indigo-900' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{emp.name}</p>
                          <p className="text-[11px] text-slate-500">{emp.position} • {emp.department}</p>
                        </div>
                        {selectedEmpId === emp.id && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Tabs Toggle (ยื่นใบลา / ประวัติคำขอ) */}
          <div className="flex items-center space-x-1.5 p-1.5 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setPortalTab('submit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                portalTab === 'submit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>ยื่นแบบใบลาออนไลน์</span>
            </button>
            <button
              onClick={() => setPortalTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                portalTab === 'history'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>สถานะคำขอลาของฉัน ({employeeLeaveRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Selected Employee Info & Real-Time Quota Card */}
        {selectedEmployee && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Employee Profile Preview */}
            <div className="lg:col-span-4 flex items-center space-x-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{selectedEmployee.name}</p>
                <p className="text-xs text-slate-600 truncate">{selectedEmployee.position}</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                    {selectedEmployee.department}
                  </span>
                  <span>{selectedEmployee.personnelType}</span>
                </div>
              </div>
            </div>

            {/* Quota Highlights */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-2xl">
                <p className="text-[11px] font-semibold text-emerald-800">ลาพักผ่อนคงเหลือ</p>
                <p className="text-lg font-black text-emerald-950 mt-0.5">
                  {remainingVacationDays} <span className="text-xs font-medium text-emerald-700">วัน</span>
                </p>
                <p className="text-[10px] text-emerald-600">สะสม {accumulatedDays} + ปีนี้ {thisYearQuota}</p>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/80 p-3 rounded-2xl">
                <p className="text-[11px] font-semibold text-blue-800">ลาป่วย (ใช้ไป)</p>
                <p className="text-lg font-black text-blue-950 mt-0.5">
                  {usedSickDays} <span className="text-xs font-medium text-blue-700">วัน</span>
                </p>
                <p className="text-[10px] text-blue-600">สิทธิ 30 วัน/ปี</p>
              </div>

              <div className="bg-purple-50/80 border border-purple-200/80 p-3 rounded-2xl">
                <p className="text-[11px] font-semibold text-purple-800">ลากิจส่วนตัว (ใช้ไป)</p>
                <p className="text-lg font-black text-purple-950 mt-0.5">
                  {usedPersonalDays} <span className="text-xs font-medium text-purple-700">วัน</span>
                </p>
                <p className="text-[10px] text-purple-600">สิทธิ 45 วัน/ปี</p>
              </div>

              <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl">
                <p className="text-[11px] font-semibold text-slate-700">คำขอทั้งหมด</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {employeeLeaveRecords.length} <span className="text-xs font-medium text-slate-600">ครั้ง</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  รออนุมัติ {employeeLeaveRecords.filter(r => r.status === 'รออนุมัติ').length} รายการ
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Mode View: Form Submission */}
      {portalTab === 'submit' && selectedEmployee && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>แบบฟอร์มยื่นคำขอลาออนไลน์</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กรอกข้อมูลการลาและลงลายมือชื่อดิจิทัล ระบบจะสร้างแบบใบลามาตรฐานพร้อมส่งต่อผู้บังคับบัญชา
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                ประเภทการลา *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { type: 'ลาพักผ่อน', icon: '🏖️', desc: 'พักผ่อนประจำปี' },
                  { type: 'ลาป่วย', icon: '🩺', desc: 'มีใบรับรองแพทย์' },
                  { type: 'ลากิจส่วนตัว', icon: '📝', desc: 'ธุระจำเป็น' },
                  { type: 'ลาคลอดบุตร', icon: '👶', desc: 'คลอดบุตร/เลี้ยงดู' },
                  { type: 'ลาอุปสมบท', icon: '🙏', desc: 'บรรพชา/อุปสมบท' },
                  { type: 'ไปราชการ', icon: '💼', desc: 'อบรม/ประชุม/ราชการ' },
                  { type: 'อื่นๆ', icon: '📌', desc: 'กรณีอื่นๆ' }
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setLeaveType(item.type as LeaveType);
                      if (item.type === 'ลาพักผ่อน') setReason('พักผ่อนประจำปี');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      leaveType === item.type
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <span className="text-lg block mb-1">{item.icon}</span>
                    <span className="text-xs font-bold block text-slate-900">{item.type}</span>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range & Total Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">ตั้งแต่วันที่ *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">ถึงวันที่ *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">จำนวนวันทำการที่ลา</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0">วันทำการ</span>
                </div>
              </div>
            </div>

            {/* Travel / Duty Specific Fields */}
            {leaveType === 'ไปราชการ' && (
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <Briefcase className="w-4 h-4 text-amber-700" />
                  <span>รายละเอียดการไปปฏิบัติราชการ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">สถานที่ไปราชการ *</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="เช่น ศาลากลางจังหวัดน่าน, โรงแรมดิเอ็มเพรส เชียงใหม่"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">ตามหนังสือ/คำสั่งเลขที่</label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="เช่น คำสั่งที่ ๑๒/๒๕๖๙ หรือ บันทึกข้อความ..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">พาหนะเดินทาง</label>
                    <input
                      type="text"
                      value={transportType}
                      onChange={(e) => setTransportType(e.target.value)}
                      placeholder="เช่น รถยนต์ส่วนกลาง, รถยนต์ส่วนบุคคล, รถโดยสารประจำทาง"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">ผู้ร่วมเดินทาง</label>
                    <input
                      type="text"
                      value={companionNames}
                      onChange={(e) => setCompanionNames(e.target.value)}
                      placeholder="เช่น นายสมบูรณ์ ปัญญา, นางสาวมณีวรรณ"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reason and Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {leaveType === 'ไปราชการ' ? 'เพื่อปฏิบัติหน้าที่ / โครงการ *' : 'เหตุผลการขอลา *'}
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลการลา..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ที่ติดต่อได้ระหว่างลา *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[10px] text-slate-500">เจ้าหน้าที่จะใช้ในการติดต่อกรณีมีราชการเร่งด่วน</p>
              </div>
            </div>

            {/* Attachments (Medical Certificate / Files) */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>แนบไฟล์เอกสารประกอบ (ใบรับรองแพทย์ / หนังสือเชิญ / รูปถ่าย)</span>
                </label>
                <span className="text-[10px] text-slate-500">ไม่บังคับ</span>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleAttachmentUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
              />
              {attachmentName && (
                <p className="text-xs text-emerald-700 font-medium">
                  ✓ แนบไฟล์: {attachmentName}
                </p>
              )}
            </div>

            {/* Digital Signature Pad */}
            <div className="space-y-3 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    <span>ลายมือชื่อดิจิทัลของผู้ขอลา *</span>
                  </label>
                  <p className="text-[10px] text-slate-500">
                    ระบบดึงลายเซ็นจากข้อมูลบุคคลมาให้อัตโนมัติ หรือเลือกวาดใหม่/อัปโหลดไฟล์
                  </p>
                </div>

                {/* Signature Mode Toggle (Profile Auto / Draw / Upload) */}
                <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMode('profile');
                      setSignatureDataUrl(getEmployeeSignatureUrl(selectedEmployee));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      signatureMode === 'profile' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>ดึงจากข้อมูลบุคคล (อัตโนมัติ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      signatureMode === 'draw' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>วาดบนจอ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignatureMode('upload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      signatureMode === 'upload' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูป</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Auto Profile Signature (Default) */}
              {signatureMode === 'profile' && (
                <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ดึงข้อมูลลายมือชื่อของ "{selectedEmployee.name}" จากฐานข้อมูลบุคลากรเรียบร้อยแล้ว</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      พร้อมใช้งานอัตโนมัติ
                    </span>
                  </div>

                  <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center">
                    <div className="h-16 flex items-center justify-center">
                      <img 
                        src={signatureDataUrl || getEmployeeSignatureUrl(selectedEmployee)} 
                        alt={`ลายเซ็น ${selectedEmployee.name}`} 
                        className="h-14 max-w-full object-contain"
                      />
                    </div>
                    <p className="font-bold text-slate-800 text-xs mt-1">( {selectedEmployee.name} )</p>
                    <p className="text-[10px] text-slate-500">( {selectedEmployee.position} )</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>💡 ลายมือชื่อนี้จะถูกประทับลงในแบบใบลาทางการให้โดยอัตโนมัติ</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                      >
                        ต้องการเซ็นใหม่สำหรับคำขอนี้
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: Draw on Screen */}
              {signatureMode === 'draw' && (
                <div className="space-y-2">
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-2 flex flex-col items-center justify-center relative touch-none">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair bg-white w-full max-w-sm rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400 select-none pointer-events-none mt-1">
                      (ใช้นิ้วมือหรือเมาส์ลากเส้นเพื่อเซ็นชื่อ)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureMode('profile');
                        setSignatureDataUrl(getEmployeeSignatureUrl(selectedEmployee));
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>↺ กลับไปใช้ลายเซ็นจากข้อมูลบุคคล</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 p-1 hover:bg-slate-200 rounded-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ล้างลายเซ็น</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 3: Upload Image */}
              {signatureMode === 'upload' && (
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                  />
                  {signatureDataUrl && (
                    <div className="h-16 flex flex-col items-center justify-center pt-2">
                      <img src={signatureDataUrl} alt="Signature Preview" className="h-12 object-contain" />
                      <p className="text-[10px] text-slate-400 mt-1">ตัวอย่างรูปลายเซ็นที่อัปโหลด</p>
                    </div>
                  )}
                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureMode('profile');
                        setSignatureDataUrl(getEmployeeSignatureUrl(selectedEmployee));
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>↺ กลับไปใช้ลายเซ็นจากข้อมูลบุคคล</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${theme.primaryGradient} hover:opacity-95 shadow-xl shadow-indigo-950/30 flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer`}
              >
                {isSubmitting ? (
                  <span>กำลังส่งข้อมูล...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ส่งคำขอลาเพื่อพิจารณา</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode 2: My Leave Request History & Tracking */}
      {portalTab === 'history' && selectedEmployee && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>ประวัติและสถานะคำขอลาของ: {selectedEmployee.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามขั้นตอนการอนุมัติแบบ Real-Time และเปิดพิมพ์แบบใบลามาตรฐาน
              </p>
            </div>
            <button
              onClick={() => setPortalTab('submit')}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ยื่นใบลาเพิ่ม</span>
            </button>
          </div>

          {employeeLeaveRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">ยังไม่มีประวัติการยื่นใบลาในระบบ</p>
              <button
                onClick={() => setPortalTab('submit')}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700"
              >
                เริ่มยื่นใบลาแรก
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {employeeLeaveRecords.map((record) => {
                const isApproved = record.status === 'อนุมัติ';
                const isPending = record.status === 'รออนุมัติ';
                const isRejected = record.status === 'ไม่อนุมัติ';

                return (
                  <div 
                    key={record.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 hover:bg-white shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs ${
                          isApproved ? 'bg-emerald-600' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>
                          {record.leaveType === 'ลาพักผ่อน' ? '🏖️' : record.leaveType === 'ลาป่วย' ? '🩺' : '📝'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{record.leaveType}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved 
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            วันที่ {record.startDate} ถึง {record.endDate} ({record.totalDays} วันทำการ)
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            เหตุผล: <span className="text-slate-800 font-medium">{record.reason}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Button: Open Official Form */}
                      <button
                        onClick={() => setViewingLeaveRecord(record)}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-950/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>เปิดดู / พิมพ์แบบใบลาทางการ (A4)</span>
                      </button>
                    </div>

                    {/* Official Workflow Step Progress Bar */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-600">สถานะการพิจารณาตามลำดับขั้น 4 ขั้นตอน:</p>
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          {record.status === 'อนุมัติ' 
                            ? '✓ อนุมัติเสร็จสิ้น' 
                            : !record.checkerApproved 
                            ? 'กำลังดำเนินการ: ขั้นที่ 1 (งานบุคคล)' 
                            : !record.deptHeadApproved 
                            ? 'กำลังดำเนินการ: ขั้นที่ 2 (ผอ.กอง)' 
                            : !record.clerkApproved 
                            ? 'กำลังดำเนินการ: ขั้นที่ 3 (ปลัดเทศบาล)' 
                            : 'กำลังดำเนินการ: ขั้นที่ 4 (นายกเทศมนตรี)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className={`flex items-center space-x-1.5 p-2 rounded-lg ${record.checkerApproved ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'bg-blue-50 text-blue-700 font-medium'}`}>
                          {record.checkerApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
                          )}
                          <span className="truncate">1. ตรวจสถิติ (HR)</span>
                        </div>

                        <div className={`flex items-center space-x-1.5 p-2 rounded-lg ${record.deptHeadApproved ? 'bg-emerald-50 text-emerald-800 font-semibold' : record.checkerApproved ? 'bg-indigo-50 text-indigo-700 font-medium' : 'bg-slate-50 text-slate-400'}`}>
                          {record.deptHeadApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : record.checkerApproved ? (
                            <Clock className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span className="truncate">2. ผอ.กอง</span>
                        </div>

                        <div className={`flex items-center space-x-1.5 p-2 rounded-lg ${record.clerkApproved ? 'bg-emerald-50 text-emerald-800 font-semibold' : record.deptHeadApproved ? 'bg-purple-50 text-purple-700 font-medium' : 'bg-slate-50 text-slate-400'}`}>
                          {record.clerkApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : record.deptHeadApproved ? (
                            <Clock className="w-4 h-4 text-purple-500 shrink-0 animate-pulse" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span className="truncate">3. ปลัดเทศบาล</span>
                        </div>

                        <div className={`flex items-center space-x-1.5 p-2 rounded-lg ${record.mayorApproved && record.status === 'อนุมัติ' ? 'bg-emerald-50 text-emerald-800 font-bold' : record.status === 'ไม่อนุมัติ' ? 'bg-rose-50 text-rose-800 font-bold' : record.clerkApproved ? 'bg-amber-50 text-amber-700 font-semibold' : 'bg-slate-50 text-slate-400'}`}>
                          {record.mayorApproved && record.status === 'อนุมัติ' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : record.status === 'ไม่อนุมัติ' ? (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : record.clerkApproved ? (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span className="truncate">4. นายกฯ สั่งการ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Official Leave Form Modal (Popup with Thai Distributed Layout & Signatures) */}
      {viewingLeaveRecord && (
        <OfficialLeaveFormModal
          leaveData={viewingLeaveRecord}
          employee={selectedEmployee}
          isOpen={true}
          onClose={() => setViewingLeaveRecord(null)}
        />
      )}
    </div>
  );
};
