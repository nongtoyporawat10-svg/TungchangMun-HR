import React, { useState } from 'react';
import { LeaveRecord, Employee, Department, LeaveType } from '../types';
import { 
  exportAllLeaveRecordsToExcel, 
  exportAllLeaveRecordsToCSV, 
  exportCompleteSystemBackupJSON,
  formatThaiDate 
} from '../utils/excelExport';
import { 
  FileSpreadsheet, 
  FileText, 
  Database, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  Filter,
  Sparkles,
  Info,
  Archive
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRecords: LeaveRecord[];
  filteredRecords?: LeaveRecord[];
  employees: Employee[];
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  leaveRecords,
  filteredRecords,
  employees,
}) => {
  const { theme } = useTheme();
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [dataScope, setDataScope] = useState<'all' | 'filtered'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const targetRecords = dataScope === 'filtered' && filteredRecords ? filteredRecords : leaveRecords;

  const handleExport = () => {
    setIsExporting(true);
    setSuccessMessage('');

    setTimeout(() => {
      let success = false;
      if (exportFormat === 'xlsx') {
        success = exportAllLeaveRecordsToExcel(targetRecords, employees);
      } else if (exportFormat === 'csv') {
        success = exportAllLeaveRecordsToCSV(targetRecords, employees);
      } else if (exportFormat === 'json') {
        success = exportCompleteSystemBackupJSON(targetRecords, employees);
      }

      setIsExporting(false);
      if (success) {
        setSuccessMessage(`ส่งออกไฟล์ ${exportFormat.toUpperCase()} สำเร็จแล้ว! บันทึกลงในเครื่องของคุณเรียบร้อย`);
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 2200);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ส่งออกข้อมูลวันลา & สำรองข้อมูล (Backup)</h3>
              <p className="text-xs text-slate-300">ดาวน์โหลดข้อมูลลงในคอมพิวเตอร์ในรูปแบบ Excel, CSV หรือ JSON</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Notification / Success */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{successMessage}</span>
            </div>
          )}

          {/* 1. Format Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>1. เลือกรูปแบบไฟล์ที่ต้องการส่งออก (File Format)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option: Excel (.xlsx) */}
              <div
                onClick={() => setExportFormat('xlsx')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  exportFormat === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Microsoft Excel (.xlsx)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  แนะนำสูงสุด มี 4 แผ่นงาน พร้อมตารางสรุปสถิติตามกอง และประเภทวันลา
                </p>
                {exportFormat === 'xlsx' && (
                  <span className="inline-block mt-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                    เลือกอยู่ (แนะนำ)
                  </span>
                )}
              </div>

              {/* Option: CSV (.csv) */}
              <div
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  exportFormat === 'csv'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  <span>CSV File (.csv)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ไฟล์ข้อความ UTF-8 BOM รองรับภาษาไทยสมบูรณ์ เปิดได้ทุกโปรแกรม
                </p>
                {exportFormat === 'csv' && (
                  <span className="inline-block mt-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold">
                    เลือกอยู่
                  </span>
                )}
              </div>

              {/* Option: JSON Backup */}
              <div
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  exportFormat === 'json'
                    ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm mb-1">
                  <Database className="w-4 h-4" />
                  <span>System Backup (.json)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  สำรองโครงสร้างข้อมูลระบบทั้งหมด สำหรับผู้ดูแลระบบ IT
                </p>
                {exportFormat === 'json' && (
                  <span className="inline-block mt-2 text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-md font-bold">
                    เลือกอยู่
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Scope Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>2. ขอบเขตข้อมูลที่ต้องการส่งออก (Data Scope)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer ${
                  dataScope === 'all' ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dataScope"
                    checked={dataScope === 'all'}
                    onChange={() => setDataScope('all')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">ส่งออกข้อมูลทั้งหมดในระบบ</div>
                    <div className="text-[11px] text-slate-500">ทุกกอง ทุกประเภท ทุกสถานะ</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-700 rounded-lg">
                  {leaveRecords.length} รายการ
                </span>
              </label>

              {filteredRecords && filteredRecords.length !== leaveRecords.length && (
                <label 
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer ${
                    dataScope === 'filtered' ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="dataScope"
                      checked={dataScope === 'filtered'}
                      onChange={() => setDataScope('filtered')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">ส่งออกเฉพาะข้อมูลที่กรองอยู่</div>
                      <div className="text-[11px] text-slate-500">ตามเงื่อนไขค้นหา/ตัวกรองปัจจุบัน</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
                    {filteredRecords.length} รายการ
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Data Summary Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>หน่วยงาน: <strong>เทศบาลตำบลทุ่งช้าง</strong></span>
              </span>
              <span>จำนวนบุคลากร: <strong>{employees.length} คน</strong></span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
              <span>ข้อมูลที่จะส่งออก: <strong>{targetRecords.length} รายการใบลา</strong></span>
              <span>วันที่สำรอง: <strong>{formatThaiDate(new Date().toISOString().split('T')[0])}</strong></span>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start space-x-2 text-[11px] text-slate-500">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p>
              ไฟล์จะถูกดาวน์โหลดลงในโฟลเดอร์ Downloads บนเครื่องคอมพิวเตอร์ของคุณทันที โดยมีข้อมูลครบถ้วนทั้งประวัติการลา, ผลการอนุมัติ 4 ขั้นตอน, รายละเอียดการไปราชการ และงบประมาณ
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
              exportFormat === 'xlsx'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                : exportFormat === 'csv'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/20'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting ? 'กำลังประมวลผล...' : `ดาวน์โหลดไฟล์ ${exportFormat.toUpperCase()} (${targetRecords.length} รายการ)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
