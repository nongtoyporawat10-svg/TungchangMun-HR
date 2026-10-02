import React, { useState, useRef, useEffect } from 'react';
import { LeaveRecord, Employee, AdminUser, ApprovalStage, LeaveStatus } from '../types';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  PenTool, 
  UserCheck, 
  FileText, 
  Sparkles,
  Building2,
  CalendarDays,
  Send,
  XCircle,
  RotateCcw,
  Check
} from 'lucide-react';
import { getSupervisorForDepartment } from '../utils/supervisorConfig';
import { calculateLeaveBreakdown } from '../utils/thaiHolidays';

interface LeaveApprovalWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRecord: LeaveRecord;
  employee?: Employee;
  allLeaveRecords: LeaveRecord[];
  currentAdmin: AdminUser | null;
  onSaveRecord: (updatedRecord: LeaveRecord) => void;
}

export const LeaveApprovalWorkflowModal: React.FC<LeaveApprovalWorkflowModalProps> = ({
  isOpen,
  onClose,
  leaveRecord,
  employee,
  allLeaveRecords,
  currentAdmin,
  onSaveRecord,
}) => {
  const [record, setRecord] = useState<LeaveRecord>(leaveRecord);
  const [activeTabStep, setActiveTabStep] = useState<number>(1);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    setRecord(leaveRecord);
    // Determine which step to open by default
    if (!leaveRecord.checkerApproved) setActiveTabStep(1);
    else if (!leaveRecord.deptHeadApproved) setActiveTabStep(2);
    else if (!leaveRecord.clerkApproved) setActiveTabStep(3);
    else if (!leaveRecord.mayorApproved) setActiveTabStep(4);
    else setActiveTabStep(4);
  }, [leaveRecord]);

  if (!isOpen) return null;

  // Department supervisor details
  const deptSupervisor = getSupervisorForDepartment(record.department || 'สำนักปลัดเทศบาล');

  // Leave stats calculation
  const accumulated = employee?.accumulatedLeaveDays ?? 10;
  const currentQuota = employee?.leaveQuotas?.vacation ?? 10;
  const totalAvailable = accumulated + currentQuota;
  
  // Historical used days this year
  const pastLeaves = allLeaveRecords.filter(r => 
    r.employeeId === record.employeeId && 
    r.id !== record.id && 
    r.status === 'อนุมัติ' &&
    r.leaveType === record.leaveType
  );
  const usedBefore = pastLeaves.reduce((acc, curr) => acc + (curr.totalDays || 0), 0);
  const currentDays = record.totalDays || 1;
  const remaining = Math.max(0, totalAvailable - usedBefore - currentDays);

  const todayStr = new Date().toISOString().split('T')[0];

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsSigning(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSigning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f2b82'; // Government Blue Ink
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnOnCanvas(true);
  };

  const stopDrawing = () => {
    setIsSigning(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnOnCanvas(false);
  };

  const getCanvasDataUrl = (): string | undefined => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnOnCanvas) return undefined;
    return canvas.toDataURL('image/png');
  };

  // STEP 1: Approve Leave Statistics (HR / Checker)
  const handleApproveStep1 = (comment: string, checkerName: string, checkerPos: string) => {
    const sig = getCanvasDataUrl() || currentAdmin?.signatureUrl || undefined;
    const updated: LeaveRecord = {
      ...record,
      checkerApproved: true,
      checkerName: checkerName || currentAdmin?.name || 'นางสาวสุพรรณี มีสา',
      checkerPosition: checkerPos || currentAdmin?.position || 'เจ้าพนักงานธุรการชำนาญงาน',
      checkerComment: comment || 'ได้ตรวจสอบความถูกต้องของสถิติวันลาแล้ว',
      checkerSignatureUrl: sig,
      checkerApprovedAt: todayStr,
      accumulatedDaysSnapshot: accumulated,
      thisYearQuotaSnapshot: currentQuota,
      totalAvailableSnapshot: totalAvailable,
      usedBeforeSnapshot: usedBefore,
      currentLeaveDaysSnapshot: currentDays,
      remainingSnapshot: remaining,
      currentApprovalStage: 'pending_dept_head'
    };

    setRecord(updated);
    onSaveRecord(updated);
    setActiveTabStep(2);
    clearCanvas();
    setIsDrawingSignature(false);
  };

  // STEP 2: Approve Head of Department
  const handleApproveStep2 = (comment: string, deptHeadName: string, deptHeadPos: string) => {
    const sig = getCanvasDataUrl() || currentAdmin?.signatureUrl || undefined;
    const updated: LeaveRecord = {
      ...record,
      deptHeadApproved: true,
      deptHeadName: deptHeadName || deptSupervisor.name,
      deptHeadPosition: deptHeadPos || deptSupervisor.position,
      deptHeadComment: comment || 'เห็นควรพิจารณาอนุญาตการลาตามเสนอ',
      deptHeadSignatureUrl: sig,
      deptHeadApprovedAt: todayStr,
      currentApprovalStage: 'pending_clerk'
    };

    setRecord(updated);
    onSaveRecord(updated);
    setActiveTabStep(3);
    clearCanvas();
    setIsDrawingSignature(false);
  };

  // STEP 3: Approve Municipal Clerk
  const handleApproveStep3 = (comment: string, clerkName: string, clerkPos: string) => {
    const sig = getCanvasDataUrl() || currentAdmin?.signatureUrl || undefined;
    const updated: LeaveRecord = {
      ...record,
      clerkApproved: true,
      clerkName: clerkName || 'นายสมชาย ใจดี',
      clerkPosition: clerkPos || 'ปลัดเทศบาลตำบลทุ่งช้าง',
      clerkComment: comment || 'เห็นควรอนุญาต',
      clerkSignatureUrl: sig,
      clerkApprovedAt: todayStr,
      currentApprovalStage: 'pending_mayor'
    };

    setRecord(updated);
    onSaveRecord(updated);
    setActiveTabStep(4);
    clearCanvas();
    setIsDrawingSignature(false);
  };

  // STEP 4: Final Order by Mayor
  const handleApproveStep4 = (order: 'อนุญาต' | 'ไม่อนุมัติ', comment: string, mayorName: string, mayorPos: string) => {
    const sig = getCanvasDataUrl() || currentAdmin?.signatureUrl || undefined;
    const isApproved = order === 'อนุญาต';
    
    const updated: LeaveRecord = {
      ...record,
      mayorApproved: true,
      mayorName: mayorName || 'นายพิพัฒน์ เพ็ชรพิชัย',
      mayorPosition: mayorPos || 'นายกเทศมนตรีตำบลทุ่งช้าง',
      mayorOrder: order,
      mayorComment: comment || (isApproved ? 'อนุญาตตามเสนอ' : 'ไม่อนุมัติ'),
      mayorSignatureUrl: sig,
      mayorApprovedAt: todayStr,
      status: isApproved ? 'อนุมัติ' : 'ไม่อนุมัติ',
      currentApprovalStage: isApproved ? 'completed' : 'rejected',
      signaturesComplete: isApproved,
      approvedBy: isApproved ? `${mayorName || 'นายพิพัฒน์ เพ็ชรพิชัย'} (นายกเทศมนตรีตำบลทุ่งช้าง)` : undefined
    };

    setRecord(updated);
    onSaveRecord(updated);
    clearCanvas();
    setIsDrawingSignature(false);
    onClose();
  };

  // Status badge indicator
  const getStageBadge = () => {
    if (record.status === 'อนุมัติ') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>อนุมัติเสร็จสมบูรณ์ทุกขั้นตอน</span>
        </span>
      );
    }
    if (record.status === 'ไม่อนุมัติ') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>มีคำสั่งไม่อนุมัติ</span>
        </span>
      );
    }
    if (!record.checkerApproved) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">ขั้นที่ 1: รอตรวจสอบสถิติวันลา (HR)</span>;
    }
    if (!record.deptHeadApproved) {
      return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">ขั้นที่ 2: รอความเห็น ผอ.กอง</span>;
    }
    if (!record.clerkApproved) {
      return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">ขั้นที่ 3: รอความเห็น ปลัดเทศบาล</span>;
    }
    return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">ขั้นที่ 4: รอนายกเทศมนตรีสั่งการ</span>;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full">
                  Workflow การเสนอและอนุมัติ 4 ลำดับขั้น
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mt-0.5">การพิจารณาอนุมัติคำขอลาตามระเบียบราชการ</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leave Request Quick Summary Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
              {record.employeeName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">{record.employeeName}</div>
              <div className="text-slate-500">{record.department} • ขอ{record.leaveType} ({record.totalDays} วันทำการ)</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStageBadge()}
          </div>
        </div>

        {/* 4-Step Interactive Progress Tabs */}
        <div className="grid grid-cols-4 bg-slate-100 p-1.5 border-b border-slate-200 text-xs">
          <button
            onClick={() => setActiveTabStep(1)}
            className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all ${
              activeTabStep === 1 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                : record.checkerApproved 
                  ? 'text-emerald-700 hover:bg-white/50' 
                  : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center space-x-1">
              {record.checkerApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>1.</span>}
              <span className="truncate">ตรวจสถิติ</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">งานบุคคล</span>
          </button>

          <button
            onClick={() => setActiveTabStep(2)}
            className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all ${
              activeTabStep === 2 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                : record.deptHeadApproved 
                  ? 'text-emerald-700 hover:bg-white/50' 
                  : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center space-x-1">
              {record.deptHeadApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>2.</span>}
              <span className="truncate">ผอ.กอง</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">หัวหน้าสังกัด</span>
          </button>

          <button
            onClick={() => setActiveTabStep(3)}
            className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all ${
              activeTabStep === 3 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                : record.clerkApproved 
                  ? 'text-emerald-700 hover:bg-white/50' 
                  : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center space-x-1">
              {record.clerkApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>3.</span>}
              <span className="truncate">ปลัดเทศบาล</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">ผู้บังคับบัญชา</span>
          </button>

          <button
            onClick={() => setActiveTabStep(4)}
            className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all ${
              activeTabStep === 4 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                : record.mayorApproved 
                  ? 'text-emerald-700 hover:bg-white/50' 
                  : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center space-x-1">
              {record.mayorApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>4.</span>}
              <span className="truncate">นายกเทศมนตรี</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">คำสั่งอนุมัติ</span>
          </button>
        </div>

        {/* Content of the active step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1 FORM: Leave Statistics Checking */}
          {activeTabStep === 1 && (
            <Step1CheckerForm
              record={record}
              employee={employee}
              accumulated={accumulated}
              currentQuota={currentQuota}
              totalAvailable={totalAvailable}
              usedBefore={usedBefore}
              currentDays={currentDays}
              remaining={remaining}
              currentAdmin={currentAdmin}
              isDrawingSignature={isDrawingSignature}
              setIsDrawingSignature={setIsDrawingSignature}
              canvasRef={canvasRef}
              startDrawing={startDrawing}
              draw={draw}
              stopDrawing={stopDrawing}
              clearCanvas={clearCanvas}
              onApprove={handleApproveStep1}
            />
          )}

          {/* STEP 2 FORM: Head of Department */}
          {activeTabStep === 2 && (
            <Step2DeptHeadForm
              record={record}
              deptSupervisor={deptSupervisor}
              currentAdmin={currentAdmin}
              isDrawingSignature={isDrawingSignature}
              setIsDrawingSignature={setIsDrawingSignature}
              canvasRef={canvasRef}
              startDrawing={startDrawing}
              draw={draw}
              stopDrawing={stopDrawing}
              clearCanvas={clearCanvas}
              onApprove={handleApproveStep2}
            />
          )}

          {/* STEP 3 FORM: Municipal Clerk */}
          {activeTabStep === 3 && (
            <Step3ClerkForm
              record={record}
              currentAdmin={currentAdmin}
              isDrawingSignature={isDrawingSignature}
              setIsDrawingSignature={setIsDrawingSignature}
              canvasRef={canvasRef}
              startDrawing={startDrawing}
              draw={draw}
              stopDrawing={stopDrawing}
              clearCanvas={clearCanvas}
              onApprove={handleApproveStep3}
            />
          )}

          {/* STEP 4 FORM: Mayor Final Decision */}
          {activeTabStep === 4 && (
            <Step4MayorForm
              record={record}
              currentAdmin={currentAdmin}
              isDrawingSignature={isDrawingSignature}
              setIsDrawingSignature={setIsDrawingSignature}
              canvasRef={canvasRef}
              startDrawing={startDrawing}
              draw={draw}
              stopDrawing={stopDrawing}
              clearCanvas={clearCanvas}
              onApprove={handleApproveStep4}
            />
          )}

        </div>

      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS FOR EACH STEP
// ==========================================

// STEP 1: HR Leave Statistics Checker
const Step1CheckerForm: React.FC<{
  record: LeaveRecord;
  employee?: Employee;
  accumulated: number;
  currentQuota: number;
  totalAvailable: number;
  usedBefore: number;
  currentDays: number;
  remaining: number;
  currentAdmin: AdminUser | null;
  isDrawingSignature: boolean;
  setIsDrawingSignature: (val: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDrawing: any;
  draw: any;
  stopDrawing: any;
  clearCanvas: any;
  onApprove: (comment: string, name: string, pos: string) => void;
}> = ({
  record,
  accumulated,
  currentQuota,
  totalAvailable,
  usedBefore,
  currentDays,
  remaining,
  currentAdmin,
  isDrawingSignature,
  setIsDrawingSignature,
  canvasRef,
  startDrawing,
  draw,
  stopDrawing,
  clearCanvas,
  onApprove,
}) => {
  const [comment, setComment] = useState(record.checkerComment || 'ได้ตรวจสอบความถูกต้องของสถิติวันลาแล้ว');
  const [checkerName, setCheckerName] = useState(record.checkerName || currentAdmin?.name || 'นางสาวสุพรรณี มีสา');
  const [checkerPos, setCheckerPos] = useState(record.checkerPosition || currentAdmin?.position || 'เจ้าพนักงานธุรการชำนาญงาน');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900">ขั้นที่ 1: ตรวจสอบสถิติวันลา (งานการเจ้าหน้าที่ / HR)</h4>
          <p className="text-xs text-slate-500">ตรวจสอบยอดวันลาสะสม วันลาที่ใช้ไป และวันลาคงเหลือตามระเบียบสำนักนายกรัฐมนตรี</p>
        </div>
        {record.checkerApproved && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตรวจสถิติแล้ว ({record.checkerApprovedAt})</span>
          </span>
        )}
      </div>

      {/* Official Leave Quota Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
          สถิติวันลาพักผ่อนประจำปีงบประมาณ
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white text-center text-xs">
          <div className="p-3">
            <div className="text-[11px] text-slate-500">ลาสะสม</div>
            <div className="text-sm font-bold text-slate-800 mt-1">{accumulated} วัน</div>
          </div>
          <div className="p-3">
            <div className="text-[11px] text-slate-500">สิทธิ์ปีนี้</div>
            <div className="text-sm font-bold text-slate-800 mt-1">{currentQuota} วัน</div>
          </div>
          <div className="p-3 bg-indigo-50/50">
            <div className="text-[11px] text-indigo-700 font-semibold">รวมมีสิทธิ์</div>
            <div className="text-sm font-extrabold text-indigo-900 mt-1">{totalAvailable} วัน</div>
          </div>
          <div className="p-3">
            <div className="text-[11px] text-slate-500">ลาไปแล้ว</div>
            <div className="text-sm font-bold text-slate-800 mt-1">{usedBefore} วัน</div>
          </div>
          <div className="p-3 bg-amber-50/50">
            <div className="text-[11px] text-amber-700 font-semibold">ลาครั้งนี้</div>
            <div className="text-sm font-extrabold text-amber-900 mt-1">{currentDays} วัน</div>
          </div>
          <div className="p-3 bg-emerald-50/50">
            <div className="text-[11px] text-emerald-700 font-semibold">คงเหลือ</div>
            <div className="text-sm font-extrabold text-emerald-900 mt-1">{remaining} วัน</div>
          </div>
        </div>
      </div>

      {/* Officer Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อผู้ตรวจสอบ</label>
          <input
            type="text"
            value={checkerName}
            onChange={(e) => setCheckerName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
          <input
            type="text"
            value={checkerPos}
            onChange={(e) => setCheckerPos(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">ความเห็นผู้ตรวจสอบสถิติ</label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
        />
      </div>

      {/* Signature drawing toggle */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <PenTool className="w-4 h-4 text-indigo-600" />
            <span>ลายมือชื่อดิจิทัลผู้ตรวจสอบสถิติ</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDrawingSignature(!isDrawingSignature)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
          >
            {isDrawingSignature ? 'ใช้ลายเซ็นเริ่มต้น' : '+ เซ็นลายมือชื่อสด'}
          </button>
        </div>

        {isDrawingSignature && (
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={360}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-white border-2 border-dashed border-indigo-300 rounded-xl w-full h-24 touch-none cursor-crosshair"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างลายเซ็น</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approve button */}
      <div className="pt-3 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => onApprove(comment, checkerName, checkerPos)}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ยืนยันตรวจสถิติวันลา & ส่งต่อให้ ผอ.กอง (ขั้นที่ 2)</span>
        </button>
      </div>
    </div>
  );
};

// STEP 2: Head of Department
const Step2DeptHeadForm: React.FC<{
  record: LeaveRecord;
  deptSupervisor: { name: string; position: string; departmentName: string };
  currentAdmin: AdminUser | null;
  isDrawingSignature: boolean;
  setIsDrawingSignature: (val: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDrawing: any;
  draw: any;
  stopDrawing: any;
  clearCanvas: any;
  onApprove: (comment: string, name: string, pos: string) => void;
}> = ({
  record,
  deptSupervisor,
  currentAdmin,
  isDrawingSignature,
  setIsDrawingSignature,
  canvasRef,
  startDrawing,
  draw,
  stopDrawing,
  clearCanvas,
  onApprove,
}) => {
  const [comment, setComment] = useState(record.deptHeadComment || 'เห็นควรพิจารณาอนุญาตการลาตามเสนอ');
  const [deptHeadName, setDeptHeadName] = useState(record.deptHeadName || deptSupervisor.name);
  const [deptHeadPos, setDeptHeadPos] = useState(record.deptHeadPosition || deptSupervisor.position);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900">ขั้นที่ 2: ความเห็นผู้บังคับบัญชาเบื้องต้น (ผอ.กอง / หัวหน้าส่วนราชการ)</h4>
          <p className="text-xs text-slate-500">พิจารณาความเหมาะสมและภารกิจของกอง/ส่วนราชการ: <strong className="text-slate-800">{record.department}</strong></p>
        </div>
        {record.deptHeadApproved && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>เห็นชอบแล้ว ({record.deptHeadApprovedAt})</span>
          </span>
        )}
      </div>

      {/* Suggested Quick Comments */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">เลือกความเห็นมาตรฐาน:</label>
        <div className="flex flex-wrap gap-2">
          {[
            'เห็นควรพิจารณาอนุญาตการลาตามเสนอ',
            'เห็นควรอนุญาต ไม่กระทบต่อการปฏิบัติงาน',
            'เห็นควรอนุญาต',
            'เห็นควรให้ลาตามสิทธิ์'
          ].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setComment(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                comment === c 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">ความเห็นของผู้บังคับบัญชาเบื้องต้น</label>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อผู้บังคับบัญชาเบื้องต้น</label>
          <input
            type="text"
            value={deptHeadName}
            onChange={(e) => setDeptHeadName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
          <input
            type="text"
            value={deptHeadPos}
            onChange={(e) => setDeptHeadPos(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
      </div>

      {/* Signature drawing toggle */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <PenTool className="w-4 h-4 text-indigo-600" />
            <span>ลายมือชื่อดิจิทัลผู้บังคับบัญชาเบื้องต้น</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDrawingSignature(!isDrawingSignature)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
          >
            {isDrawingSignature ? 'ใช้ลายเซ็นเริ่มต้น' : '+ เซ็นลายมือชื่อสด'}
          </button>
        </div>

        {isDrawingSignature && (
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={360}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-white border-2 border-dashed border-indigo-300 rounded-xl w-full h-24 touch-none cursor-crosshair"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างลายเซ็น</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => onApprove(comment, deptHeadName, deptHeadPos)}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ลงความเห็นชอบ & ส่งต่อให้ ปลัดเทศบาล (ขั้นที่ 3)</span>
        </button>
      </div>
    </div>
  );
};

// STEP 3: Municipal Clerk
const Step3ClerkForm: React.FC<{
  record: LeaveRecord;
  currentAdmin: AdminUser | null;
  isDrawingSignature: boolean;
  setIsDrawingSignature: (val: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDrawing: any;
  draw: any;
  stopDrawing: any;
  clearCanvas: any;
  onApprove: (comment: string, name: string, pos: string) => void;
}> = ({
  record,
  currentAdmin,
  isDrawingSignature,
  setIsDrawingSignature,
  canvasRef,
  startDrawing,
  draw,
  stopDrawing,
  clearCanvas,
  onApprove,
}) => {
  const [comment, setComment] = useState(record.clerkComment || 'เห็นควรอนุญาต');
  const [clerkName, setClerkName] = useState(record.clerkName || 'นายสมชาย ใจดี');
  const [clerkPos, setClerkPos] = useState(record.clerkPosition || 'ปลัดเทศบาลตำบลทุ่งช้าง');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900">ขั้นที่ 3: ความเห็นปลัดเทศบาลตำบลทุ่งช้าง</h4>
          <p className="text-xs text-slate-500">พิจารณากลั่นกรองและให้ความเห็นชอบก่อนนำเสนอนายกเทศมนตรี</p>
        </div>
        {record.clerkApproved && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>เห็นชอบแล้ว ({record.clerkApprovedAt})</span>
          </span>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">เลือกความเห็นมาตรฐาน:</label>
        <div className="flex flex-wrap gap-2">
          {['เห็นควรอนุญาต', 'พิจารณาอนุญาต', 'เห็นชอบตามเสนอ'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setComment(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                comment === c 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">ความเห็นของปลัดเทศบาล</label>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อปลัดเทศบาล / ผู้รักษาราชการแทน</label>
          <input
            type="text"
            value={clerkName}
            onChange={(e) => setClerkName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
          <input
            type="text"
            value={clerkPos}
            onChange={(e) => setClerkPos(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
      </div>

      {/* Signature drawing toggle */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <PenTool className="w-4 h-4 text-purple-600" />
            <span>ลายมือชื่อดิจิทัลปลัดเทศบาล</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDrawingSignature(!isDrawingSignature)}
            className="text-purple-600 hover:text-purple-800 text-xs font-bold"
          >
            {isDrawingSignature ? 'ใช้ลายเซ็นเริ่มต้น' : '+ เซ็นลายมือชื่อสด'}
          </button>
        </div>

        {isDrawingSignature && (
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={360}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-white border-2 border-dashed border-purple-300 rounded-xl w-full h-24 touch-none cursor-crosshair"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างลายเซ็น</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => onApprove(comment, clerkName, clerkPos)}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ลงความเห็นชอบ & นำเสนอนายกเทศมนตรี (ขั้นที่ 4)</span>
        </button>
      </div>
    </div>
  );
};

// STEP 4: Mayor Final Order
const Step4MayorForm: React.FC<{
  record: LeaveRecord;
  currentAdmin: AdminUser | null;
  isDrawingSignature: boolean;
  setIsDrawingSignature: (val: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDrawing: any;
  draw: any;
  stopDrawing: any;
  clearCanvas: any;
  onApprove: (order: 'อนุญาต' | 'ไม่อนุมัติ', comment: string, name: string, pos: string) => void;
}> = ({
  record,
  currentAdmin,
  isDrawingSignature,
  setIsDrawingSignature,
  canvasRef,
  startDrawing,
  draw,
  stopDrawing,
  clearCanvas,
  onApprove,
}) => {
  const [order, setOrder] = useState<'อนุญาต' | 'ไม่อนุมัติ'>(record.mayorOrder || 'อนุญาต');
  const [comment, setComment] = useState(record.mayorComment || 'อนุญาต');
  const [mayorName, setMayorName] = useState(record.mayorName || 'นายพิพัฒน์ เพ็ชรพิชัย');
  const [mayorPos, setMayorPos] = useState(record.mayorPosition || 'นายกเทศมนตรีตำบลทุ่งช้าง');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900">ขั้นที่ 4: คำสั่งนายกเทศมนตรีตำบลทุ่งช้าง (ผู้มีอำนาจสั่งการสูงสุด)</h4>
          <p className="text-xs text-slate-500">ลงคำสั่งอนุญาต หรือ ไม่อนุมัติการลาตามอำนาจหน้าที่</p>
        </div>
        {record.mayorApproved && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
            record.mayorOrder === 'อนุญาต' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>มีคำสั่ง{record.mayorOrder}แล้ว ({record.mayorApprovedAt})</span>
          </span>
        )}
      </div>

      {/* Decision Order Selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => { setOrder('อนุญาต'); setComment('อนุญาต'); }}
          className={`p-4 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all font-bold ${
            order === 'อนุญาต'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 className={`w-5 h-5 ${order === 'อนุญาต' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-base">🔘 อนุญาต</span>
        </button>

        <button
          type="button"
          onClick={() => { setOrder('ไม่อนุมัติ'); setComment('ไม่อนุมัติเนื่องจากมีภารกิจจำเป็นเร่งด่วน'); }}
          className={`p-4 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all font-bold ${
            order === 'ไม่อนุมัติ'
              ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-md ring-2 ring-rose-500/20'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <XCircle className={`w-5 h-5 ${order === 'ไม่อนุมัติ' ? 'text-rose-600' : 'text-slate-400'}`} />
          <span className="text-base">❌ ไม่อนุมัติ</span>
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">ข้อความคำสั่งเพิ่มเติม</label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อนายกเทศมนตรี / ผู้มีอำนาจสั่งการ</label>
          <input
            type="text"
            value={mayorName}
            onChange={(e) => setMayorName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
          <input
            type="text"
            value={mayorPos}
            onChange={(e) => setMayorPos(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
      </div>

      {/* Signature drawing toggle */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <PenTool className="w-4 h-4 text-emerald-600" />
            <span>ลายมือชื่อดิจิทัลนายกเทศมนตรีตำบลทุ่งช้าง</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDrawingSignature(!isDrawingSignature)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
          >
            {isDrawingSignature ? 'ใช้ลายเซ็นเริ่มต้น' : '+ เซ็นลายมือชื่อสด'}
          </button>
        </div>

        {isDrawingSignature && (
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={360}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-white border-2 border-dashed border-emerald-300 rounded-xl w-full h-24 touch-none cursor-crosshair"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างลายเซ็น</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => onApprove(order, comment, mayorName, mayorPos)}
          className={`px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 ${
            order === 'อนุญาต' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/20' 
              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{order === 'อนุญาต' ? '👑 ลงคำสั่งอนุมัติวันลา (เสร็จสิ้นทุกขั้นตอน)' : '❌ ลงคำสั่งไม่อนุมัติ'}</span>
        </button>
      </div>
    </div>
  );
};
