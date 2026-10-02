import React, { useRef, useState, useEffect } from 'react';
import { LeaveRecord, Employee, OfficialSignatures } from '../types';
import { Printer, Download, X, FileText, CheckCircle2, Shield, Edit3, RotateCcw, PenTool, Check, Sparkles, Image as ImageIcon, Upload, Loader2, FileDown } from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';
import { BatchSignatureUploadModal } from './BatchSignatureUploadModal';
import { exportElementToPDF } from '../utils/pdfExport';
import { 
  getSupervisorForDepartment, 
  resolveSupervisorSignatureUrl, 
  getRealisticSignatureForDept,
  DEPARTMENT_SUPERVISORS_LIST 
} from '../utils/supervisorConfig';

interface OfficialLeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveData: Partial<LeaveRecord> & {
    employeeName?: string;
    position?: string;
    department?: string;
    personnelType?: string;
    phone?: string;
    contactAddress?: string;
  };
  employee?: Employee;
  allLeaveRecords?: LeaveRecord[];
  allEmployees?: Employee[];
  onUpdateEmployee?: (emp: Employee) => void;
  onEditLeave?: () => void;
  originalFileUrl?: string | null;
  originalFileName?: string | null;
}

// Authentic SVG Vector Signatures rendered in government blue ink
const RealisticApplicantSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 15 35 Q 35 10 50 25 T 80 20 Q 95 38 120 18 T 145 28" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 45 22 Q 55 42 70 30 T 95 32" strokeWidth="2" strokeLinecap="round" />
    <path d="M 25 28 Q 70 8 135 15" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const RealisticCheckerSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 20 28 Q 45 8 60 26 T 90 22 Q 110 40 140 15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 35 32 Q 80 44 130 28" strokeWidth="2" strokeLinecap="round" />
    <path d="M 50 15 Q 58 38 75 25" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const RealisticDeptHeadSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 18 32 Q 40 12 55 28 T 85 18 Q 105 35 138 20" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 30 20 Q 75 10 145 25" strokeWidth="2" strokeLinecap="round" />
    <path d="M 65 12 Q 72 36 90 28 T 115 22" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const RealisticDeputySignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 22 25 Q 48 10 65 30 T 95 20 Q 115 36 142 16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 40 18 Q 85 12 135 30" strokeWidth="2" strokeLinecap="round" />
    <path d="M 70 14 Q 78 38 98 26" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const RealisticMayorSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 25 36 L 45 12 L 65 38 L 85 15 L 110 32 L 140 18" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 35 24 Q 85 45 145 22" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 75 10 L 80 42" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const OfficialLeaveFormModal: React.FC<OfficialLeaveFormModalProps> = ({
  isOpen,
  onClose,
  leaveData,
  employee,
  allLeaveRecords = [],
  allEmployees,
  onUpdateEmployee,
  onEditLeave,
  originalFileUrl,
  originalFileName,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Signatures display state (Default TRUE for realistic government look)
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [isBatchSignatureOpen, setIsBatchSignatureOpen] = useState(false);
  
  // Custom signatures state (if user draws or uploads)
  const [customSignatures, setCustomSignatures] = useState<{
    applicant?: string | null;
    checker?: string | null;
    deptHead?: string | null;
    deputy?: string | null;
    mayor?: string | null;
  }>({});

  // Active signature modal target
  const [activeSigner, setActiveSigner] = useState<{
    key: 'applicant' | 'checker' | 'deptHead' | 'deputy' | 'mayor';
    title: string;
    signerName: string;
  } | null>(null);

  // Helper date parser
  const parseDateParts = (dateStr?: string) => {
    if (!dateStr || dateStr.includes('..')) {
      const today = new Date();
      return {
        day: today.getDate().toString(),
        month: today.toLocaleDateString('th-TH', { month: 'short' }),
        fullMonth: today.toLocaleDateString('th-TH', { month: 'long' }),
        year: (today.getFullYear() + 543).toString().slice(-2),
        fullYear: (today.getFullYear() + 543).toString(),
      };
    }

    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return { day: '...', month: '......', fullMonth: '............', year: '..', fullYear: '....' };
      }
      const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const longMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const mIdx = d.getMonth();
      const thaiYear = d.getFullYear() + 543;
      return {
        day: d.getDate().toString(),
        month: shortMonths[mIdx],
        fullMonth: longMonths[mIdx],
        year: thaiYear.toString().slice(-2),
        fullYear: thaiYear.toString(),
      };
    } catch {
      return { day: '...', month: '......', fullMonth: '............', year: '..', fullYear: '....' };
    }
  };

  const isVacation = (leaveData.leaveType || 'ลาพักผ่อน') === 'ลาพักผ่อน';
  const isOfficialDuty = (leaveData.leaveType || 'ลาพักผ่อน') === 'ไปราชการ';
  const empName = leaveData.employeeName || employee?.name || 'นางสายรุ้ง นาคทั่ง';
  const empPosition = leaveData.position || employee?.position || 'นักจัดการงานทั่วไปชำนาญการ';
  const empDept = leaveData.department || employee?.department || 'สำนักปลัดเทศบาล';
  const leaveType = leaveData.leaveType || 'ลาพักผ่อน';
  const totalDays = leaveData.totalDays || 1;
  const phone = leaveData.phone || employee?.phone || '084-8087036';
  const reason = leaveData.reason || (isOfficialDuty ? 'เข้าร่วมการประชุม/อบรมพัฒนาศักยภาพ' : 'พักผ่อนประจำปี');
  const status = leaveData.status || 'อนุมัติ';

  // Official duty values
  const destination = leaveData.destination || 'ศาลากลางจังหวัดน่าน';
  const orderNumber = leaveData.orderNumber || 'นน ๕๔๗๐๑/พิเศษ';
  const transportType = leaveData.transportType || 'รถยนต์ส่วนกลาง';
  const withBudget = leaveData.withBudget !== undefined ? leaveData.withBudget : true;
  const budgetAmount = leaveData.budgetAmount || 2500;
  const fundingSource = leaveData.fundingSource || 'งบประมาณโครงการพัฒนาและเพิ่มประสิทธิภาพการปฏิบัติงาน';
  const companionNames = leaveData.companionNames || '';

  const docDateParts = parseDateParts(leaveData.createdAt);
  const startDateParts = parseDateParts(leaveData.startDate);
  const endDateParts = parseDateParts(leaveData.endDate);

  // Leave statistics calculation
  const pastLeavesCount = allLeaveRecords
    .filter(r => r.employeeId === (leaveData.employeeId || employee?.id) && r.leaveType === leaveType && r.status === 'อนุมัติ' && r.id !== leaveData.id)
    .reduce((sum, r) => sum + r.totalDays, 0);

  const currentLeaveDays = totalDays;
  const totalLeavesCombined = (pastLeavesCount || 6) + currentLeaveDays;

  // Vacation calculation (accumulated + current year)
  const accumulatedDays = employee?.leaveQuotas?.vacation ? Math.max(0, employee.leaveQuotas.vacation - 10) : 18;
  const thisYearQuota = 10;
  const totalVacationAvailable = accumulatedDays + thisYearQuota;

  // Get supervisor info dynamically for the employee's department
  const currentSupervisor = getSupervisorForDepartment(empDept);

  // Editable form state for quick print adjustments
  const [writtenAt, setWrittenAt] = useState('สำนักงานเทศบาลตำบลทุ่งช้าง');
  const [checkerName, setCheckerName] = useState('นางสาวสุพรรณี มีสา');
  const [checkerPosition, setCheckerPosition] = useState('นักทรัพยากรบุคคลชำนาญการ');
  const [deptHeadName, setDeptHeadName] = useState(currentSupervisor.name);
  const [deptHeadPosition, setDeptHeadPosition] = useState(currentSupervisor.position);
  const [deputyName, setDeputyName] = useState('นางสาวติยภา สัจจา');
  const [deputyPosition, setDeputyPosition] = useState('หัวหน้าสำนักปลัดเทศบาล รักษาราชการแทน\nปลัดเทศบาลตำบลทุ่งช้าง');
  const [mayorName, setMayorName] = useState('นายวินัย พนาขวา');
  const [mayorPosition, setMayorPosition] = useState('นายกเทศมนตรีตำบลทุ่งช้าง');
  const [approvalResult, setApprovalResult] = useState<'approved' | 'not_approved'>(status === 'ไม่อนุมัติ' ? 'not_approved' : 'approved');

  // Sync employee signature & official leadership signatures on open / department change
  useEffect(() => {
    if (isOpen) {
      let savedOfficial: OfficialSignatures = {};
      try {
        const stored = localStorage.getItem('thungchang_official_signatures');
        if (stored) savedOfficial = JSON.parse(stored);
      } catch (e) {
        console.error('Error loading official signatures', e);
      }

      const supervisorInfo = getSupervisorForDepartment(empDept);
      setDeptHeadName(supervisorInfo.name);
      setDeptHeadPosition(supervisorInfo.position);

      const resolvedSupervisorSig = resolveSupervisorSignatureUrl(
        supervisorInfo,
        allEmployees,
        savedOfficial
      );

      setCustomSignatures(prev => ({
        ...prev,
        applicant: employee?.signatureUrl || prev.applicant || null,
        mayor: savedOfficial.mayor || prev.mayor || null,
        deputy: savedOfficial.clerk || prev.deputy || null,
        deptHead: resolvedSupervisorSig || savedOfficial.deptHead || prev.deptHead || null,
        checker: savedOfficial.checker || prev.checker || null,
      }));
    }
  }, [isOpen, employee, empDept, allEmployees]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const sanitizedName = empName.replace(/\s+/g, '_');
      const filename = `แบบใบลา_${leaveType}_${sanitizedName}_${docDateParts.year}.pdf`;
      await exportElementToPDF(printAreaRef.current, {
        filename,
        orientation: 'portrait',
        scale: 2,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (activeSigner) {
      setCustomSignatures(prev => ({
        ...prev,
        [activeSigner.key]: dataUrl
      }));

      // If updating deptHead signature, persist to official signatures per department
      if (activeSigner.key === 'deptHead') {
        try {
          let savedOfficial: OfficialSignatures = {};
          const stored = localStorage.getItem('thungchang_official_signatures');
          if (stored) savedOfficial = JSON.parse(stored);
          const deptKey = currentSupervisor.deptKey;
          savedOfficial.deptHeadByDept = {
            ...(savedOfficial.deptHeadByDept || {}),
            [deptKey]: dataUrl
          };
          savedOfficial.deptHead = dataUrl;
          localStorage.setItem('thungchang_official_signatures', JSON.stringify(savedOfficial));
        } catch (e) {
          console.warn('Could not save dept head signature to localStorage', e);
        }
      }
    }
  };

  // Download Plain Text
  const handleDownloadText = () => {
    const text = `
แบบใบลา${isVacation ? 'พักผ่อน' : ` (${leaveType})`}
เขียนที่: ${writtenAt}
วันที่ ${docDateParts.day} เดือน ${docDateParts.month} พ.ศ. ${docDateParts.year}
เรื่อง: ขอ${leaveType}
เรียน: นายกเทศมนตรีตำบลทุ่งช้าง

ข้าพเจ้า: ${empName}  ตำแหน่ง: ${empPosition}
สังกัด: ${empDept}  เทศบาลตำบลทุ่งช้าง  อำเภอทุ่งช้าง  จังหวัดน่าน
${isVacation ? `มีวันลาพักผ่อนสะสม ${accumulatedDays} วันทำการ มีสิทธิลาพักผ่อนประจำปีนี้อีก ${thisYearQuota} วันทำการ รวมเป็น ${totalVacationAvailable} วันทำการ` : `มีความประสงค์ขอ${leaveType} เนื่องจาก ${reason}`}
ขอ${leaveType}ตั้งแต่วันที่ ${startDateParts.day} เดือน ${startDateParts.month} พ.ศ. ${startDateParts.year} ถึงวันที่ ${endDateParts.day} เดือน ${endDateParts.month} พ.ศ. ${endDateParts.year} มีกำหนด ${totalDays} วัน
ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่หมายเลขโทรศัพท์: ${phone}

ขอแสดงความนับถือ
(ลงชื่อ) [ ลายเซ็น ${empName} ]
( ${empName} )
( ${empPosition} )

สถิติการลาในปีงบประมาณ:
- ลามาแล้ว: ${pastLeavesCount || 6} วันทำการ
- ลาครั้งนี้: ${currentLeaveDays} วันทำการ
- รวมเป็น: ${totalLeavesCombined} วันทำการ
ผู้ตรวจสอบ: [ ลายเซ็น ${checkerName} ] ( ${checkerName} ) ${checkerPosition}

ความเห็นผู้บังคับบัญชาเบื้องต้น:
เห็นควรพิจารณาอนุญาต
(ลงชื่อ) [ ลายเซ็น ${deptHeadName} ]
( ${deptHeadName} )
${deptHeadPosition}

ความเห็นผู้บังคับบัญชา:
เห็นควรอนุญาต
(ลงชื่อ) [ ลายเซ็น ${deputyName} ]
( ${deputyName} )
${deputyPosition}

คำสั่ง:
[${approvalResult === 'approved' ? '✓' : ' '}] อนุญาต   [${approvalResult === 'not_approved' ? '✓' : ' '}] ไม่อนุญาต
(ลงชื่อ) [ ลายเซ็น ${mayorName} ]
( ${mayorName} )
${mayorPosition}
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `แบบใบลา_${leaveType}_${empName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[95vh] overflow-y-auto flex flex-col">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{isVacation ? 'แบบใบลาพักผ่อน' : `แบบใบลา (${leaveType})`}</span>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  เทศบาลตำบลทุ่งช้าง
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                เอกสารราชการพร้อมลายเซ็นผู้ขอลา ผู้ตรวจสอบ และผู้บังคับบัญชา
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onEditLeave && (
              <button
                type="button"
                onClick={onEditLeave}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="แก้ไขรายละเอียดวันลาของคำขอนี้"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>แก้ไขรายละเอียด</span>
              </button>
            )}

            {/* Toggle Signatures */}
            <button
              type="button"
              onClick={() => setShowSignatures(!showSignatures)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border ${
                showSignatures
                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="สลับการแสดงลายเซ็นดิจิทัล"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{showSignatures ? 'แสดงลายเซ็นแล้ว ✓' : 'ซ่อนลายเซ็น'}</span>
            </button>

            {originalFileUrl && (
              <a
                href={originalFileUrl}
                download={originalFileName || 'leave-scan'}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200"
                title="ดาวน์โหลดไฟล์ต้นฉบับที่แนบไว้"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ไฟล์แนบเดิม</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleDownloadText}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>ดาวน์โหลดข้อความ</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-400 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
              title="ดาวน์โหลดแบบใบลามาตรฐานเป็นไฟล์ PDF"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดเป็นไฟล์ PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              title="พิมพ์แบบฟอร์มผ่านคำสั่งพิมพ์ของเบราว์เซอร์"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบลา (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Container (A4 Print Perfect) */}
        <div className="flex-1 overflow-y-auto bg-slate-100/60 p-2 sm:p-4 rounded-2xl border border-slate-200 print:bg-white print:p-0 print:border-none">
          <div 
            ref={printAreaRef}
            id="printable-official-leave-form"
            className="bg-white text-black p-8 sm:p-12 shadow-md max-w-[210mm] mx-auto rounded-xl print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none print:w-full select-text font-sarabun-it9 thai-gov-doc"
            style={{ 
              fontFamily: "'TH Sarabun IT9', 'TH Sarabun IT๙', 'THSarabunIT9', 'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'THSarabunPSK', 'Sarabun', serif, sans-serif",
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#000000'
            }}
          >
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-black">
                {isOfficialDuty ? 'แบบบันทึกข้อความขออนุมัติไปปฏิบัติราชการ' : (isVacation ? 'แบบใบลาพักผ่อน' : `แบบใบลาป่วย, ลาคลอดบุตร, ลากิจส่วนตัว`)}
              </h1>
            </div>

            {/* Written Place & Date */}
            <div className="flex justify-end mb-6 text-sm sm:text-base">
              <div className="text-left space-y-1">
                <p>
                  เขียนที่ <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">{writtenAt}</span>
                </p>
                <p>
                  วันที่ <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">{docDateParts.day}</span> 
                  {' '}เดือน <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">{docDateParts.month}</span> 
                  {' '}พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">{docDateParts.year}</span>
                </p>
              </div>
            </div>

            {/* Subject & Recipient */}
            <div className="space-y-1.5 mb-5 text-sm sm:text-base">
              <div className="flex items-baseline">
                <span className="font-bold w-14 shrink-0">เรื่อง</span>
                <span>ขอ{leaveType}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-14 shrink-0">เรียน</span>
                <span>นายกเทศมนตรีตำบลทุ่งช้าง</span>
              </div>
            </div>

            {/* Paragraph 1 (Applicant details & Quota - Authentic Thai Distributed Justification) */}
            <div className="mb-6 text-sm sm:text-base leading-relaxed thai-doc-paragraph">
              ข้าพเจ้า <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{empName}</span>
              {' '}ตำแหน่ง <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{empPosition}</span>
              {' '}สังกัด <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{empDept}</span>
              {' '}เทศบาลตำบลทุ่งช้าง อำเภอทุ่งช้าง จังหวัดน่าน
              {isOfficialDuty ? (
                <>
                  {' '}มีความจำเป็นต้องเดินทางไปปฏิบัติราชการเพื่อ <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{reason}</span>
                  {orderNumber && <span> (ตามหนังสือ/คำสั่งเลขที่ <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{orderNumber}</span>)</span>}
                  {' '}สถานที่ไปราชการ ณ <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{destination || '-'}</span>
                  {companionNames && <span> พร้อมด้วย <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{companionNames}</span></span>}
                  {' '}เดินทางโดย <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{transportType || 'ยานพาหนะประจำทาง / รถยนต์ส่วนบุคคล'}</span>
                  {withBudget ? (
                    <span> ขออนุมัติเบิกจ่ายงบประมาณจำนวน <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{Number(budgetAmount).toLocaleString('th-TH')}</span> บาท ({fundingSource})</span>
                  ) : (
                    <span> (ไม่ขอเบิกจ่ายงบประมาณ)</span>
                  )}
                </>
              ) : isVacation ? (
                <>
                  {' '}มีวันลาพักผ่อนสะสม <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{accumulatedDays}</span> วันทำการ 
                  {' '}มีสิทธิลาพักผ่อนประจำปีนี้อีก <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{thisYearQuota}</span> วันทำการ 
                  {' '}รวมเป็น <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{totalVacationAvailable}</span> วันทำการ
                </>
              ) : (
                <>
                  {' '}มีความประสงค์ขอ<span className="font-bold">{leaveType}</span> เนื่องจาก 
                  <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5"> {reason} </span>
                </>
              )}
              {' '}ขอ{leaveType}ตั้งแต่วันที่ <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{startDateParts.day}</span>
              {' '}เดือน <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{startDateParts.month}</span>
              {' '}พ.ศ. <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{startDateParts.year}</span>
              {' '}ถึงวันที่ <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{endDateParts.day}</span>
              {' '}เดือน <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{endDateParts.month}</span>
              {' '}พ.ศ. <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{endDateParts.year}</span>
              {' '}มีกำหนด <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{totalDays}</span> วัน 
              {' '}ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่หมายเลขโทรศัพท์ <span className="font-bold underline decoration-dotted underline-offset-4 px-1.5">{phone}</span>
            </div>

            {/* Applicant Signature Block */}
            <div className="flex justify-end mb-6">
              <div className="text-center w-72 space-y-1 text-sm sm:text-base relative">
                <p>ขอแสดงความนับถือ</p>
                
                {/* Applicant Signature Area */}
                <div 
                  onClick={() => setActiveSigner({ key: 'applicant', title: 'เซ็นชื่อผู้ขอลา / บุคลากร', signerName: empName })}
                  className="py-1 cursor-pointer group relative flex flex-col items-center justify-center min-h-[48px]"
                  title="คลิกเพื่อเซ็นชื่อหรือวาดลายเซ็น"
                >
                  {showSignatures && (
                    <div className="h-10 flex items-center justify-center">
                      {customSignatures.applicant ? (
                        <img src={customSignatures.applicant} alt="Signature" className="h-10 object-contain" />
                      ) : (
                        <RealisticApplicantSignature />
                      )}
                    </div>
                  )}
                  <p className="font-serif text-slate-800 -mt-1">(ลงชื่อ) ........................................................</p>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-600 print:hidden absolute -top-3">
                    [คลิกเพื่อเปลี่ยนลายเซ็น]
                  </span>
                </div>

                <p className="font-bold">( {empName} )</p>
                <p className="text-xs sm:text-sm text-slate-800">( {empPosition} )</p>
              </div>
            </div>

            {/* Middle 2-Column Section: Statistics & Initial Recommendation */}
            <div className="grid grid-cols-2 gap-6 pt-2 mb-6 items-start text-xs sm:text-sm">
              {/* Left Column: Leave Statistics Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-black underline decoration-1 underline-offset-2">
                  สถิติการลาในปีงบประมาณ
                </h4>
                <table className="w-full text-center border-collapse border border-black text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 print:bg-transparent">
                      <th className="border border-black px-1.5 py-1 font-bold">ลามาแล้ว<br/>(วันทำการ)</th>
                      <th className="border border-black px-1.5 py-1 font-bold">ลาครั้งนี้<br/>(วันทำการ)</th>
                      <th className="border border-black px-1.5 py-1 font-bold">รวมเป็น<br/>(วันทำการ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black py-2 font-bold text-sm sm:text-base">
                        {pastLeavesCount || 6}
                      </td>
                      <td className="border border-black py-2 font-bold text-sm sm:text-base">
                        {currentLeaveDays}
                      </td>
                      <td className="border border-black py-2 font-bold text-sm sm:text-base">
                        {totalLeavesCombined}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Checker Signature */}
                <div 
                  onClick={() => setActiveSigner({ key: 'checker', title: 'เซ็นชื่อผู้ตรวจสอบสถิติวันลา', signerName: checkerName })}
                  className="pt-2 text-center space-y-0.5 cursor-pointer group relative"
                  title="คลิกเพื่อเซ็นชื่อหรือวาดลายเซ็น"
                >
                  {showSignatures && (
                    <div className="h-9 flex items-center justify-center">
                      {customSignatures.checker ? (
                        <img src={customSignatures.checker} alt="Signature" className="h-9 object-contain" />
                      ) : (
                        <RealisticCheckerSignature />
                      )}
                    </div>
                  )}
                  <p>(ลงชื่อ) ........................................ ผู้ตรวจสอบ</p>
                  <p className="font-bold">({checkerName})</p>
                  <p className="text-xs text-slate-800">{checkerPosition}</p>
                  <p className="text-xs text-slate-700">
                    วันที่ <span className="font-semibold text-blue-900">{docDateParts.day} {docDateParts.month} {docDateParts.fullYear}</span>
                  </p>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-600 print:hidden absolute top-0 right-2">
                    [แก้ไขลายเซ็น]
                  </span>
                </div>
              </div>

              {/* Right Column: Initial Supervisor Recommendation */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-black underline decoration-1 underline-offset-2">
                  ความเห็นผู้บังคับบัญชาเบื้องต้น
                </h4>
                <div className="pt-1 text-center font-medium text-xs sm:text-sm text-slate-900">
                  <p className="underline decoration-dotted underline-offset-4 font-bold text-blue-950">
                    เห็นควรพิจารณาอนุญาต
                  </p>
                </div>

                {/* Dept Head Signature */}
                <div 
                  onClick={() => setActiveSigner({ key: 'deptHead', title: 'เซ็นชื่อผู้บังคับบัญชาเบื้องต้น', signerName: deptHeadName })}
                  className="pt-1 text-center space-y-0.5 cursor-pointer group relative"
                  title="คลิกเพื่อเซ็นชื่อหรือวาดลายเซ็น"
                >
                  {showSignatures && (
                    <div className="h-9 flex items-center justify-center">
                      {customSignatures.deptHead ? (
                        <img src={customSignatures.deptHead} alt="Signature" className="h-9 object-contain" />
                      ) : (
                        getRealisticSignatureForDept(currentSupervisor.deptKey)
                      )}
                    </div>
                  )}
                  <p>(ลงชื่อ) ........................................</p>
                  <p className="font-bold">({deptHeadName})</p>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{deptHeadPosition}</p>
                  <p className="text-xs text-slate-700">
                    วันที่ <span className="font-semibold text-blue-900">{docDateParts.day}/{docDateParts.month}/{docDateParts.year}</span>
                  </p>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-600 print:hidden absolute top-0 right-2">
                    [แก้ไขลายเซ็น]
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom 2-Column Section: Supervisor Recommendation & Final Mayor Order */}
            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-dashed border-slate-300 items-start text-xs sm:text-sm">
              {/* Left Column: Final Recommendation (Municipal Clerk / Deputy) */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-black underline decoration-1 underline-offset-2">
                  ความเห็นผู้บังคับบัญชา
                </h4>
                <div className="pt-1 text-center font-medium text-xs sm:text-sm text-slate-900">
                  <p className="underline decoration-dotted underline-offset-4 font-bold text-blue-950">
                    เห็นควรอนุญาต
                  </p>
                </div>

                {/* Deputy/Clerk Signature */}
                <div 
                  onClick={() => setActiveSigner({ key: 'deputy', title: 'เซ็นชื่อความเห็นผู้บังคับบัญชา (ปลัดฯ)', signerName: deputyName })}
                  className="pt-1 text-center space-y-0.5 cursor-pointer group relative"
                  title="คลิกเพื่อเซ็นชื่อหรือวาดลายเซ็น"
                >
                  {showSignatures && (
                    <div className="h-9 flex items-center justify-center">
                      {customSignatures.deputy ? (
                        <img src={customSignatures.deputy} alt="Signature" className="h-9 object-contain" />
                      ) : (
                        <RealisticDeputySignature />
                      )}
                    </div>
                  )}
                  <p>(ลงชื่อ) ........................................</p>
                  <p className="font-bold">({deputyName})</p>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-tight">{deputyPosition}</p>
                  <p className="text-xs text-slate-700">
                    วันที่ <span className="font-semibold text-blue-900">{docDateParts.day}/{docDateParts.month}/{docDateParts.year}</span>
                  </p>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-600 print:hidden absolute top-0 right-2">
                    [แก้ไขลายเซ็น]
                  </span>
                </div>
              </div>

              {/* Right Column: Mayor Order */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-black underline decoration-1 underline-offset-2">
                  คำสั่ง
                </h4>
                
                {/* Checkbox for Allow / Disallow */}
                <div className="flex items-center justify-center space-x-6 py-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-sm">
                    <span className="w-5 h-5 border-2 border-black flex items-center justify-center text-xs font-black text-blue-900">
                      {approvalResult === 'approved' ? '✓' : ''}
                    </span>
                    <span>อนุญาต</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-sm">
                    <span className="w-5 h-5 border-2 border-black flex items-center justify-center text-xs font-black text-rose-900">
                      {approvalResult === 'not_approved' ? '✓' : ''}
                    </span>
                    <span>ไม่อนุญาต</span>
                  </label>
                </div>

                {/* Mayor Signature */}
                <div 
                  onClick={() => setActiveSigner({ key: 'mayor', title: 'เซ็นชื่อคำสั่งนายกเทศมนตรี', signerName: mayorName })}
                  className="pt-1 text-center space-y-0.5 cursor-pointer group relative"
                  title="คลิกเพื่อเซ็นชื่อหรือวาดลายเซ็น"
                >
                  {showSignatures && (
                    <div className="h-9 flex items-center justify-center">
                      {customSignatures.mayor ? (
                        <img src={customSignatures.mayor} alt="Signature" className="h-9 object-contain" />
                      ) : (
                        <RealisticMayorSignature />
                      )}
                    </div>
                  )}
                  <p>(ลงชื่อ) ........................................</p>
                  <p className="font-bold">({mayorName})</p>
                  <p className="text-xs text-slate-800 font-semibold">{mayorPosition}</p>
                  <p className="text-xs text-slate-700">
                    วันที่ <span className="font-semibold text-blue-900">{docDateParts.day}/{docDateParts.month}/{docDateParts.year}</span>
                  </p>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-600 print:hidden absolute top-0 right-2">
                    [แก้ไขลายเซ็น]
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Footer Note */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center print:text-slate-500">
              <span>สำนักงานเทศบาลตำบลทุ่งช้าง อำเภอทุ่งช้าง จังหวัดน่าน</span>
              <span>ระบบควบคุมวันลาอิเล็กทรอนิกส์</span>
            </div>
          </div>
        </div>

        {/* Quick Customization Toolbar (Hidden on print) */}
        <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 print:hidden flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-3 text-slate-600">
            <span className="font-bold text-slate-800">ผลคำสั่งนายกเทศมนตรี:</span>
            <button
              type="button"
              onClick={() => setApprovalResult('approved')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                approvalResult === 'approved' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              [ ✓ ] อนุญาต
            </button>
            <button
              type="button"
              onClick={() => setApprovalResult('not_approved')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                approvalResult === 'not_approved' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              [ ✓ ] ไม่อนุญาต
            </button>

            <button
              type="button"
              onClick={() => setShowSignatures(!showSignatures)}
              className="ml-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1"
            >
              <PenTool className="w-3 h-3" />
              <span>{showSignatures ? 'ซ่อนลายเซ็น' : 'แสดงลายเซ็น'}</span>
            </button>

            {allEmployees && onUpdateEmployee && (
              <button
                type="button"
                onClick={() => setIsBatchSignatureOpen(true)}
                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Upload className="w-3 h-3" />
                <span>นำเข้า/จัดการลายเซ็นดิจิทัล</span>
              </button>
            )}
          </div>

          <div className="text-slate-500 text-[11px] flex items-center space-x-2">
            <span>💡 คลิกที่ชื่อหรือลายเซ็นในเอกสารเพื่อวาดลายเซ็นใหม่ได้ทันที</span>
          </div>
        </div>

      </div>

      {/* Batch Signature Management Modal */}
      {isBatchSignatureOpen && allEmployees && onUpdateEmployee && (
        <BatchSignatureUploadModal
          isOpen={isBatchSignatureOpen}
          onClose={() => setIsBatchSignatureOpen(false)}
          employees={allEmployees}
          onUpdateEmployee={(updatedEmp) => {
            onUpdateEmployee(updatedEmp);
            if (employee && employee.id === updatedEmp.id) {
              setCustomSignatures(prev => ({
                ...prev,
                applicant: updatedEmp.signatureUrl || null
              }));
            }
          }}
          onUpdateOfficialSignatures={(sigs) => {
            setCustomSignatures(prev => ({
              ...prev,
              mayor: sigs.mayor || prev.mayor,
              deputy: sigs.clerk || prev.deputy,
              deptHead: sigs.deptHead || prev.deptHead,
              checker: sigs.checker || prev.checker
            }));
          }}
        />
      )}

      {/* Signature Pad Modal */}
      {activeSigner && (
        <SignaturePadModal
          isOpen={!!activeSigner}
          onClose={() => setActiveSigner(null)}
          title={activeSigner.title}
          signerName={activeSigner.signerName}
          currentSignatureUrl={customSignatures[activeSigner.key]}
          onSaveSignature={handleSaveSignature}
        />
      )}
    </div>
  );
};
