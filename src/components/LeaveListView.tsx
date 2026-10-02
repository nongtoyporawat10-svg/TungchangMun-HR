import React, { useState } from 'react';
import { LeaveRecord, Department, LeaveType, LeaveStatus, Employee, AdminUser } from '../types';
import { OfficialLeaveFormModal } from './OfficialLeaveFormModal';
import { LeaveApprovalWorkflowModal } from './LeaveApprovalWorkflowModal';
import { ExportDataModal } from './ExportDataModal';
import { 
  exportAllLeaveRecordsToExcel, 
  exportAllLeaveRecordsToCSV 
} from '../utils/excelExport';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  FileText,
  User,
  Sparkles,
  Download,
  Printer,
  FileDown,
  Edit3,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  Database,
  CheckCircle2
} from 'lucide-react';

interface LeaveListViewProps {
  leaveRecords: LeaveRecord[];
  employees?: Employee[];
  currentAdmin?: AdminUser | null;
  onOpenNewLeave: () => void;
  onOpenAILeave?: () => void;
  onUpdateStatus: (id: string, status: LeaveStatus) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteRecords?: (ids: string[]) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onEditRecord?: (record: LeaveRecord) => void;
  onSaveRecord?: (record: LeaveRecord) => void;
}

export const LeaveListView: React.FC<LeaveListViewProps> = ({
  leaveRecords,
  employees = [],
  currentAdmin = null,
  onOpenNewLeave,
  onOpenAILeave,
  onUpdateStatus,
  onDeleteRecord,
  onDeleteRecords,
  onUpdateEmployee,
  onEditRecord,
  onSaveRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecordForForm, setSelectedRecordForForm] = useState<LeaveRecord | null>(null);
  const [selectedRecordForWorkflow, setSelectedRecordForWorkflow] = useState<LeaveRecord | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string>('');

  const departments: Department[] = [
    'สำนักปลัดเทศบาล', 
    'กองคลัง', 
    'กองช่าง', 
    'กองสาธารณสุขและสิ่งแวดล้อม', 
    'กองการศึกษา', 
    'กองยุทธศาสตร์และงบประมาณ',
    'หน่วยตรวจสอบภายใน'
  ];

  const leaveTypes: LeaveType[] = [
    'ลาพักผ่อน', 
    'ลาป่วย', 
    'ลากิจส่วนตัว', 
    'ลาคลอดบุตร', 
    'ลาอุปสมบท', 
    'ไปราชการ',
    'อื่นๆ'
  ];

  const filteredRecords = leaveRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || record.department === selectedDept;
    const matchesType = selectedType === 'ALL' || record.leaveType === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || record.status === selectedStatus;

    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleQuickExportExcel = (recordsToExport = filteredRecords) => {
    const success = exportAllLeaveRecordsToExcel(recordsToExport, employees);
    if (success) {
      setExportNotice(`ดาวน์โหลดไฟล์ Excel (${recordsToExport.length} รายการ) สำเร็จแล้ว`);
      setTimeout(() => setExportNotice(''), 4000);
    }
  };

  const handleQuickExportCSV = (recordsToExport = filteredRecords) => {
    const success = exportAllLeaveRecordsToCSV(recordsToExport, employees);
    if (success) {
      setExportNotice(`ดาวน์โหลดไฟล์ CSV (${recordsToExport.length} รายการ) สำเร็จแล้ว`);
      setTimeout(() => setExportNotice(''), 4000);
    }
  };

  const handleExportSelectedExcel = () => {
    const selectedRecords = leaveRecords.filter(r => selectedIds.includes(r.id));
    if (selectedRecords.length === 0) return;
    const success = exportAllLeaveRecordsToExcel(selectedRecords, employees);
    if (success) {
      setExportNotice(`ดาวน์โหลดไฟล์ Excel ${selectedRecords.length} รายการที่เลือก สำเร็จแล้ว`);
      setTimeout(() => setExportNotice(''), 4000);
    }
  };

  const getWorkflowBadge = (record: LeaveRecord) => {
    if (record.status === 'อนุมัติ') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>อนุมัติครบ 4 ขั้น</span>
        </span>
      );
    }
    if (record.status === 'ไม่อนุมัติ') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>ไม่อนุมัติ</span>
        </span>
      );
    }
    if (!record.checkerApproved) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>1. ตรวจสถิติ (HR)</span>
        </span>
      );
    }
    if (!record.deptHeadApproved) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>2. รอ ผอ.กอง</span>
        </span>
      );
    }
    if (!record.clerkApproved) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          <span>3. รอ ปลัดฯ</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        <span>4. รอ นายกฯ</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Export Notice Toast */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
            <span>{exportNotice}</span>
          </div>
          <button 
            onClick={() => setExportNotice('')}
            className="text-emerald-100 hover:text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-lg"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Top bar / title & action */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">รายการใบลาบุคลากรทั้งหมด</h2>
          <p className="text-xs text-slate-500">จัดการ ตรวจสอบสถานะ การพิจารณาอนุมัติตามลำดับขั้น 4 ขั้นตอน และออกเอกสารทางการ</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export / Backup Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center space-x-2 cursor-pointer"
            title="ส่งออกข้อมูลวันลาทั้งหมดลงเครื่องในรูปแบบ Excel, CSV หรือ JSON สำรองข้อมูล"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออกข้อมูลสำรอง (Excel/CSV)</span>
          </button>

          {onOpenAILeave && (
            <button
              onClick={onOpenAILeave}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-950/20 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>สแกนใบลา & ตรวจลายเซ็น AI</span>
            </button>
          )}
          <button
            onClick={onOpenNewLeave}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-950/20 transition-all flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ บันทึกใบลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search text input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน หรือเหตุผลการลา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🏛️ ทุกส่วนราชการ / ทุกกอง</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">📋 ทุกประเภทการลา</option>
              {leaveTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">⚡ ทุกสถานะ</option>
              <option value="อนุมัติ">✓ อนุมัติแล้ว</option>
              <option value="รออนุมัติ">⏳ รออนุมัติ / เสนอตามลำดับขั้น</option>
              <option value="ไม่อนุมัติ">❌ ไม่อนุมัติ</option>
            </select>
          </div>
        </div>

        {/* Quick Export Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center space-x-2">
            <span>แสดง <strong>{filteredRecords.length}</strong> จากทั้งหมด <strong>{leaveRecords.length}</strong> รายการ</span>
            {filteredRecords.length !== leaveRecords.length && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                กำลังกรองข้อมูล
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">ดาวน์โหลดด่วน:</span>
            <button
              onClick={() => handleQuickExportExcel(filteredRecords)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.xlsx) ทันที"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleQuickExportCSV(filteredRecords)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ CSV (UTF-8) ทันที"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>CSV (.csv)</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title="เปิดตัวเลือกสำรองข้อมูลและส่งออกขั้นสูง"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>ตัวเลือกสำรองข้อมูล...</span>
            </button>
          </div>
        </div>

        {/* Batch action bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-bold text-rose-800">
              เลือกแล้ว {selectedIds.length} รายการ
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportSelectedExcel}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก {selectedIds.length} รายการที่เลือก (Excel)</span>
              </button>

              {onDeleteRecords && (
                <button
                  onClick={() => {
                    onDeleteRecords(selectedIds);
                    setSelectedIds([]);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ {selectedIds.length} รายการ</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. SMARTPHONE CARD LIST VIEW (hidden on sm screens) */}
      <div className="block sm:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500 border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-sm">ไม่พบรายการใบลาที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{record.employeeName}</div>
                  <div className="text-xs text-slate-500">{record.department}</div>
                </div>
                {getWorkflowBadge(record)}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">{record.leaveType}</span>
                  <span className="font-bold text-teal-700">{record.totalDays} วันทำการ</span>
                </div>
                <div className="text-slate-500 text-[11px]">{record.startDate} ถึง {record.endDate}</div>
                <div className="text-slate-600 text-xs italic truncate" title={record.reason}>
                  "{record.reason}"
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedRecordForWorkflow(record)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>พิจารณา 4 ขั้น</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedRecordForForm(record)}
                    className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold flex items-center space-x-1"
                    title="ดูแบบใบลาทางการ"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>แบบใบลา</span>
                  </button>
                  {onEditRecord && (
                    <button
                      onClick={() => onEditRecord(record)}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold"
                      title="แก้ไข"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. DESKTOP / TABLET TABLE */}
      <div className="hidden sm:block bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-semibold tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">พนักงาน / สังกัด</th>
                <th className="py-3.5 px-4">ประเภทการลา</th>
                <th className="py-3.5 px-4">ช่วงเวลา / วันทำการ</th>
                <th className="py-3.5 px-4">เหตุผลการลา</th>
                <th className="py-3.5 px-4 text-center">ลำดับขั้นการอนุมัติ</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">ไม่พบรายการใบลาที่ตรงกับเงื่อนไขการค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(record.id) ? 'bg-indigo-50/20' : ''}`}>
                    <td className="py-4 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => handleToggleSelectOne(record.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{record.employeeName}</div>
                      <div className="text-xs text-slate-500">{record.department}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl text-xs">
                        {record.leaveType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-700 text-xs">
                      <div className="font-medium text-slate-800">{record.startDate} ถึง {record.endDate}</div>
                      <div className="text-indigo-700 font-bold mt-0.5">{record.totalDays} วันทำการ</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-xs max-w-xs truncate" title={record.reason}>
                      {record.reason}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedRecordForWorkflow(record)}
                        className="inline-flex flex-col items-center hover:scale-105 transition-transform"
                        title="คลิกเพื่อเปิดหน้าพิจารณาอนุมัติตามลำดับขั้น"
                      >
                        {getWorkflowBadge(record)}
                        <span className="text-[10px] text-indigo-600 hover:underline font-bold mt-1">
                          พิจารณาอนุมัติ ❯
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedRecordForWorkflow(record)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all border border-indigo-200 flex items-center space-x-1 text-xs font-bold"
                          title="พิจารณาอนุมัติ 4 ขั้นตอน"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden xl:inline">พิจารณา</span>
                        </button>
                        <button
                          onClick={() => setSelectedRecordForForm(record)}
                          className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl transition-all border border-teal-200"
                          title="ดูแบบใบลาทางการ / พิมพ์ PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        {onEditRecord && (
                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition-all border border-amber-200"
                            title="แก้ไขรายละเอียด"
                          >
                            <Edit3 className="w-4 h-4 text-amber-700" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl transition-all"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>แสดงทั้งหมด {filteredRecords.length} รายการ</span>
          <span>ระบบควบคุมและเสนออนุมัติวันลาตามลำดับขั้น เทศบาลตำบลทุ่งช้าง</span>
        </div>
      </div>

      {/* Hierarchical Workflow Approval Modal */}
      {selectedRecordForWorkflow && (
        <LeaveApprovalWorkflowModal
          isOpen={!!selectedRecordForWorkflow}
          onClose={() => setSelectedRecordForWorkflow(null)}
          leaveRecord={selectedRecordForWorkflow}
          employee={employees.find(e => e.id === selectedRecordForWorkflow.employeeId || e.name === selectedRecordForWorkflow.employeeName)}
          allLeaveRecords={leaveRecords}
          currentAdmin={currentAdmin}
          onSaveRecord={(updatedRec) => {
            if (onSaveRecord) onSaveRecord(updatedRec);
            setSelectedRecordForWorkflow(updatedRec);
          }}
        />
      )}

      {/* Official Leave Form Modal */}
      {selectedRecordForForm && (
        <OfficialLeaveFormModal
          isOpen={!!selectedRecordForForm}
          onClose={() => setSelectedRecordForForm(null)}
          leaveData={selectedRecordForForm}
          employee={employees.find(e => e.id === selectedRecordForForm.employeeId || e.name === selectedRecordForForm.employeeName)}
          allLeaveRecords={leaveRecords}
          allEmployees={employees}
          onUpdateEmployee={onUpdateEmployee}
          onEditLeave={onEditRecord ? () => {
            const rec = selectedRecordForForm;
            setSelectedRecordForForm(null);
            onEditRecord(rec);
          } : undefined}
          originalFileUrl={selectedRecordForForm.attachmentUrl}
          originalFileName={selectedRecordForForm.attachmentName}
        />
      )}

      {/* Export and System Backup Modal */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        leaveRecords={leaveRecords}
        filteredRecords={filteredRecords}
        employees={employees}
      />
    </div>
  );
};
