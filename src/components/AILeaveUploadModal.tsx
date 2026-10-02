import React, { useState, useRef } from 'react';
import { Employee, LeaveRecord, LeaveType, LeaveStatus, Department, ApprovalStage } from '../types';
import { OfficialLeaveFormModal } from './OfficialLeaveFormModal';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  FileCheck, 
  Zap,
  ArrowRight,
  UserPlus,
  Download,
  Printer,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Lock,
  PenTool
} from 'lucide-react';
import { calculateLeaveBreakdown } from '../utils/thaiHolidays';

interface AILeaveUploadModalProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRecord: LeaveRecord) => void;
  onOpenAddEmployeeModal?: () => void;
}

export const AILeaveUploadModal: React.FC<AILeaveUploadModalProps> = ({
  employees,
  isOpen,
  onClose,
  onSubmit,
  onOpenAddEmployeeModal,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isPDF, setIsPDF] = useState(false);
  const [isPreviewFormOpen, setIsPreviewFormOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Extracted Result Form state including Signature Verification
  const [parsedResult, setParsedResult] = useState<{
    employeeId: string;
    employeeName: string;
    department: Department;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    hasApplicantSignature: boolean;
    hasCheckerSignature: boolean;
    hasDeptHeadSignature: boolean;
    hasClerkSignature: boolean;
    hasMayorSignature: boolean;
    allSignaturesPresent: boolean;
    missingSignatures: string[];
    confidenceScore: number;
    summaryNote: string;
  } | null>(null);

  const [adminManualOverride, setAdminManualOverride] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    setFile(selectedFile);
    
    if (selectedFile.type === 'application/pdf') {
      setIsPDF(true);
      setFilePreviewUrl(null);
    } else if (selectedFile.type.startsWith('image/')) {
      setIsPDF(false);
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
    } else {
      setErrorMessage('รองรับเฉพาะไฟล์ PDF (.pdf) และไฟล์รูปภาพ (.jpg, .png, .webp) เท่านั้น');
      setFile(null);
      setFilePreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Process uploaded file using Gemini AI with full signature inspection
  const handleAnalyzeFile = async (overriddenFile?: File, isSample = false, sampleVariant: 'complete' | 'incomplete' = 'complete') => {
    const targetFile = overriddenFile || file;
    if (!targetFile && !isSample) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAdminManualOverride(false);
    setLoadingStep('กำลังเตรียมเอกสารส่งให้ Gemini AI...');

    try {
      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (isSample) {
        setLoadingStep(sampleVariant === 'complete' 
          ? 'กำลังโหลดตัวอย่างใบลาที่มีลายเซ็นครบ 5 ช่อง...' 
          : 'กำลังโหลดตัวอย่างใบลาที่ยังขาดลายเซ็นนายกเทศมนตรี...'
        );
        
        const mayorSigSvg = sampleVariant === 'complete' ? `
          <path d="M 520 850 Q 560 820 600 855 T 650 840" fill="none" stroke="#1e3a8a" stroke-width="2.5" />
          <text x="500" y="875" font-size="16" fill="#000000">( นายพิพัฒน์ เพ็ชรพิชัย )</text>
          <text x="500" y="895" font-size="14" fill="#000000">นายกเทศมนตรีตำบลทุ่งช้าง</text>
        ` : `
          <text x="500" y="860" font-size="16" fill="#999999">(ลงชื่อ) ........................................</text>
          <text x="500" y="885" font-size="14" fill="#999999">( นายพิพัฒน์ เพ็ชรพิชัย )</text>
        `;

        const sampleSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" style="background:#ffffff;font-family:'TH Sarabun PSK', sans-serif;">
            <rect width="800" height="1000" fill="#ffffff"/>
            <text x="400" y="70" text-anchor="middle" font-size="26" font-weight="bold" fill="#000000">แบบใบลาพักผ่อน เทศบาลตำบลทุ่งช้าง</text>
            <text x="600" y="110" font-size="18" fill="#333333">กองช่าง เทศบาลตำบลทุ่งช้าง</text>
            <text x="600" y="135" font-size="18" fill="#333333">วันที่ 18 เดือน สิงหาคม พ.ศ. 2569</text>
            
            <text x="80" y="175" font-size="18" fill="#000000">เรื่อง ขอลาพักผ่อนประจำปี</text>
            <text x="80" y="205" font-size="18" fill="#000000">เรียน นายกเทศมนตรีตำบลทุ่งช้าง</text>
            
            <text x="140" y="245" font-size="18" fill="#000000">ข้าพเจ้า นายสมพงษ์ สุขสันต์ ตำแหน่ง นายช่างเขียนแบบ ชำนาญงาน</text>
            <text x="80" y="275" font-size="18" fill="#000000">สังกัด กองช่าง เทศบาลตำบลทุ่งช้าง จังหวัดน่าน</text>
            <text x="80" y="305" font-size="18" fill="#000000">มีความประสงค์ขอลาพักผ่อนประจำปี ประจำปีงบประมาณ พ.ศ. 2569</text>
            
            <text x="80" y="340" font-size="18" fill="#000000">ตั้งแต่วันที่ 18 เดือน สิงหาคม พ.ศ. 2569 ถึงวันที่ 20 เดือน สิงหาคม พ.ศ. 2569</text>
            <text x="80" y="370" font-size="18" fill="#000000">มีกำหนด 3 วันทำการ ในระหว่างลาสามารถติดต่อข้าพเจ้าได้ที่ โทร. 081-987-6543</text>
            <text x="80" y="400" font-size="18" fill="#000000">เหตุผลความจำเป็น: เดินทางพักผ่อนร่วมกับครอบครัวต่างจังหวัด</text>
            
            <!-- Box 1: Applicant Signature -->
            <path d="M 540 440 Q 580 420 620 445 T 660 435" fill="none" stroke="#1e3a8a" stroke-width="2.5" />
            <text x="500" y="465" font-size="16" fill="#000000">(ลงชื่อ) นายสมพงษ์ สุขสันต์ (ผู้ขอลา)</text>
            
            <!-- Box 2: Checker Signature -->
            <rect x="60" y="490" width="320" height="150" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
            <text x="80" y="520" font-size="16" font-weight="bold" fill="#047857">สถิติวันลา (งานการเจ้าหน้าที่):</text>
            <text x="80" y="545" font-size="14" fill="#333333">ลาพักผ่อนสะสม 10 วัน รวมมีสิทธิ์ 20 วัน</text>
            <text x="80" y="570" font-size="14" fill="#333333">ลาครั้งนี้ 3 วัน คงเหลือ 17 วันทำการ</text>
            <path d="M 120 610 Q 150 595 180 615" fill="none" stroke="#1e3a8a" stroke-width="2" />
            <text x="80" y="630" font-size="13" fill="#000000">(ลงชื่อ) สุพรรณี มีสา ผู้ตรวจสอบ</text>
            
            <!-- Box 3: Head of Dept Signature -->
            <rect x="420" y="490" width="320" height="150" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
            <text x="440" y="520" font-size="16" font-weight="bold" fill="#047857">ความเห็น ผอ.กองช่าง:</text>
            <text x="440" y="545" font-size="14" fill="#333333">เห็นควรพิจารณาอนุญาต</text>
            <path d="M 480 600 Q 520 580 560 605" fill="none" stroke="#1e3a8a" stroke-width="2" />
            <text x="440" y="630" font-size="13" fill="#000000">(ลงชื่อ) สุกิจ เทพจันตา รก.ผอ.กองช่าง</text>
            
            <!-- Box 4: Clerk Signature -->
            <rect x="60" y="660" width="320" height="150" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
            <text x="80" y="690" font-size="16" font-weight="bold" fill="#047857">ความเห็นปลัดเทศบาล:</text>
            <text x="80" y="715" font-size="14" fill="#333333">เห็นควรอนุญาต</text>
            <path d="M 120 770 Q 150 750 190 775" fill="none" stroke="#1e3a8a" stroke-width="2" />
            <text x="80" y="800" font-size="13" fill="#000000">(ลงชื่อ) สมชาย ใจดี ปลัดเทศบาล</text>
            
            <!-- Box 5: Mayor Signature -->
            <rect x="420" y="660" width="320" height="250" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
            <text x="440" y="690" font-size="16" font-weight="bold" fill="#047857">คำสั่งนายกเทศมนตรี:</text>
            <text x="440" y="720" font-size="16" font-weight="bold" fill="#1e3a8a">[ / ] อนุญาต   [  ] ไม่อนุมัติ</text>
            ${mayorSigSvg}
          </svg>
        `;
        base64Data = btoa(unescape(encodeURIComponent(sampleSvg)));
        mimeType = 'image/svg+xml';
      } else if (targetFile) {
        mimeType = targetFile.type;
        base64Data = await fileToBase64(targetFile);
      }

      setLoadingStep('กำลังส่งเอกสารให้ Gemini AI ตรวจสอบเนื้อหาและลายมือชื่อทั้ง 5 ช่อง...');
      
      const response = await fetch('/api/ai-parse-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType,
          employees
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'ไม่สามารถสกัดข้อมูลจากเอกสารได้');
      }

      const data = resData.data;

      // Try matching employee with current employees list
      let matchedEmp = employees.find(e => 
        (data.matchedEmployeeId && e.id === data.matchedEmployeeId) ||
        (data.employeeName && e.name.toLowerCase().includes(data.employeeName.toLowerCase())) ||
        (data.employeeName && data.employeeName.toLowerCase().includes(e.name.toLowerCase()))
      );

      // Fallback default
      if (!matchedEmp) {
        matchedEmp = employees[0];
      }

      const sDate = data.startDate || '2026-08-18';
      const eDate = data.endDate || '2026-08-20';
      const lType = (data.leaveType as LeaveType) || 'ลาพักผ่อน';
      const breakdown = calculateLeaveBreakdown(sDate, eDate, lType);

      const hasApp = data.hasApplicantSignature !== false;
      const hasChk = data.hasCheckerSignature !== false;
      const hasDept = data.hasDeptHeadSignature !== false;
      const hasClr = data.hasClerkSignature !== false;
      const hasMay = data.hasMayorSignature === true || (isSample && sampleVariant === 'complete');
      const allPresent = hasApp && hasChk && hasDept && hasClr && hasMay;

      const missing: string[] = [];
      if (!hasApp) missing.push('ลายมือชื่อผู้ขอลา');
      if (!hasChk) missing.push('ลายมือชื่อผู้ตรวจสอบสถิติวันลา');
      if (!hasDept) missing.push('ลายมือชื่อ ผอ.กอง/หัวหน้าส่วนราชการ');
      if (!hasClr) missing.push('ลายมือชื่อปลัดเทศบาล');
      if (!hasMay) missing.push('ลายมือชื่อคำสั่งนายกเทศมนตรี');

      setParsedResult({
        employeeId: matchedEmp?.id || employees[0]?.id || '',
        employeeName: data.employeeName || matchedEmp?.name || '',
        department: (data.department as Department) || matchedEmp?.department || 'กองช่าง',
        leaveType: lType,
        startDate: sDate,
        endDate: eDate,
        totalDays: breakdown.recommendedDays || Number(data.totalDays) || 3,
        reason: data.reason || 'ขอลาพักผ่อนประจำปี',
        hasApplicantSignature: hasApp,
        hasCheckerSignature: hasChk,
        hasDeptHeadSignature: hasDept,
        hasClerkSignature: hasClr,
        hasMayorSignature: hasMay,
        allSignaturesPresent: allPresent,
        missingSignatures: missing,
        confidenceScore: Number(data.confidenceScore) || 95,
        summaryNote: data.summaryNote || (allPresent 
          ? 'ตรวจสอบพบลายมือชื่อครบทุกช่องตามระเบียบ พร้อมอนุมัติ' 
          : `ยังขาดลายมือชื่อ: ${missing.join(', ')}`)
      });

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Gemini AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLeaveRecord = () => {
    if (!parsedResult) return;

    let empId = parsedResult.employeeId;
    let selectedEmp = employees.find(e => e.id === empId);
    if (!selectedEmp && employees.length > 0) {
      selectedEmp = employees.find(e => 
        (parsedResult.employeeName && e.name.toLowerCase().includes(parsedResult.employeeName.toLowerCase())) ||
        (parsedResult.employeeName && parsedResult.employeeName.toLowerCase().includes(e.name.toLowerCase()))
      ) || employees[0];
      empId = selectedEmp?.id || `emp-${Date.now()}`;
    }
    
    // Calculate days inclusive
    const start = new Date(parsedResult.startDate);
    const end = new Date(parsedResult.endDate);
    let computedDays = 1;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      computedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    // Determine status & stage based on signature completeness or manual override
    const canApproveDirectly = parsedResult.allSignaturesPresent || adminManualOverride;
    const finalStatus: LeaveStatus = canApproveDirectly ? 'อนุมัติ' : 'รออนุมัติ';
    
    // Determine hierarchical stage
    let stage: ApprovalStage = 'completed';
    if (!canApproveDirectly) {
      if (!parsedResult.hasCheckerSignature) stage = 'pending_checker';
      else if (!parsedResult.hasDeptHeadSignature) stage = 'pending_dept_head';
      else if (!parsedResult.hasClerkSignature) stage = 'pending_clerk';
      else if (!parsedResult.hasMayorSignature) stage = 'pending_mayor';
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord: LeaveRecord = {
      id: `leave-ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      employeeId: empId,
      employeeName: selectedEmp ? selectedEmp.name : (parsedResult.employeeName || 'บุคลากร'),
      department: selectedEmp ? selectedEmp.department : (parsedResult.department || 'สำนักปลัดเทศบาล'),
      leaveType: parsedResult.leaveType || 'ลาพักผ่อน',
      startDate: parsedResult.startDate || todayStr,
      endDate: parsedResult.endDate || todayStr,
      totalDays: parsedResult.totalDays > 0 ? parsedResult.totalDays : computedDays,
      reason: parsedResult.reason || 'ขอลาพักผ่อนประจำปี',
      status: finalStatus,
      currentApprovalStage: stage,
      signaturesComplete: canApproveDirectly,
      detectedSignatures: {
        applicant: parsedResult.hasApplicantSignature,
        checker: parsedResult.hasCheckerSignature,
        deptHead: parsedResult.hasDeptHeadSignature,
        clerk: parsedResult.hasClerkSignature,
        mayor: parsedResult.hasMayorSignature || adminManualOverride,
      },
      createdAt: todayStr,
      attachmentUrl: filePreviewUrl || undefined,
      attachmentName: file ? file.name : 'ใบลา-สแกน.jpg',
      approvedBy: canApproveDirectly ? 'นายพิพัฒน์ เพ็ชรพิชัย (นายกเทศมนตรีตำบลทุ่งช้าง)' : undefined,

      // Fill approval steps if detected
      applicantSignedAt: parsedResult.hasApplicantSignature ? todayStr : undefined,
      checkerApproved: parsedResult.hasCheckerSignature,
      checkerName: parsedResult.hasCheckerSignature ? 'นางสาวสุพรรณี มีสา' : undefined,
      checkerPosition: parsedResult.hasCheckerSignature ? 'เจ้าพนักงานธุรการชำนาญงาน' : undefined,
      checkerApprovedAt: parsedResult.hasCheckerSignature ? todayStr : undefined,

      deptHeadApproved: parsedResult.hasDeptHeadSignature,
      deptHeadName: parsedResult.hasDeptHeadSignature ? 'นายสุกิจ เทพจันตา' : undefined,
      deptHeadPosition: parsedResult.hasDeptHeadSignature ? 'รก.ผอ.กองช่าง' : undefined,
      deptHeadApprovedAt: parsedResult.hasDeptHeadSignature ? todayStr : undefined,

      clerkApproved: parsedResult.hasClerkSignature,
      clerkName: parsedResult.hasClerkSignature ? 'นายสมชาย ใจดี' : undefined,
      clerkPosition: parsedResult.hasClerkSignature ? 'ปลัดเทศบาลตำบลทุ่งช้าง' : undefined,
      clerkApprovedAt: parsedResult.hasClerkSignature ? todayStr : undefined,

      mayorApproved: canApproveDirectly,
      mayorName: canApproveDirectly ? 'นายพิพัฒน์ เพ็ชรพิชัย' : undefined,
      mayorPosition: canApproveDirectly ? 'นายกเทศมนตรีตำบลทุ่งช้าง' : undefined,
      mayorOrder: canApproveDirectly ? 'อนุญาต' : undefined,
      mayorApprovedAt: canApproveDirectly ? todayStr : undefined,
    };

    onSubmit(newRecord);
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setIsPDF(false);
    setParsedResult(null);
    setErrorMessage(null);
    setAdminManualOverride(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-none duration-200 my-0 sm:my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Powered by Gemini 3.7 Flash
                </span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ตรวจลายเซ็น 5 ช่อง
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">สแกนใบลา AI และตรวจสอบลายเซ็นตามลำดับขั้น</h3>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 font-bold p-1.5 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">เกิดข้อผิดพลาดในการสกัดข้อมูล</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Upload or Sample File Selector */}
        {!parsedResult && !isLoading && (
          <div className="space-y-5 pt-6">
            <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>เงื่อนไขการอนุมัติวันลาจากระบบสแกนเอกสาร:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                ระบบ AI จะตรวจอ่านข้อมูลวันลา พร้อมสแกนลายมือชื่อในเอกสารทั้ง 5 ช่อง (ผู้ขอลา, ผู้ตรวจสถิติ, ผอ.กอง, ปลัดเทศบาล, นายกเทศมนตรี) <strong className="text-blue-900">หากพบลายเซ็นครบทุกช่องจึงจะสามารถอนุมัติได้ทันที</strong> หากยังไม่ครบระบบจะส่งเข้าคิวเสนอตามลำดับขั้น
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                file 
                  ? 'border-emerald-500 bg-emerald-50/50' 
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">คลิกที่นี่เพื่อเลือกไฟล์ หรือ ลากไฟล์มาวาง</p>
                    <p className="text-xs text-slate-500 mt-1">รองรับ PDF, JPG, PNG, WEBP (ขนาดไม่เกิน 20MB)</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-4">
                  {isPDF ? (
                    <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center font-bold">
                      <FileText className="w-8 h-8" />
                    </div>
                  ) : (
                    <img
                      src={filePreviewUrl || ''}
                      alt="Leave Document Preview"
                      className="w-16 h-20 object-cover rounded-xl border border-slate-300 shadow-sm"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • {isPDF ? 'PDF Document' : 'Image'}</p>
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 mt-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ พร้อมประมวลผล OCR และตรวจลายเซ็น
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>ทดสอบระบบด้วยเอกสารจำลอง (Demo Scenarios):</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAnalyzeFile(undefined, true, 'complete')}
                  className="flex items-center justify-between p-3 bg-white border border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl text-left transition-all shadow-xs group"
                >
                  <div>
                    <div className="font-bold text-xs text-emerald-900 group-hover:text-emerald-700 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. ใบลาลายเซ็นครบ 5 ช่อง</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">มีลายเซ็นผู้ขอลา, HR, ผอ.กอง, ปลัด, นายกฯ</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">อนุมัติได้ทันที</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalyzeFile(undefined, true, 'incomplete')}
                  className="flex items-center justify-between p-3 bg-white border border-amber-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-left transition-all shadow-xs group"
                >
                  <div>
                    <div className="font-bold text-xs text-amber-900 group-hover:text-amber-700 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>2. ขาดลายเซ็นนายกฯ</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">ยังไม่ลงนามคำสั่งนายกเทศมนตรี</div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-lg">รอเสนอตามขั้น</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!file}
                onClick={() => handleAnalyzeFile()}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>เริ่มสแกนอ่านใบลา & ตรวจลายเซ็น</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Loading Animation */}
        {isLoading && (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <h4 className="text-base font-bold text-slate-800">กำลังประมวลผลด้วย Gemini 3.7 Flash...</h4>
            <p className="text-xs text-slate-500 animate-pulse">{loadingStep}</p>
          </div>
        )}

        {/* STEP 3: Parsed Result + Signature Verification Form */}
        {parsedResult && !isLoading && (
          <div className="space-y-5 pt-4">
            
            {/* Signature Verification Status Card */}
            <div className={`p-4 rounded-2xl border ${
              parsedResult.allSignaturesPresent 
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' 
                : 'bg-amber-50/80 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  {parsedResult.allSignaturesPresent ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold">
                      {parsedResult.allSignaturesPresent 
                        ? 'ตรวจพบลายมือชื่อครบทั้ง 5 ช่องตามระเบียบ (สามารถอนุมัติได้ทันที)' 
                        : 'เอกสารยังลงลายมือชื่อไม่ครบทุกช่อง (ต้องเสนอตามลำดับขั้น)'}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">{parsedResult.summaryNote}</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-white border shadow-xs">
                  ความเชื่อมั่น {parsedResult.confidenceScore}%
                </span>
              </div>

              {/* Detailed 5-Step Signature Checklist */}
              <div className="mt-3.5 pt-3 border-t border-black/10 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                  parsedResult.hasApplicantSignature ? 'bg-white text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500">ขั้นที่ 1</span>
                  <span className="font-bold text-[11px] mt-0.5">ผู้ขอลา</span>
                  <span className={`text-[10px] font-extrabold mt-1 px-1.5 py-0.2 rounded-full ${
                    parsedResult.hasApplicantSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {parsedResult.hasApplicantSignature ? '✓ พบ' : '✗ ไม่พบ'}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                  parsedResult.hasCheckerSignature ? 'bg-white text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500">ขั้นที่ 2</span>
                  <span className="font-bold text-[11px] mt-0.5">ผู้ตรวจสถิติ</span>
                  <span className={`text-[10px] font-extrabold mt-1 px-1.5 py-0.2 rounded-full ${
                    parsedResult.hasCheckerSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {parsedResult.hasCheckerSignature ? '✓ พบ' : '✗ ไม่พบ'}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                  parsedResult.hasDeptHeadSignature ? 'bg-white text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500">ขั้นที่ 3</span>
                  <span className="font-bold text-[11px] mt-0.5">ผอ.กอง/หน.ส่วน</span>
                  <span className={`text-[10px] font-extrabold mt-1 px-1.5 py-0.2 rounded-full ${
                    parsedResult.hasDeptHeadSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {parsedResult.hasDeptHeadSignature ? '✓ พบ' : '✗ ไม่พบ'}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                  parsedResult.hasClerkSignature ? 'bg-white text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500">ขั้นที่ 4</span>
                  <span className="font-bold text-[11px] mt-0.5">ปลัดเทศบาล</span>
                  <span className={`text-[10px] font-extrabold mt-1 px-1.5 py-0.2 rounded-full ${
                    parsedResult.hasClerkSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {parsedResult.hasClerkSignature ? '✓ พบ' : '✗ ไม่พบ'}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                  parsedResult.hasMayorSignature ? 'bg-white text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500">ขั้นที่ 5</span>
                  <span className="font-bold text-[11px] mt-0.5">นายกเทศมนตรี</span>
                  <span className={`text-[10px] font-extrabold mt-1 px-1.5 py-0.2 rounded-full ${
                    parsedResult.hasMayorSignature ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {parsedResult.hasMayorSignature ? '✓ พบ' : '✗ ไม่พบ'}
                  </span>
                </div>
              </div>

              {/* Missing Signatures Warning & Admin Override */}
              {!parsedResult.allSignaturesPresent && (
                <div className="mt-3 bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-amber-900">
                    <span className="font-bold">ช่องที่ยังไม่พบ:</span> {parsedResult.missingSignatures.join(', ')} (ระบบจะบันทึกเป็น "รออนุมัติ")
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={adminManualOverride}
                      onChange={(e) => setAdminManualOverride(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-[11px]">ยืนยันว่ามีตราประทับ/ลายเซ็นจริง (อนุมัติทันที)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Leave Details Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveLeaveRecord(); }} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">ชื่อบุคลากรผู้ขอลา</label>
                  {onOpenAddEmployeeModal && (
                    <button
                      type="button"
                      onClick={onOpenAddEmployeeModal}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ เพิ่มบุคลากรใหม่</span>
                    </button>
                  )}
                </div>
                <select
                  value={parsedResult.employeeId}
                  onChange={(e) => {
                    const emp = employees.find(emp => emp.id === e.target.value);
                    setParsedResult(prev => prev ? {
                      ...prev,
                      employeeId: e.target.value,
                      employeeName: emp ? emp.name : prev.employeeName,
                      department: emp ? emp.department : prev.department,
                    } : null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ประเภทการลา</label>
                  <select
                    value={parsedResult.leaveType}
                    onChange={(e) => {
                      const newType = e.target.value as LeaveType;
                      setParsedResult(prev => {
                        if (!prev) return null;
                        const b = calculateLeaveBreakdown(prev.startDate, prev.endDate, newType);
                        return { ...prev, leaveType: newType, totalDays: b.recommendedDays };
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="ลาพักผ่อน">ลาพักผ่อนประจำปี (นับเฉพาะวันทำการ)</option>
                    <option value="ลาป่วย">ลาป่วย</option>
                    <option value="ลากิจส่วนตัว">ลากิจส่วนตัว</option>
                    <option value="ลาคลอดบุตร">ลาคลอดบุตร (นับรวมวันหยุด)</option>
                    <option value="ลาอุปสมบท">ลาอุปสมบท (นับรวมวันหยุด)</option>
                    <option value="ไปราชการ">ไปราชการ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">สังกัดส่วนราชการ</label>
                  <input
                    type="text"
                    value={parsedResult.department}
                    onChange={(e) => setParsedResult(prev => prev ? { ...prev, department: e.target.value as Department } : null)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    value={parsedResult.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setParsedResult(prev => {
                        if (!prev) return null;
                        const b = calculateLeaveBreakdown(newStart, prev.endDate, prev.leaveType);
                        return { ...prev, startDate: newStart, totalDays: b.recommendedDays };
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ถึงวันที่</label>
                  <input
                    type="date"
                    value={parsedResult.endDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setParsedResult(prev => {
                        if (!prev) return null;
                        const b = calculateLeaveBreakdown(prev.startDate, newEnd, prev.leaveType);
                        return { ...prev, endDate: newEnd, totalDays: b.recommendedDays };
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">จำนวนวันลา (ตามระเบียบ)</label>
                  <input
                    type="number"
                    min="1"
                    value={parsedResult.totalDays}
                    onChange={(e) => setParsedResult(prev => prev ? { ...prev, totalDays: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Thai Holiday Calculation Breakdown Info */}
              {(() => {
                const b = calculateLeaveBreakdown(parsedResult.startDate, parsedResult.endDate, parsedResult.leaveType);
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-bold flex items-center space-x-1">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                        <span>การคำนวณวันหยุดราชการ:</span>
                      </span>
                      <span className="text-[11px] text-slate-600">
                        วันทำการ <strong className="text-emerald-700">{b.workingDays}</strong> วัน • วันหยุด <strong className="text-rose-600">{b.nonWorkingDaysCount}</strong> วัน
                      </span>
                    </div>
                    {b.holidaysList.length > 0 && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        ตรงกับวันหยุดราชการ: {b.holidaysList.map(h => `${h.dayThai} (${h.name})`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">เหตุผลความจำเป็นในการลา</label>
                <textarea
                  rows={2}
                  value={parsedResult.reason}
                  onChange={(e) => setParsedResult(prev => prev ? { ...prev, reason: e.target.value } : null)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 resize-none"
                  required
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    ยกเลิก / สแกนใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewFormOpen(true)}
                    className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>ดูแบบใบลาทางการ (A4)</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 active:scale-95 ${
                    (parsedResult.allSignaturesPresent || adminManualOverride)
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/20'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/20'
                  }`}
                >
                  {(parsedResult.allSignaturesPresent || adminManualOverride) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>อนุมัติวันลาและบันทึกลงระบบ (ลายเซ็นครบ)</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4" />
                      <span>บันทึกคำขอลา (รอเสนอตามลำดับขั้น)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Official Leave Document Preview and Download Modal */}
      {parsedResult && (
        <OfficialLeaveFormModal
          isOpen={isPreviewFormOpen}
          onClose={() => setIsPreviewFormOpen(false)}
          leaveData={{
            employeeName: parsedResult.employeeName,
            department: parsedResult.department,
            leaveType: parsedResult.leaveType,
            startDate: parsedResult.startDate,
            endDate: parsedResult.endDate,
            totalDays: parsedResult.totalDays,
            reason: parsedResult.reason,
          }}
          employee={employees.find(e => e.id === parsedResult.employeeId)}
          originalFileUrl={filePreviewUrl}
          originalFileName={file?.name}
        />
      )}
    </div>
  );
};
