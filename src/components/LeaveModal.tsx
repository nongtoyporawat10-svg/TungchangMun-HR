import React, { useState, useEffect, useMemo } from 'react';
import { Employee, LeaveRecord, LeaveType, LeaveStatus } from '../types';
import { 
  X, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  UserPlus, 
  CalendarDays, 
  Info, 
  ShieldCheck,
  AlertCircle,
  Briefcase,
  MapPin,
  Car,
  DollarSign,
  Users,
  Edit3
} from 'lucide-react';
import { calculateLeaveBreakdown } from '../utils/thaiHolidays';
import { ThaiHolidaysModal } from './ThaiHolidaysModal';

interface LeaveModalProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRecord: LeaveRecord) => void;
  onOpenAIModal?: () => void;
  onOpenAddEmployeeModal?: () => void;
  editingRecord?: LeaveRecord | null;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  employees,
  isOpen,
  onClose,
  onSubmit,
  onOpenAIModal,
  onOpenAddEmployeeModal,
  editingRecord = null,
}) => {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('ลาพักผ่อน');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<LeaveStatus>('อนุมัติ');
  const [reason, setReason] = useState<string>('');
  const [countMode, setCountMode] = useState<'working_days' | 'calendar_days'>('working_days');
  const [manualDaysOverride, setManualDaysOverride] = useState<number | null>(null);
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);

  // Official Duty Travel (ไปราชการ) specific states
  const [destination, setDestination] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [transportType, setTransportType] = useState<string>('รถยนต์ส่วนกลาง');
  const [withBudget, setWithBudget] = useState<boolean>(true);
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [fundingSource, setFundingSource] = useState<string>('');
  const [companionNames, setCompanionNames] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        // Pre-fill with existing record data
        const matchedEmp = employees.find(e => e.id === editingRecord.employeeId || e.name === editingRecord.employeeName);
        setEmployeeId(matchedEmp ? matchedEmp.id : (editingRecord.employeeId || (employees[0]?.id ?? '')));
        setLeaveType(editingRecord.leaveType);
        setStartDate(editingRecord.startDate);
        setEndDate(editingRecord.endDate);
        setStatus(editingRecord.status);
        setReason(editingRecord.reason || '');
        setManualDaysOverride(editingRecord.totalDays ?? null);
        
        setDestination(editingRecord.destination || '');
        setOrderNumber(editingRecord.orderNumber || '');
        setTransportType(editingRecord.transportType || 'รถยนต์ส่วนกลาง');
        setWithBudget(editingRecord.withBudget !== undefined ? editingRecord.withBudget : true);
        setBudgetAmount(editingRecord.budgetAmount ? String(editingRecord.budgetAmount) : '');
        setFundingSource(editingRecord.fundingSource || '');
        setCompanionNames(editingRecord.companionNames || '');
      } else {
        // Reset for new record
        if (employees.length > 0) {
          if (!employeeId || !employees.some(e => e.id === employeeId)) {
            setEmployeeId(employees[0].id);
          }
        }
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setLeaveType('ลาพักผ่อน');
        setStatus('อนุมัติ');
        setReason('');
        setManualDaysOverride(null);
        setDestination('');
        setOrderNumber('');
        setTransportType('รถยนต์ส่วนกลาง');
        setWithBudget(true);
        setBudgetAmount('');
        setFundingSource('');
        setCompanionNames('');
      }
    }
  }, [isOpen, editingRecord, employees]);

  // คำนวณวันทำการและวันหยุดตามระเบียบวันหยุดราชการไทย
  const leaveCalculation = useMemo(() => {
    const sDate = startDate || new Date().toISOString().split('T')[0];
    const eDate = endDate || sDate;
    return calculateLeaveBreakdown(sDate, eDate, leaveType);
  }, [startDate, endDate, leaveType]);

  // ซิงค์โหมดการนับวันตามประเภทการลาตามระเบียบราชการ
  useEffect(() => {
    if (leaveType === 'ลาคลอดบุตร' || leaveType === 'ลาอุปสมบท') {
      setCountMode('calendar_days');
    } else {
      setCountMode('working_days');
    }
  }, [leaveType]);

  if (!isOpen) return null;

  const currentTotalDays = manualDaysOverride !== null 
    ? manualDaysOverride 
    : (countMode === 'working_days' ? leaveCalculation.workingDays : leaveCalculation.totalCalendarDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find target employee with fallback to first employee if needed
    let selectedEmp = employees.find(e => e.id === employeeId);
    if (!selectedEmp && employees.length > 0) {
      selectedEmp = employees[0];
    }

    if (!selectedEmp) {
      alert('กรุณาเพิ่มบุคลากรก่อนทำการบันทึกใบลา');
      return;
    }

    const currentStartDate = startDate || new Date().toISOString().split('T')[0];
    const currentEndDate = endDate || currentStartDate;

    const finalTotalDays = Math.max(1, currentTotalDays);
    const todayStr = new Date().toISOString().split('T')[0];

    const defaultReason = leaveType === 'ไปราชการ'
      ? (reason.trim() || 'เดินทางไปปฏิบัติราชการตามที่ได้รับมอบหมาย')
      : (leaveType === 'ลาพักผ่อน' ? 'พักผ่อนประจำปี' : 'กิจธุระส่วนตัว');

    if (editingRecord) {
      // Update existing record
      const updatedRecord: LeaveRecord = {
        ...editingRecord,
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        department: selectedEmp.department,
        leaveType,
        startDate: currentStartDate,
        endDate: currentEndDate,
        totalDays: finalTotalDays,
        reason: reason.trim() || defaultReason,
        status: status,
        approvedBy: status === 'อนุมัติ' ? (editingRecord.approvedBy || 'นายวินัย พนาขวา (นายกเทศมนตรีตำบลทุ่งช้าง)') : undefined,
        // Official Travel data
        destination: leaveType === 'ไปราชการ' ? destination.trim() || 'ศาลากลางจังหวัดน่าน' : undefined,
        orderNumber: leaveType === 'ไปราชการ' ? orderNumber.trim() || undefined : undefined,
        transportType: leaveType === 'ไปราชการ' ? transportType : undefined,
        withBudget: leaveType === 'ไปราชการ' ? withBudget : undefined,
        budgetAmount: (leaveType === 'ไปราชการ' && withBudget && budgetAmount) ? parseFloat(budgetAmount) : undefined,
        fundingSource: leaveType === 'ไปราชการ' ? fundingSource.trim() || undefined : undefined,
        companionNames: leaveType === 'ไปราชการ' ? companionNames.trim() || undefined : undefined,
      };

      onSubmit(updatedRecord);
    } else {
      // Create new record
      const newRecord: LeaveRecord = {
        id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        department: selectedEmp.department,
        leaveType,
        startDate: currentStartDate,
        endDate: currentEndDate,
        totalDays: finalTotalDays,
        reason: reason.trim() || defaultReason,
        status: status,
        createdAt: todayStr,
        approvedBy: status === 'อนุมัติ' ? 'นายวินัย พนาขวา (นายกเทศมนตรีตำบลทุ่งช้าง)' : undefined,
        // Official Travel data
        destination: leaveType === 'ไปราชการ' ? destination.trim() || 'ศาลากลางจังหวัดน่าน' : undefined,
        orderNumber: leaveType === 'ไปราชการ' ? orderNumber.trim() || undefined : undefined,
        transportType: leaveType === 'ไปราชการ' ? transportType : undefined,
        withBudget: leaveType === 'ไปราชการ' ? withBudget : undefined,
        budgetAmount: (leaveType === 'ไปราชการ' && withBudget && budgetAmount) ? parseFloat(budgetAmount) : undefined,
        fundingSource: leaveType === 'ไปราชการ' ? fundingSource.trim() || undefined : undefined,
        companionNames: leaveType === 'ไปราชการ' ? companionNames.trim() || undefined : undefined,
      };

      onSubmit(newRecord);
    }

    onClose();
  };

  const isOfficialDuty = leaveType === 'ไปราชการ';

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200/80 max-h-[94vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-none duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${
              editingRecord
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                : isOfficialDuty 
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            }`}>
              {editingRecord ? (
                <Edit3 className="w-5 h-5" />
              ) : isOfficialDuty ? (
                <Briefcase className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingRecord 
                  ? (isOfficialDuty ? 'แก้ไขข้อมูลการไปราชการ / ฝึกอบรม' : 'แก้ไขรายละเอียดวันลา')
                  : (isOfficialDuty ? 'บันทึกข้อมูลการไปราชการ / ฝึกอบรม' : 'บันทึกคำขอลาหยุดราชการ')}
                {editingRecord && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                    โหมดแก้ไข
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {editingRecord 
                  ? `แก้ไขรายละเอียดใบลา #${editingRecord.id} ของ ${editingRecord.employeeName}`
                  : (isOfficialDuty ? 'ขออนุมัติเดินทางไปราชการ ปฏิบัติงานนอกสถานที่ และเบิกจ่ายค่าใช้จ่าย' : 'บันทึกวันลาและตรวจสอบสถิติวันลาตามระเบียบราชการ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!editingRecord && onOpenAIModal && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl flex items-center justify-between shadow-sm border border-slate-800">
            <div className="flex items-center space-x-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
              <span className="text-slate-200">มีไฟล์ PDF คำสั่ง/ใบลา? ให้ AI สแกนและกรอกข้อมูลให้อัตโนมัติ</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAIModal();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              สแกนด้วย AI
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Employee Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">ชื่อพนักงาน / บุคลากร *</label>
              {onOpenAddEmployeeModal && (
                <button
                  type="button"
                  onClick={onOpenAddEmployeeModal}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มบุคลากรใหม่</span>
                </button>
              )}
            </div>
            <select
              value={employeeId || (employees[0]?.id ?? '')}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            >
              {employees.length === 0 && (
                <option value="">-- ยังไม่มีรายชื่อบุคลากร (กรุณาเพิ่มบุคลากรก่อน) --</option>
              )}
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position} - {emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ประเภทการปฏิบัติงาน / วันลา</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              >
                <option value="ลาพักผ่อน">🌴 ลาพักผ่อนประจำปี (นับเฉพาะวันทำการ)</option>
                <option value="ไปราชการ">💼 ไปราชการ / อบรม / สัมมนา / ภารกิจนอกสถานที่</option>
                <option value="ลาป่วย">🏥 ลาป่วย</option>
                <option value="ลากิจส่วนตัว">📋 ลากิจส่วนตัว</option>
                <option value="ลาคลอดบุตร">👶 ลาคลอดบุตร (นับรวมวันหยุด)</option>
                <option value="ลาอุปสมบท">🙏 ลาอุปสมบท (นับรวมวันหยุด)</option>
                <option value="อื่นๆ">📌 อื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">สถานะการอนุมัติ</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeaveStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              >
                <option value="อนุมัติ">✅ อนุมัติแล้ว (มีผลทันที)</option>
                <option value="รออนุมัติ">⏳ รออนุมัติ (อยู่ระหว่างเสนอผู้บริหาร)</option>
                <option value="ไม่อนุมัติ">❌ ไม่อนุมัติ</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setManualDaysOverride(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ถึงวันที่</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setManualDaysOverride(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Official Duty (ไปราชการ) Special Section */}
          {isOfficialDuty && (
            <div className="p-4.5 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-violet-50/70 border border-indigo-200/80 rounded-2xl space-y-3.5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm border-b border-indigo-100 pb-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>รายละเอียดการเดินทางไปราชการ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>สถานที่ไปราชการ / จังหวัด *</span>
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="เช่น ศาลากลางจังหวัดน่าน, อบรม ณ โรงแรมดิเอ็มเพรส เชียงใหม่"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required={isOfficialDuty}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เลขที่คำสั่ง / หนังสือขออนุมัติ</span>
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="เช่น คำสั่งเทศบาลตำบลทุ่งช้าง ที่ 123/2569"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Car className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ยานพาหนะเดินทาง</span>
                  </label>
                  <select
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="รถยนต์ส่วนกลาง">รถยนต์ส่วนกลางเทศบาล</option>
                    <option value="รถยนต์ส่วนบุคคล">รถยนต์ส่วนบุคคล (ขออนุมัติใช้)</option>
                    <option value="รถโดยสารประจำทาง">รถโดยสารประจำทาง</option>
                    <option value="เครื่องบิน">เครื่องบินโดยสาร</option>
                    <option value="รถไฟ">รถไฟ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ผู้ร่วมเดินทาง (ถ้ามี)</span>
                  </label>
                  <input
                    type="text"
                    value={companionNames}
                    onChange={(e) => setCompanionNames(e.target.value)}
                    placeholder="ระบุรายชื่อผู้ร่วมเดินทาง เช่น นายวิชัย, นางสาวสมหญิง..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Budget Request options */}
              <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>การเบิกจ่ายงบประมาณค่าใช้จ่ายในการเดินทาง</span>
                  </span>
                  <div className="flex items-center space-x-3 text-xs">
                    <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={withBudget === true}
                        onChange={() => setWithBudget(true)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">ขอเบิกงบประมาณ</span>
                    </label>
                    <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={withBudget === false}
                        onChange={() => setWithBudget(false)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-600">ไม่ขอเบิกงบประมาณ</span>
                    </label>
                  </div>
                </div>

                {withBudget && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        งบประมาณประมาณการ (บาท)
                      </label>
                      <input
                        type="number"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        placeholder="เช่น 2500"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        แหล่งงบประมาณ / โครงการ
                      </label>
                      <input
                        type="text"
                        value={fundingSource}
                        onChange={(e) => setFundingSource(e.target.value)}
                        placeholder="เช่น งบประมาณโครงการพัฒนาบุคลากร"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thai Holidays & Working Days Calculation Breakdown Card */}
          <div className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  ผลการคำนวณวันทำการและวันหยุดราชการไทย
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHolidaysModalOpen(true)}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
              >
                ดูปฏิทินวันหยุดราชการ
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`p-2.5 rounded-xl border transition-all ${
                countMode === 'working_days' 
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="text-lg font-black text-emerald-700">{leaveCalculation.workingDays}</div>
                <div className="text-[10px] font-bold text-slate-600">วันทำการจริง</div>
              </div>

              <div className="p-2.5 rounded-xl border bg-white border-slate-200">
                <div className="text-lg font-black text-rose-600">{leaveCalculation.nonWorkingDaysCount}</div>
                <div className="text-[10px] font-bold text-slate-600">
                  วันหยุด ({leaveCalculation.officialHolidaysCount} นขัตฤกษ์ / {leaveCalculation.weekendDays} ส-อา)
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border transition-all ${
                countMode === 'calendar_days' 
                  ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="text-lg font-black text-slate-800">{leaveCalculation.totalCalendarDays}</div>
                <div className="text-[10px] font-bold text-slate-600">วันปฏิทินรวม</div>
              </div>
            </div>

            {/* Holidays identified in range */}
            {leaveCalculation.holidaysList.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>พบวันหยุดราชการในช่วงนี้ ({leaveCalculation.holidaysList.length} วัน):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 text-[11px]">
                  {leaveCalculation.holidaysList.map((h, i) => (
                    <li key={i}>
                      <span className="font-semibold">{h.dayThai}</span>: {h.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mode toggle and rule note */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-medium text-[11px]">เกณฑ์การนับ:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCountMode('working_days');
                    setManualDaysOverride(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    countMode === 'working_days'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  วันทำการ (ราชการ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountMode('calendar_days');
                    setManualDaysOverride(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    countMode === 'calendar_days'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  วันปฏิทินทั้งหมด
                </button>
              </div>

              <div className="flex items-center space-x-1 text-slate-800 font-bold text-sm">
                <span>สรุปจำนวนวัน:</span>
                <span className="text-emerald-700 text-base">{currentTotalDays} วัน</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic flex items-center space-x-1">
              <Info className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {isOfficialDuty 
                  ? 'การไปราชการนับตามระยะเวลาเดินทางจริงตามคำสั่งหรือหนังสือขออนุมัติ' 
                  : leaveCalculation.regulationRuleText}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isOfficialDuty ? 'เรื่อง / วัตถุประสงค์ในการไปราชการ *' : 'เหตุผลความจำเป็นในการลา'}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isOfficialDuty 
                  ? 'เช่น เข้าร่วมการประชุมวิชาการเพื่อพัฒนาศักยภาพผู้ปฏิบัติงาน หรือ ตรวจสอบสถานที่จริง...' 
                  : 'ระบุเหตุผลการลา (ถ้ามี) เช่น พักผ่อนประจำปี, ป่วยมีใบรับรองแพทย์...'
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
              required={isOfficialDuty}
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95 ${
                editingRecord
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/20'
                  : isOfficialDuty
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-950/20'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {editingRecord 
                  ? `บันทึกการแก้ไข (${currentTotalDays} วัน)`
                  : isOfficialDuty 
                  ? `บันทึกข้อมูลไปราชการ (${currentTotalDays} วัน)` 
                  : `บันทึกคำขอลา (${currentTotalDays} วัน)`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Thai Public Holidays Reference Modal */}
      {isHolidaysModalOpen && (
        <ThaiHolidaysModal
          isOpen={isHolidaysModalOpen}
          onClose={() => setIsHolidaysModalOpen(false)}
          initialYear={startDate ? parseInt(startDate.split('-')[0]) : 2026}
        />
      )}
    </div>
  );
};



