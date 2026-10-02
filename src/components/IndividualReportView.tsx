import React, { useState, useRef } from 'react';
import { Employee, LeaveRecord } from '../types';
import { OfficialLeaveFormModal } from './OfficialLeaveFormModal';
import { 
  UserCheck, 
  Search, 
  Calendar, 
  Building2, 
  Phone, 
  Printer, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileDown, 
  User,
  Loader2,
  FileText,
  ShieldCheck,
  Award
} from 'lucide-react';
import { exportElementToPDF } from '../utils/pdfExport';
import { exportAllLeaveRecordsToExcel } from '../utils/excelExport';
import { sortEmployeesByCareerTrack, getEmployeeCareerTrack } from '../utils/employeeRanking';
import { FileSpreadsheet } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

interface IndividualReportViewProps {
  employees: Employee[];
  leaveRecords: LeaveRecord[];
}

export const IndividualReportView: React.FC<IndividualReportViewProps> = ({
  employees,
  leaveRecords,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2569');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFormRecord, setSelectedFormRecord] = useState<LeaveRecord | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  const reportAreaRef = useRef<HTMLDivElement>(null);

  const months = [
    { value: 'ALL', label: 'ทุกเดือนในรอบปีงบประมาณ' },
    { value: '10', label: 'ตุลาคม (ปีงบประมาณก่อนหน้า)' },
    { value: '11', label: 'พฤศจิกายน (ปีงบประมาณก่อนหน้า)' },
    { value: '12', label: 'ธันวาคม (ปีงบประมาณก่อนหน้า)' },
    { value: '01', label: 'มกราคม' },
    { value: '02', label: 'กุมภาพันธ์' },
    { value: '03', label: 'มีนาคม' },
    { value: '04', label: 'เมษายน' },
    { value: '05', label: 'พฤษภาคม' },
    { value: '06', label: 'มิถุนายน' },
    { value: '07', label: 'กรกฎาคม' },
    { value: '08', label: 'สิงหาคม' },
    { value: '09', label: 'กันยายน' },
  ];

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Filter leave records for this employee
  const employeeRecords = leaveRecords.filter(record => {
    if (record.employeeId !== selectedEmployeeId) return false;

    // Filter by month if specified
    if (selectedMonth !== 'ALL') {
      const recordMonth = record.startDate.split('-')[1];
      if (recordMonth !== selectedMonth) return false;
    }

    // Fiscal year check (Thai fiscal year Oct 1 - Sep 30)
    const [yearStr, monthStr] = record.startDate.split('-');
    const y = parseInt(yearStr);
    const m = parseInt(monthStr);
    let recordFiscalYear = y + 543;
    if (m >= 10) {
      recordFiscalYear = y + 544;
    }
    if (selectedFiscalYear !== 'ALL' && recordFiscalYear.toString() !== selectedFiscalYear) {
      return false;
    }

    return true;
  });

  // Calculate annual fiscal year records (independent of month filter for accurate annual quota calculation)
  const annualFiscalYearRecords = leaveRecords.filter(record => {
    if (record.employeeId !== selectedEmployeeId) return false;
    const [yearStr, monthStr] = record.startDate.split('-');
    const y = parseInt(yearStr);
    const m = parseInt(monthStr);
    let recordFiscalYear = y + 543;
    if (m >= 10) {
      recordFiscalYear = y + 544;
    }
    if (selectedFiscalYear !== 'ALL' && recordFiscalYear.toString() !== selectedFiscalYear) {
      return false;
    }
    return true;
  });

  // Vacation leave entitlement calculations for Table 1
  const accumulatedVacationDays = Number(selectedEmployee?.accumulatedLeaveDays ?? 0);
  const yearlyVacationQuota = Number(selectedEmployee?.leaveQuotas?.vacation ?? 10);
  const totalVacationRights = accumulatedVacationDays + yearlyVacationQuota;
  
  // Total vacation days used in the fiscal year (อนุมัติ / ยื่นลาพักผ่อน)
  const currentVacationDaysUsed = annualFiscalYearRecords
    .filter(r => r.leaveType === 'ลาพักผ่อน' && r.status !== 'ไม่อนุมัติ')
    .reduce((sum, r) => sum + (Number(r.totalDays) || 0), 0);

  // Remaining vacation days: วันลาสะสมรวม ลบด้วย วันลาในการลาครั้งปัจจุบัน/ใช้ไป
  const remainingVacationDays = Math.max(0, totalVacationRights - currentVacationDaysUsed);

  // Calculate totals by leave type for the displayed records
  const summaryByType = employeeRecords.reduce((acc, curr) => {
    if (curr.status === 'อนุมัติ') {
      acc[curr.leaveType] = (acc[curr.leaveType] || 0) + curr.totalDays;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalLeaveDaysTaken = Object.values(summaryByType).reduce((a, b) => a + b, 0);

  const filteredEmployeesList = sortEmployeesByCareerTrack(
    employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEmployeeCareerTrack(e).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Format Thai Buddhist Date
  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const day = d.getDate();
      const month = shortMonths[d.getMonth()];
      const year = d.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatThaiDateFull = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        const fullMonths = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        const thaiYear = y < 2500 ? y + 543 : y;
        return `${d} ${fullMonths[m - 1] || ''} ${thaiYear}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportAreaRef.current || !selectedEmployee) return;
    setIsGeneratingPDF(true);
    try {
      const sanitizedName = selectedEmployee.name.replace(/\s+/g, '_');
      const filename = `รายงานประวัติการลา_${sanitizedName}_ปีงบประมาณ_${selectedFiscalYear}.pdf`;
      await exportElementToPDF(reportAreaRef.current, {
        filename,
        orientation: 'portrait',
        scale: 2,
      });
    } catch (err) {
      console.error('Error generating report PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Global Action Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-emerald-800 text-white rounded-2xl flex items-center justify-center shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">รายงานประวัติการลาประจำตัวบุคคลตามแบบราชการ</h2>
            <p className="text-xs text-slate-500">
              แบบประวัติการลาของพนักงานเทศบาล เทศบาลตำบลทุ่งช้าง ประจำปีงบประมาณ พ.ศ. {selectedFiscalYear}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => exportAllLeaveRecordsToExcel(employeeRecords, employees)}
            disabled={!selectedEmployee || employeeRecords.length === 0}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer active:scale-95"
            title="ส่งออกประวัติการลาของบุคคลนี้เป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel ({employeeRecords.length} รายการ)</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || !selectedEmployee}
            className="bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer active:scale-95"
            title="ดาวน์โหลดรายงานประวัติการลาเป็นไฟล์ PDF มาตรฐานราชการ"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังสร้าง PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>ดาวน์โหลดเป็นไฟล์ PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            title="สั่งพิมพ์รายงานประวัติการลา A4"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน (A4)</span>
          </button>
        </div>
      </div>

      {/* Control Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">ค้นหาบุคลากร</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ตำแหน่ง หรือกอง/สำนัก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">เลือกบุคลากร (เรียงตาม 7 สายงานราชการ)</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {filteredEmployeesList.map(emp => {
              const track = getEmployeeCareerTrack(emp);
              return (
                <option key={emp.id} value={emp.id}>
                  [{track}] {emp.name} ({emp.department} - {emp.position})
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">รอบเดือน</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ปีงบประมาณ</label>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="2569">พ.ศ. 2569</option>
              <option value="2568">พ.ศ. 2568</option>
              <option value="ALL">ทุกปีงบประมาณ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Government Leave History Form (Standard A4 Format) */}
      {selectedEmployee ? (
        <div 
          ref={reportAreaRef}
          id="printable-individual-leave-ledger"
          className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-300 text-black max-w-[210mm] mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full select-text font-sarabun-it9 thai-gov-doc space-y-5 box-border"
          style={{
            fontFamily: "'TH Sarabun IT9', 'TH Sarabun IT๙', 'THSarabunIT9', 'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'THSarabunPSK', 'Sarabun', serif, sans-serif",
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#000000'
          }}
        >
          {/* Heading */}
          <div className="text-center space-y-0.5 pt-1">
            <div className="flex justify-center mb-1.5">
              <img 
                src={logoImg} 
                alt="ตราเทศบาลตำบลทุ่งช้าง" 
                className="w-16 h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-black">
              แบบประวัติการลาของพนักงานเทศบาลและลูกจ้าง
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-black">
              เทศบาลตำบลทุ่งช้าง อำเภอทุ่งช้าง จังหวัดน่าน
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-black">
              ประจำปีงบประมาณ พ.ศ. {selectedFiscalYear} (๑ ตุลาคม {parseInt(selectedFiscalYear) - 1 || 2568} – ๓๐ กันยายน {selectedFiscalYear})
            </p>
          </div>

          {/* Section 1: ข้อมูลประวัติบุคลากร (Personnel Information) */}
          <div className="border border-black p-3 sm:p-3.5 rounded-lg bg-slate-50/30 print:bg-transparent">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs sm:text-sm">
              <div>
                <span className="font-bold">ชื่อ - นามสกุล: </span>
                <span className="underline decoration-dotted underline-offset-4 font-semibold px-1">{selectedEmployee.name}</span>
              </div>
              <div>
                <span className="font-bold">ตำแหน่ง: </span>
                <span className="underline decoration-dotted underline-offset-4 px-1">{selectedEmployee.position}</span>
              </div>
              <div>
                <span className="font-bold">สังกัด: </span>
                <span className="underline decoration-dotted underline-offset-4 px-1">{selectedEmployee.department}</span>
                {' '}เทศบาลตำบลทุ่งช้าง
              </div>
              <div>
                <span className="font-bold">ประเภทบุคลากร: </span>
                <span className="underline decoration-dotted underline-offset-4 px-1">{selectedEmployee.personnelType || 'พนักงานเทศบาล'}</span>
              </div>
              <div>
                <span className="font-bold">วันที่บรรจุ / เริ่มปฏิบัติงาน: </span>
                <span className="underline decoration-dotted underline-offset-4 px-1">
                  {selectedEmployee.startDate ? formatThaiDateFull(selectedEmployee.startDate) : '-'}
                </span>
              </div>
              <div>
                <span className="font-bold">หมายเลขโทรศัพท์: </span>
                <span className="underline decoration-dotted underline-offset-4 px-1">{selectedEmployee.phone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: ตารางสรุปสิทธิวันลาพักผ่อนประจำปีงบประมาณ (Vacation Leave Entitlement Table) */}
          <div className="space-y-1">
            <h3 className="font-bold text-xs sm:text-sm text-black">
              ๑. สิทธิวันลาพักผ่อนประจำปีงบประมาณ พ.ศ. {selectedFiscalYear}
            </h3>
            <table className="w-full table-fixed text-center border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100/80 print:bg-transparent font-bold">
                  <th className="border border-black p-1.5 w-[20%]">วันลาพักผ่อนสะสมยกมาจากปีก่อน<br/>(วันทำการ)</th>
                  <th className="border border-black p-1.5 w-[20%]">สิทธิวันลาพักผ่อนประจำปีนี้<br/>(วันทำการ)</th>
                  <th className="border border-black p-1.5 w-[20%]">รวมสิทธิวันลาพักผ่อนทั้งสิ้น<br/>(วันทำการ)</th>
                  <th className="border border-black p-1.5 w-[20%]">วันลาในการลาครั้งปัจจุบัน / ใช้ไปแล้ว<br/>(วันทำการ)</th>
                  <th className="border border-black p-1.5 w-[20%] bg-emerald-50/50 print:bg-transparent">คงเหลือยกไป<br/>(วันทำการ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 font-semibold">
                    {accumulatedVacationDays}
                  </td>
                  <td className="border border-black p-1.5 font-semibold">
                    {yearlyVacationQuota}
                  </td>
                  <td className="border border-black p-1.5 font-bold text-xs sm:text-sm">
                    {totalVacationRights}
                  </td>
                  <td className="border border-black p-1.5 font-bold text-teal-900">
                    {currentVacationDaysUsed}
                  </td>
                  <td className="border border-black p-1.5 font-bold text-xs sm:text-sm text-emerald-950 bg-emerald-50/30 print:bg-transparent">
                    {remainingVacationDays}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: บัญชีลงเวลาและประวัติการลา (Official Leave History Ledger Table) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-black">
                ๒. บัญชีรายการขอลาและประวัติการลาตามระเบียบราชการ ({employeeRecords.length} รายการ)
              </h3>
              <span className="text-[11px] text-slate-500 print:hidden pdf-exclude">
                * คลิกที่รายการเพื่อดูแบบใบลาต้นฉบับ
              </span>
            </div>

            {employeeRecords.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-black rounded-lg text-slate-700 text-xs sm:text-sm">
                - ไม่พบประวัติการลาในเงื่อนไขเวลาที่กำหนด -
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full table-fixed text-left border-collapse border border-black text-[11px] leading-snug">
                  <thead>
                    <tr className="bg-slate-100/80 print:bg-transparent font-bold text-center">
                      <th className="border border-black p-1 w-[4%]">ที่</th>
                      <th className="border border-black p-1 w-[10%]">วันเขียนใบลา</th>
                      <th className="border border-black p-1 w-[10%]">ประเภทการลา</th>
                      <th className="border border-black p-1 w-[11%]">ตั้งแต่วันที่</th>
                      <th className="border border-black p-1 w-[11%]">ถึงวันที่</th>
                      <th className="border border-black p-1 w-[6%]">จำนวน (วัน)</th>
                      <th className="border border-black p-1 w-[24%]">เหตุผลความจำเป็น / สถานที่ไปราชการ</th>
                      <th className="border border-black p-1 w-[8%]">ผู้ขอลา</th>
                      <th className="border border-black p-1 w-[8%]">ความเห็น</th>
                      <th className="border border-black p-1 w-[8%]">คำสั่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeRecords.map((record, index) => (
                      <tr 
                        key={record.id} 
                        onClick={() => setSelectedFormRecord(record)}
                        className="hover:bg-emerald-50/50 print:hover:bg-transparent cursor-pointer transition-colors"
                        title="คลิกเพื่อเปิดดูแบบใบลาฉบับทางการ"
                      >
                        <td className="border border-black p-1 text-center font-bold">{index + 1}</td>
                        <td className="border border-black p-1 text-center">
                          {formatThaiDate(record.createdAt || record.startDate)}
                        </td>
                        <td className="border border-black p-1 text-center font-bold">
                          {record.leaveType}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {formatThaiDate(record.startDate)}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {formatThaiDate(record.endDate)}
                        </td>
                        <td className="border border-black p-1 text-center font-bold text-emerald-950">
                          {record.totalDays}
                        </td>
                        <td className="border border-black p-1 break-words">
                          {record.leaveType === 'ไปราชการ' && record.destination ? (
                            <span>{record.reason} ({record.destination})</span>
                          ) : (
                            <span>{record.reason || '-'}</span>
                          )}
                          <span className="inline-block ml-1 text-[9px] text-emerald-700 underline font-semibold print:hidden pdf-exclude">[ดูใบลา]</span>
                        </td>
                        <td className="border border-black p-1 text-center font-serif text-[10px]">
                          {selectedEmployee.name.split(' ')[0]}
                        </td>
                        <td className="border border-black p-1 text-center text-[10px] font-semibold text-emerald-950">
                          เห็นควรอนุญาต
                        </td>
                        <td className="border border-black p-1 text-center text-[10px] font-bold">
                          {record.status === 'อนุมัติ' ? '✓ อนุญาต' : (record.status === 'ไม่อนุมัติ' ? '✗ ไม่อนุมัติ' : 'รอสั่งการ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: ตารางสรุปสถิติวันลาสะสมในรอบปีงบประมาณ (Annual Leave Summary Matrix) */}
          <div className="space-y-1">
            <h3 className="font-bold text-xs sm:text-sm text-black">
              ๓. สรุปสถิติการลาในรอบปีงบประมาณ พ.ศ. {selectedFiscalYear}
            </h3>
            <table className="w-full table-fixed text-center border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100/80 print:bg-transparent font-bold">
                  <th className="border border-black p-1 w-[16%]">ลาป่วย<br/>(วันทำการ)</th>
                  <th className="border border-black p-1 w-[16%]">ลากิจส่วนตัว<br/>(วันทำการ)</th>
                  <th className="border border-black p-1 w-[16%]">ลาพักผ่อน<br/>(วันทำการ)</th>
                  <th className="border border-black p-1 w-[18%]">ลาคลอดบุตร/อื่นๆ<br/>(วัน)</th>
                  <th className="border border-black p-1 w-[16%]">ไปราชการ<br/>(วันทำการ)</th>
                  <th className="border border-black p-1 w-[18%] bg-slate-200/60 print:bg-transparent">รวมวันลาทั้งสิ้น<br/>(วัน)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-xs sm:text-sm">
                  <td className="border border-black p-1.5">{summaryByType['ลาป่วย'] || 0}</td>
                  <td className="border border-black p-1.5">{summaryByType['ลากิจส่วนตัว'] || 0}</td>
                  <td className="border border-black p-1.5">{summaryByType['ลาพักผ่อน'] || 0}</td>
                  <td className="border border-black p-1.5">
                    {(summaryByType['ลาคลอดบุตร'] || 0) + (summaryByType['ลาอุปสมบท'] || 0) + (summaryByType['ลาศึกษาต่อ'] || 0)}
                  </td>
                  <td className="border border-black p-1.5">{summaryByType['ไปราชการ'] || 0}</td>
                  <td className="border border-black p-1.5 bg-slate-100/60 print:bg-transparent text-emerald-950">
                    {totalLeaveDaysTaken}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: ส่วนลงนามรับรองความถูกต้องของทะเบียนประวัติการลาตามระเบียบสารบรรณ */}
          <div className="pt-4 border-t border-black space-y-4">
            <p className="text-center font-bold text-xs">
              ขอรับรองว่ารายการประวัติการลาและสถิติวันลาที่ปรากฏข้างต้น ถูกต้องตรงตามหลักฐานและแบบใบลาของทางราชการทุกประการ
            </p>

            <div className="grid grid-cols-2 gap-6 text-center text-xs">
              {/* Left Endorsement: HR / Records Officer */}
              <div className="space-y-0.5">
                <p>ลงชื่อ ................................................................ ผู้บันทึกและตรวจประวัติ</p>
                <p className="font-bold">( นางสาวสุพรรณี มีสา )</p>
                <p className="text-slate-800 text-[11px]">นักทรัพยากรบุคคลชำนาญการ</p>
                <p className="text-slate-700 text-[11px]">วันที่ ........ เดือน .................... พ.ศ. ............</p>
              </div>

              {/* Right Endorsement: Head of Municipal Clerk Office / Deputy Clerk */}
              <div className="space-y-0.5">
                <p>ลงชื่อ ................................................................ ผู้บังคับบัญชา / ผู้รับรอง</p>
                <p className="font-bold">( นางสาวติยาภา สัจจา )</p>
                <p className="text-slate-800 text-[11px]">หัวหน้าสำนักปลัดเทศบาล รักษาราชการแทน</p>
                <p className="text-slate-800 text-[11px]">ปลัดเทศบาลตำบลทุ่งช้าง</p>
                <p className="text-slate-700 text-[11px]">วันที่ ........ เดือน .................... พ.ศ. ............</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80">
          กรุณาเลือกบุคลากรเพื่อดูรายงานประวัติการลา
        </div>
      )}

      {/* Official Leave Document Preview & Direct PDF Download Modal */}
      {selectedFormRecord && (
        <OfficialLeaveFormModal
          isOpen={!!selectedFormRecord}
          onClose={() => setSelectedFormRecord(null)}
          leaveData={selectedFormRecord}
          employee={employees.find(e => e.id === selectedFormRecord.employeeId)}
          allLeaveRecords={leaveRecords}
          originalFileUrl={selectedFormRecord.attachmentUrl}
          originalFileName={selectedFormRecord.attachmentName}
        />
      )}
    </div>
  );
};
