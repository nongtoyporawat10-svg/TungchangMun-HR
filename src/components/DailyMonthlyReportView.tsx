import React, { useState, useMemo, useRef } from 'react';
import { LeaveRecord, Employee, Department, ORDERED_DEPARTMENTS, getDepartmentOrderIndex } from '../types';
import { 
  FileText, 
  Calendar, 
  Printer, 
  Download, 
  Filter, 
  Users, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Building2, 
  ChevronRight,
  TrendingUp,
  Percent,
  CalendarDays,
  User,
  FileDown,
  Loader2
} from 'lucide-react';
import { exportElementToPDF } from '../utils/pdfExport';
import { ExportDataModal } from './ExportDataModal';
import { FileSpreadsheet } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

interface DailyMonthlyReportViewProps {
  leaveRecords: LeaveRecord[];
  employees: Employee[];
}

export const DailyMonthlyReportView: React.FC<DailyMonthlyReportViewProps> = ({
  leaveRecords,
  employees,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'monthly' | 'fiscal-year'>('daily');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2569');
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-12');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-07'); // YYYY-MM
  const [reportDept, setReportDept] = useState<string>('ALL');
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'ALL' | 'PRESENT' | 'LEAVE'>('ALL');
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const memoPrintRef = useRef<HTMLDivElement>(null);

  const handleDownloadMemoPDF = async () => {
    if (!memoPrintRef.current) return;
    setIsGeneratingPDF(true);
    try {
      await exportElementToPDF(memoPrintRef.current, {
        filename: `รายงานสรุปการปฏิบัติราชการ_เทศบาลตำบลทุ่งช้าง_${selectedDate}.pdf`,
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

  const departments: Department[] = ORDERED_DEPARTMENTS;

  // Helper to determine fiscal year & quarter from date
  const getFiscalYearInfo = (dateStr: string) => {
    if (!dateStr) return { fiscalYear: 2569, quarter: 'Q1' };
    const [y, m] = dateStr.split('-').map(Number);
    if (m >= 10) {
      return { fiscalYear: y + 543 + 1, quarter: 'Q1' };
    } else if (m <= 3) {
      return { fiscalYear: y + 543, quarter: 'Q2' };
    } else if (m <= 6) {
      return { fiscalYear: y + 543, quarter: 'Q3' };
    } else {
      return { fiscalYear: y + 543, quarter: 'Q4' };
    }
  };

  // Month list aligned with Thai Fiscal Year (Oct - Sep)
  // For Fiscal Year 2569: Oct 2025 -> Sep 2026
  const fiscalMonths = useMemo(() => {
    const fyNum = parseInt(selectedFiscalYear) || 2569;
    const startCalYear = fyNum - 543 - 1; // 2025
    const endCalYear = fyNum - 543;       // 2026

    return [
      { key: `${startCalYear}-10`, label: 'ตุลาคม', quarter: 'Q1 (ไตรมาส 1)', yearBE: fyNum - 1 },
      { key: `${startCalYear}-11`, label: 'พฤศจิกายน', quarter: 'Q1 (ไตรมาส 1)', yearBE: fyNum - 1 },
      { key: `${startCalYear}-12`, label: 'ธันวาคม', quarter: 'Q1 (ไตรมาส 1)', yearBE: fyNum - 1 },
      { key: `${endCalYear}-01`, label: 'มกราคม', quarter: 'Q2 (ไตรมาส 2)', yearBE: fyNum },
      { key: `${endCalYear}-02`, label: 'กุมภาพันธ์', quarter: 'Q2 (ไตรมาส 2)', yearBE: fyNum },
      { key: `${endCalYear}-03`, label: 'มีนาคม', quarter: 'Q2 (ไตรมาส 2)', yearBE: fyNum },
      { key: `${endCalYear}-04`, label: 'เมษายน', quarter: 'Q3 (ไตรมาส 3)', yearBE: fyNum },
      { key: `${endCalYear}-05`, label: 'พฤษภาคม', quarter: 'Q3 (ไตรมาส 3)', yearBE: fyNum },
      { key: `${endCalYear}-06`, label: 'มิถุนายน', quarter: 'Q3 (ไตรมาส 3)', yearBE: fyNum },
      { key: `${endCalYear}-07`, label: 'กรกฎาคม', quarter: 'Q4 (ไตรมาส 4)', yearBE: fyNum },
      { key: `${endCalYear}-08`, label: 'สิงหาคม', quarter: 'Q4 (ไตรมาส 4)', yearBE: fyNum },
      { key: `${endCalYear}-09`, label: 'กันยายน', quarter: 'Q4 (ไตรมาส 4)', yearBE: fyNum },
    ];
  }, [selectedFiscalYear]);

  // Filtered employees for report
  const filteredEmployeesForReport = useMemo(() => {
    return employees.filter(emp => reportDept === 'ALL' || emp.department === reportDept);
  }, [employees, reportDept]);

  // -------------------------------------------------------------
  // 1. DAILY ATTENDANCE & WORK CALCULATIONS
  // -------------------------------------------------------------
  const dailyAttendanceList = useMemo(() => {
    return filteredEmployeesForReport.map(emp => {
      const activeLeave = leaveRecords.find(r => 
        r.status === 'อนุมัติ' && 
        r.employeeId === emp.id && 
        selectedDate >= r.startDate && 
        selectedDate <= r.endDate
      );
      return {
        employee: emp,
        isOnLeave: !!activeLeave,
        leaveRecord: activeLeave
      };
    });
  }, [filteredEmployeesForReport, leaveRecords, selectedDate]);

  const totalEmployeesCount = dailyAttendanceList.length;
  const presentEmployeesCount = dailyAttendanceList.filter(item => !item.isOnLeave).length;
  const onLeaveEmployeesCount = dailyAttendanceList.filter(item => item.isOnLeave).length;
  const presentPercentage = totalEmployeesCount > 0 ? Math.round((presentEmployeesCount / totalEmployeesCount) * 100) : 0;

  // Daily Leave Breakdown by Type
  const dailyLeaveBreakdown = useMemo(() => {
    const counts = { vacation: 0, sick: 0, personal: 0, other: 0 };
    dailyAttendanceList.forEach(item => {
      if (item.isOnLeave && item.leaveRecord) {
        if (item.leaveRecord.leaveType === 'ลาพักผ่อน') counts.vacation++;
        else if (item.leaveRecord.leaveType === 'ลาป่วย') counts.sick++;
        else if (item.leaveRecord.leaveType === 'ลากิจส่วนตัว') counts.personal++;
        else counts.other++;
      }
    });
    return counts;
  }, [dailyAttendanceList]);

  // Department-by-department attendance summary for the day
  const dailyDeptAttendance = useMemo(() => {
    return departments.map(dept => {
      const deptStaff = dailyAttendanceList.filter(i => i.employee.department === dept);
      const total = deptStaff.length;
      const present = deptStaff.filter(i => !i.isOnLeave).length;
      const onLeave = deptStaff.filter(i => i.isOnLeave).length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;
      return { dept, total, present, onLeave, pct };
    }).filter(d => reportDept === 'ALL' || d.dept === reportDept);
  }, [dailyAttendanceList, departments, reportDept]);

  // Filtered daily list by status
  const visibleDailyAttendance = useMemo(() => {
    if (dailyStatusFilter === 'PRESENT') return dailyAttendanceList.filter(i => !i.isOnLeave);
    if (dailyStatusFilter === 'LEAVE') return dailyAttendanceList.filter(i => i.isOnLeave);
    return dailyAttendanceList;
  }, [dailyAttendanceList, dailyStatusFilter]);

  // -------------------------------------------------------------
  // 2. MONTHLY ATTENDANCE & WORK CALCULATIONS
  // -------------------------------------------------------------
  // Calculate total days in month
  const [mYear, mMonth] = selectedMonthKey.split('-').map(Number);
  const daysInSelectedMonth = new Date(mYear, mMonth, 0).getDate();

  // Monthly leaves filtered
  const monthlyLeaves = useMemo(() => {
    return leaveRecords.filter(r => {
      if (r.status !== 'อนุมัติ') return false;
      const matchesDept = reportDept === 'ALL' || r.department === reportDept;
      if (!matchesDept) return false;

      // Check date overlap with selected month (YYYY-MM-01 to YYYY-MM-lastDay)
      const monthStart = `${selectedMonthKey}-01`;
      const monthEnd = `${selectedMonthKey}-${daysInSelectedMonth.toString().padStart(2, '0')}`;
      return (r.startDate <= monthEnd && r.endDate >= monthStart);
    });
  }, [leaveRecords, selectedMonthKey, reportDept, daysInSelectedMonth]);

  // Day-by-day attendance in this month
  const monthlyDayByDayStats = useMemo(() => {
    const stats: Array<{
      day: number;
      dateStr: string;
      dayOfWeek: string;
      isWeekend: boolean;
      presentCount: number;
      onLeaveCount: number;
      pct: number;
    }> = [];

    const thDayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    for (let day = 1; day <= daysInSelectedMonth; day++) {
      const dateStr = `${selectedMonthKey}-${day.toString().padStart(2, '0')}`;
      const dObj = new Date(mYear, mMonth - 1, day);
      const dayOfWeekIdx = dObj.getDay();
      const isWeekend = (dayOfWeekIdx === 0 || dayOfWeekIdx === 6);

      // Count leaves on this date
      const onLeaveCount = filteredEmployeesForReport.filter(emp => {
        return leaveRecords.some(r => 
          r.status === 'อนุมัติ' && 
          r.employeeId === emp.id && 
          dateStr >= r.startDate && 
          dateStr <= r.endDate
        );
      }).length;

      const total = filteredEmployeesForReport.length;
      const presentCount = total - onLeaveCount;
      const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      stats.push({
        day,
        dateStr,
        dayOfWeek: thDayNames[dayOfWeekIdx],
        isWeekend,
        presentCount,
        onLeaveCount,
        pct
      });
    }

    return stats;
  }, [selectedMonthKey, daysInSelectedMonth, mYear, mMonth, filteredEmployeesForReport, leaveRecords]);

  // Aggregate stats for the month
  const workingDaysInMonth = monthlyDayByDayStats.filter(d => !d.isWeekend).length;
  const avgPresentPerDay = workingDaysInMonth > 0 
    ? (monthlyDayByDayStats.filter(d => !d.isWeekend).reduce((acc, d) => acc + d.presentCount, 0) / workingDaysInMonth).toFixed(1)
    : '0';
  const avgAttendancePct = totalEmployeesCount > 0 
    ? Math.round((Number(avgPresentPerDay) / totalEmployeesCount) * 100)
    : 0;

  // Monthly summary per employee
  const employeeMonthlySummary = useMemo(() => {
    return filteredEmployeesForReport.map(emp => {
      // Find leaves overlapping with month
      const empLeaves = monthlyLeaves.filter(l => l.employeeId === emp.id);
      
      let vacationDays = 0;
      let sickDays = 0;
      let personalDays = 0;
      let otherDays = 0;

      // Count exact overlap days in this month
      monthlyDayByDayStats.forEach(d => {
        if (!d.isWeekend) {
          const leaveOnDay = empLeaves.find(l => d.dateStr >= l.startDate && d.dateStr <= l.endDate);
          if (leaveOnDay) {
            if (leaveOnDay.leaveType === 'ลาพักผ่อน') vacationDays++;
            else if (leaveOnDay.leaveType === 'ลาป่วย') sickDays++;
            else if (leaveOnDay.leaveType === 'ลากิจส่วนตัว') personalDays++;
            else otherDays++;
          }
        }
      });

      const totalLeaveDays = vacationDays + sickDays + personalDays + otherDays;
      const daysWorked = Math.max(0, workingDaysInMonth - totalLeaveDays);
      const workPct = workingDaysInMonth > 0 ? Math.round((daysWorked / workingDaysInMonth) * 100) : 100;

      return {
        emp,
        daysWorked,
        workingDaysInMonth,
        vacationDays,
        sickDays,
        personalDays,
        otherDays,
        totalLeaveDays,
        workPct,
      };
    });
  }, [filteredEmployeesForReport, monthlyLeaves, monthlyDayByDayStats, workingDaysInMonth]);

  // -------------------------------------------------------------
  // 3. FULL FISCAL YEAR (12 MONTHS) SUMMARY
  // -------------------------------------------------------------
  const fiscalYearMonthsSummary = useMemo(() => {
    return fiscalMonths.map(fm => {
      const [y, m] = fm.key.split('-').map(Number);
      const daysInM = new Date(y, m, 0).getDate();
      
      // Calculate work days
      let workDaysCount = 0;
      let totalManDaysPresent = 0;
      let totalLeaveCount = 0;

      const mLeaves = leaveRecords.filter(r => {
        if (r.status !== 'อนุมัติ') return false;
        const matchesDept = reportDept === 'ALL' || r.department === reportDept;
        if (!matchesDept) return false;
        const mStart = `${fm.key}-01`;
        const mEnd = `${fm.key}-${daysInM.toString().padStart(2, '0')}`;
        return (r.startDate <= mEnd && r.endDate >= mStart);
      });

      for (let d = 1; d <= daysInM; d++) {
        const dObj = new Date(y, m - 1, d);
        const isWk = (dObj.getDay() === 0 || dObj.getDay() === 6);
        if (!isWk) {
          workDaysCount++;
          const dStr = `${fm.key}-${d.toString().padStart(2, '0')}`;
          const onLeave = filteredEmployeesForReport.filter(emp => 
            mLeaves.some(r => r.employeeId === emp.id && dStr >= r.startDate && dStr <= r.endDate)
          ).length;
          totalManDaysPresent += (filteredEmployeesForReport.length - onLeave);
          totalLeaveCount += onLeave;
        }
      }

      const avgPresent = workDaysCount > 0 ? (totalManDaysPresent / workDaysCount).toFixed(1) : '0';
      const pct = (filteredEmployeesForReport.length > 0 && workDaysCount > 0)
        ? Math.round((Number(avgPresent) / filteredEmployeesForReport.length) * 100)
        : 100;

      return {
        ...fm,
        workDaysCount,
        avgPresent,
        totalLeaveCount,
        pct
      };
    });
  }, [fiscalMonths, leaveRecords, reportDept, filteredEmployeesForReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              รอบปีงบประมาณ พ.ศ. {selectedFiscalYear} (1 ต.ค. - 30 ก.ย.)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">สรุปข้อมูลคนมาทำงาน & สถิติวันลา</h2>
          <p className="text-xs text-slate-500">
            รายงานวิเคราะห์ข้อมูลคนมาปฏิบัติราชการจริงในแต่ละวัน แต่ละเดือน และตัดรอบตามปีงบประมาณ เทศบาลตำบลทุ่งช้าง
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
            title="ส่งออกข้อมูลวันลาทั้งหมดลงเครื่องในรูปแบบ Excel, CSV หรือ JSON สำรองข้อมูล"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออกข้อมูลสำรอง (Excel/CSV)</span>
          </button>
          <button
            onClick={() => setIsMemoModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all shadow-xs border border-slate-800"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>พิมพ์ตามแบบหนังสือราชการ</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all shadow-md shadow-teal-950/20"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน / บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Selection */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-2 print:hidden">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSubTab === 'daily'
              ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>1. สรุปคนมาทำงานรายวัน (Daily)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('monthly')}
          className={`px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSubTab === 'monthly'
              ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>2. สรุปคนมาทำงานรายเดือน (Monthly)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fiscal-year')}
          className={`px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSubTab === 'fiscal-year'
              ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>3. สรุปภาพรวมรอบปีงบประมาณ 12 เดือน</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Fiscal Year Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">ปีงบประมาณ:</label>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="2569">พ.ศ. 2569 (1 ต.ค. 68 - 30 ก.ย. 69)</option>
              <option value="2568">พ.ศ. 2568 (1 ต.ค. 67 - 30 ก.ย. 68)</option>
            </select>
          </div>

          {/* Sub-tab specific Date / Month picker */}
          {activeSubTab === 'daily' && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">เลือกวันที่:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {activeSubTab === 'monthly' && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">เลือกเดือน (รอบปีงบประมาณ):</label>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {fiscalMonths.map(fm => (
                  <option key={fm.key} value={fm.key}>
                    {fm.label} {fm.yearBE} ({fm.quarter})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">ส่วนราชการ:</label>
            <select
              value={reportDept}
              onChange={(e) => setReportDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">ทุกส่วนราชการ / กอง</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status filter tag */}
        {activeSubTab === 'daily' && (
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDailyStatusFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                dailyStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({totalEmployeesCount})
            </button>
            <button
              onClick={() => setDailyStatusFilter('PRESENT')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                dailyStatusFilter === 'PRESENT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              มาทำงาน ({presentEmployeesCount})
            </button>
            <button
              onClick={() => setDailyStatusFilter('LEAVE')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                dailyStatusFilter === 'LEAVE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กำลังลา ({onLeaveEmployeesCount})
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY ATTENDANCE REPORT VIEW                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily' && (
        <div className="space-y-6">
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">กำลังพลทั้งหมด</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalEmployeesCount} <span className="text-sm font-normal text-slate-500">คน</span></h3>
                <p className="text-xs text-slate-400 mt-0.5">ในสังกัดเทศบาลตำบลทุ่งช้าง</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-xs border border-emerald-200/80 bg-emerald-50/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">มาปฏิบัติราชการจริง (มาทำงาน)</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                  {presentEmployeesCount} <span className="text-sm font-normal text-slate-500">คน</span>
                </h3>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">คิดเป็น {presentPercentage}% ของกำลังพล</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-xs border border-amber-200/80 bg-amber-50/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">กำลังลาปฏิบัติราชการ</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">
                  {onLeaveEmployeesCount} <span className="text-sm font-normal text-slate-500">คน</span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">คิดเป็น {100 - presentPercentage}% ของกำลังพล</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-xs border border-teal-200/80 bg-teal-50/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">จำแนกประเภทการลาวันนี้</p>
                <div className="text-xs text-slate-700 mt-1.5 space-y-0.5 font-medium">
                  <div>• ลาพักผ่อน: <span className="font-bold text-teal-800">{dailyLeaveBreakdown.vacation}</span> คน</div>
                  <div>• ลาป่วย: <span className="font-bold text-teal-800">{dailyLeaveBreakdown.sick}</span> คน</div>
                  <div>• ลากิจ: <span className="font-bold text-teal-800">{dailyLeaveBreakdown.personal}</span> คน</div>
                </div>
              </div>
              <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs">
                <Percent className="w-6 h-6 text-teal-700" />
              </div>
            </div>
          </div>

          {/* Department Breakdown Matrix */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <span>สรุปยอดคนมาทำงานแยกตามส่วนราชการ / กอง ประจำวันที่ {selectedDate}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyDeptAttendance.map(d => (
                <div key={d.dept} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{d.dept}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">กำลังพล {d.total} คน</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      d.onLeave === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      มา {d.present} / ลา {d.onLeave}
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{d.pct}% มาทำงาน</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Personnel Daily Attendance Table */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  บัญชีรายชื่อการมาปฏิบัติราชการประจำวัน : วันที่ {selectedDate}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ปีงบประมาณ พ.ศ. {selectedFiscalYear} • เทศบาลตำบลทุ่งช้าง อำเภอทุ่งช้าง จังหวัดน่าน
                </p>
              </div>
              <span className="bg-teal-50 text-teal-800 border border-teal-200/70 px-3.5 py-1 rounded-full text-xs font-bold w-fit">
                มาทำงานจริง {presentEmployeesCount} จาก {totalEmployeesCount} คน ({presentPercentage}%)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-semibold tracking-wider">
                    <th className="py-3.5 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-3.5 px-3 w-16 text-center">รูปถ่าย</th>
                    <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4">ตำแหน่ง</th>
                    <th className="py-3.5 px-4">สังกัดส่วนราชการ</th>
                    <th className="py-3.5 px-4 text-center">สถานะการปฏิบัติงาน</th>
                    <th className="py-3.5 px-4">รายละเอียดการลา / หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {visibleDailyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    visibleDailyAttendance.map((item, idx) => {
                      const photo = item.employee.photoUrl || item.employee.avatar;
                      return (
                        <tr key={item.employee.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 text-slate-400 text-center font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-center">
                            {photo ? (
                              <img
                                src={photo}
                                alt={item.employee.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover mx-auto border border-emerald-300 shadow-2xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 font-bold mx-auto flex flex-col items-center justify-center text-[10px] border border-slate-200">
                                <User className="w-4 h-4 text-slate-400" />
                                <span>{item.employee.name.slice(0, 2)}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{item.employee.name}</td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs">{item.employee.position}</td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">{item.employee.department}</td>
                          <td className="py-3.5 px-4 text-center">
                            {item.isOnLeave ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center space-x-1">
                                <span>ลา ({item.leaveRecord?.leaveType})</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center space-x-1">
                                <span>มาปฏิบัติราชการปกติ</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {item.isOnLeave && item.leaveRecord ? (
                              <div>
                                <span className="font-semibold text-slate-800">{item.leaveRecord.leaveType}</span> ({item.leaveRecord.startDate} ถึง {item.leaveRecord.endDate})
                                <div className="text-slate-500 truncate max-w-xs">เหตุผล: {item.leaveRecord.reason}</div>
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-medium">มาปฏิบัติงานที่สำนักงานปกติ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MONTHLY ATTENDANCE REPORT VIEW                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">วันทำการในเดือนนี้</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{workingDaysInMonth} <span className="text-sm font-normal text-slate-500">วัน</span></h3>
                <p className="text-xs text-slate-400 mt-0.5">ไม่รวมวันเสาร์-อาทิตย์</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Calendar className="w-6 h-6 text-slate-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-xs border border-emerald-200/80 bg-emerald-50/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">เฉลี่ยคนมาทำงาน / วัน</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                  {avgPresentPerDay} <span className="text-sm font-normal text-slate-500">คน/วัน</span>
                </h3>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">คิดเป็น {avgAttendancePct}% ของกำลังพล</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-xs border border-teal-200/80 bg-teal-50/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">คน-วันทำงานรวม (Man-Days)</p>
                <h3 className="text-2xl font-bold text-teal-800 mt-1">
                  {employeeMonthlySummary.reduce((acc, e) => acc + e.daysWorked, 0)} <span className="text-sm font-normal text-slate-500">วัน</span>
                </h3>
                <p className="text-xs text-teal-700 mt-0.5">รวมการปฏิบัติงานทั้งหมดในเดือน</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs">
                <Users className="w-6 h-6 text-teal-700" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-xs border border-amber-200/80 bg-amber-50/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">ยอดวันลาสะสมในเดือน</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">
                  {employeeMonthlySummary.reduce((acc, e) => acc + e.totalLeaveDays, 0)} <span className="text-sm font-normal text-slate-500">วัน</span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">รวมคำขอลาทุกประเภทที่อนุมัติ</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </div>

          {/* Day-by-Day Attendance Matrix for the Month */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ตารางสรุปจำนวนคนมาทำงานและคนลารายวัน ประจำเดือน {selectedMonthKey}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  แสดงสถิติการมาปฏิบัติงานของแต่ละวันตลอดทั้งเดือน (ตัดรอบปีงบประมาณ พ.ศ. {selectedFiscalYear})
                </p>
              </div>
            </div>

            {/* Scrollable Day-by-Day Cards/Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {monthlyDayByDayStats.map(d => (
                <div 
                  key={d.day} 
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    d.isWeekend 
                      ? 'bg-slate-100/60 border-slate-200/50 text-slate-400' 
                      : d.onLeaveCount > 0 
                      ? 'bg-amber-50/60 border-amber-200/80 text-slate-800' 
                      : 'bg-emerald-50/60 border-emerald-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>{d.dayOfWeek}</span>
                    <span className="font-bold text-slate-800">{d.day}</span>
                  </div>
                  {d.isWeekend ? (
                    <p className="text-[11px] text-slate-400 py-1 font-medium">วันหยุด</p>
                  ) : (
                    <div className="mt-1">
                      <div className="text-xs font-bold text-emerald-800">มา {d.presentCount}</div>
                      {d.onLeaveCount > 0 && (
                        <div className="text-[10px] font-bold text-amber-700">ลา {d.onLeaveCount} คน</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Monthly Personnel Summary Table */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  รายงานสรุปสถิติคนมาทำงานและวันลารายบุคคล ประจำเดือน : {selectedMonthKey}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ปีงบประมาณ พ.ศ. {selectedFiscalYear} • แสดงจำนวนวันมาทำงานจริง และวันลาแยกตามประเภท
                </p>
              </div>
              <span className="bg-teal-50 text-teal-800 border border-teal-200/70 px-3 py-1 rounded-full text-xs font-bold w-fit">
                บุคลากรทั้งหมด {employeeMonthlySummary.length} คน
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-semibold tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4">สังกัด</th>
                    <th className="py-3.5 px-4 text-center">วันทำงานในเดือน</th>
                    <th className="py-3.5 px-4 text-center font-bold text-emerald-300">มาทำงานจริง (วัน)</th>
                    <th className="py-3.5 px-4 text-center">ลาพักผ่อน (วัน)</th>
                    <th className="py-3.5 px-4 text-center">ลาป่วย (วัน)</th>
                    <th className="py-3.5 px-4 text-center">ลากิจ (วัน)</th>
                    <th className="py-3.5 px-4 text-center">อื่นๆ (วัน)</th>
                    <th className="py-3.5 px-4 text-center font-bold text-amber-300">รวมวันลา (วัน)</th>
                    <th className="py-3.5 px-4 text-center font-bold text-teal-300">% มาทำงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {employeeMonthlySummary.map((item, idx) => (
                    <tr key={item.emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.emp.name}</div>
                        <div className="text-xs text-slate-400">{item.emp.position}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">{item.emp.department}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">{item.workingDaysInMonth}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">
                        {item.daysWorked}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{item.vacationDays}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{item.sickDays}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{item.personalDays}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{item.otherDays}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-800 bg-amber-50/30">
                        {item.totalLeaveDays}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-900">
                        {item.workPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FULL FISCAL YEAR SUMMARY VIEW                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'fiscal-year' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  สรุปผลการปฏิบัติราชการและสถิติวันลารอบ 12 เดือน : ปีงบประมาณ พ.ศ. {selectedFiscalYear}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  รอบปีงบประมาณไทย เริ่มวันที่ 1 ตุลาคม ถึง 30 กันยายน เทศบาลตำบลทุ่งช้าง
                </p>
              </div>
              <span className="bg-teal-50 text-teal-800 border border-teal-200/70 px-3.5 py-1 rounded-full text-xs font-bold w-fit">
                รอบปี พ.ศ. {selectedFiscalYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-semibold tracking-wider">
                    <th className="py-3.5 px-4">เดือนในรอบปีงบประมาณ</th>
                    <th className="py-3.5 px-4">ไตรมาส</th>
                    <th className="py-3.5 px-4 text-center">วันทำการ (วัน)</th>
                    <th className="py-3.5 px-4 text-center font-bold text-emerald-300">เฉลี่ยคนมาทำงาน/วัน</th>
                    <th className="py-3.5 px-4 text-center font-bold text-amber-300">ยอดวันลาสะสม</th>
                    <th className="py-3.5 px-4 text-center font-bold text-teal-300">% การมาทำงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {fiscalYearMonthsSummary.map((fm) => (
                    <tr key={fm.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {fm.label} {fm.yearBE}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                        <span className={`px-2 py-0.5 rounded-md ${
                          fm.quarter.includes('Q1') ? 'bg-emerald-50 text-emerald-800' :
                          fm.quarter.includes('Q2') ? 'bg-teal-50 text-teal-800' :
                          fm.quarter.includes('Q3') ? 'bg-amber-50 text-amber-800' : 'bg-cyan-50 text-cyan-800'
                        }`}>
                          {fm.quarter}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{fm.workDaysCount} วัน</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-800 bg-emerald-50/20">
                        {fm.avgPresent} / {filteredEmployeesForReport.length} คน
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-800 bg-amber-50/20">
                        {fm.totalLeaveCount} วัน
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-900">
                        {fm.pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Government Memorandum Summary Modal */}
      {isMemoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center no-print pb-4 mb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                รายงานการปฏิบัติราชการและสถิติวันลาตามแบบราชการ
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadMemoPDF}
                  disabled={isGeneratingPDF}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-400 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังสร้าง PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ (A4)</span>
                </button>
                <button
                  onClick={() => setIsMemoModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Official Report Table Printable Area */}
            <div 
              ref={memoPrintRef}
              className="bg-white p-6 text-black font-sarabun-it9 thai-gov-doc printable-report-area text-base leading-relaxed max-w-[210mm] mx-auto border border-slate-300 shadow-sm print:border-none print:shadow-none"
              style={{
                fontFamily: "'TH Sarabun IT9', 'TH Sarabun IT๙', 'THSarabunIT9', 'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'THSarabunPSK', 'Sarabun', serif, sans-serif"
              }}
            >
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
                <div className="flex justify-center mb-2">
                  <img 
                    src={logoImg} 
                    alt="ตราเทศบาลตำบลทุ่งช้าง" 
                    className="w-16 h-16 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-lg font-bold tracking-wide">เทศบาลตำบลทุ่งช้าง อำเภอทุ่งช้าง จังหวัดน่าน</h2>
                <h3 className="text-base font-semibold mt-1">รายงานสรุปข้อมูลคนมาทำงานและการลาของบุคลากร</h3>
                <p className="text-xs text-slate-600 mt-1">
                  รอบปีงบประมาณ พ.ศ. {selectedFiscalYear} • ประจำวันที่: <span className="font-semibold text-slate-800">{selectedDate}</span> (สังกัด: {reportDept === 'ALL' ? 'ทุกส่วนราชการ' : reportDept})
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="border border-slate-300 p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-600 font-medium">กำลังพลทั้งหมด</div>
                  <div className="text-xl font-bold text-slate-800">{totalEmployeesCount} <span className="text-xs font-normal">คน</span></div>
                </div>
                <div className="border border-emerald-300 p-3 rounded-xl bg-emerald-50/50">
                  <div className="text-xs text-emerald-700 font-medium">มาปฏิบัติราชการจริง (ทำงาน)</div>
                  <div className="text-xl font-bold text-emerald-700">{presentEmployeesCount} <span className="text-xs font-normal">คน ({presentPercentage}%)</span></div>
                </div>
                <div className="border border-amber-300 p-3 rounded-xl bg-amber-50/50">
                  <div className="text-xs text-amber-700 font-medium">ลาปฏิบัติราชการ</div>
                  <div className="text-xl font-bold text-amber-700">{onLeaveEmployeesCount} <span className="text-xs font-normal">คน</span></div>
                </div>
              </div>

              {/* Table of Attendance & Leave */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">บัญชีรายละเอียดการปฏิบัติราชการรายบุคคล</h4>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="border border-slate-400 p-2 text-center w-12">ที่</th>
                      <th className="border border-slate-400 p-2">ชื่อ - นามสกุล</th>
                      <th className="border border-slate-400 p-2">ตำแหน่ง</th>
                      <th className="border border-slate-400 p-2">สังกัด</th>
                      <th className="border border-slate-400 p-2 text-center w-36">สถานะการปฏิบัติงาน</th>
                      <th className="border border-slate-400 p-2">หมายเหตุ / รายละเอียดการลา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-400 p-4 text-center text-slate-500">
                          ไม่พบข้อมูลบุคลากรในระบบ
                        </td>
                      </tr>
                    ) : (
                      dailyAttendanceList.map((item, idx) => (
                        <tr key={item.employee.id} className="hover:bg-slate-50">
                          <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-400 p-2 font-semibold text-slate-800">{item.employee.name}</td>
                          <td className="border border-slate-400 p-2 text-slate-600">{item.employee.position}</td>
                          <td className="border border-slate-400 p-2 text-slate-600">{item.employee.department}</td>
                          <td className="border border-slate-400 p-2 text-center font-medium">
                            {item.isOnLeave ? (
                              <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-bold">ลา ({item.leaveRecord?.leaveType})</span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">ปฏิบัติราชการปกติ</span>
                            )}
                          </td>
                          <td className="border border-slate-400 p-2 text-slate-600">
                            {item.isOnLeave && item.leaveRecord ? (
                              <span>{item.leaveRecord.leaveType} ({item.leaveRecord.startDate} ถึง {item.leaveRecord.endDate}) - {item.leaveRecord.reason}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
                <div className="space-y-12">
                  <p>ลงชื่อ......................................................ผู้รายงาน</p>
                  <p>(..................................................................)</p>
                  <p>เจ้าหน้าที่งานบุคลากร / เจ้าหน้าที่ธุรการ</p>
                </div>
                <div className="space-y-12">
                  <p>ลงชื่อ......................................................ผู้ตรวจสอบ</p>
                  <p>(..................................................................)</p>
                  <p>ปลัดเทศบาลตำบลทุ่งช้าง / หัวหน้าสำนักปลัด</p>
                </div>
              </div>

              {/* Report Footer */}
              <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-200 mt-8">
                <div>ระบบบริหารจัดการวันลาและกำลังพล เทศบาลตำบลทุ่งช้าง จ.น่าน</div>
                <div>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Data and Backup Modal */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        leaveRecords={leaveRecords}
        employees={employees}
      />
    </div>
  );
};
