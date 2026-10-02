import React, { useState, useRef } from 'react';
import { LeaveRecord, Department } from '../types';
import { BarChart3, Calendar, Layers, Printer, ChevronDown, ChevronUp, User, FileDown, Loader2, FileSpreadsheet } from 'lucide-react';
import { exportElementToPDF } from '../utils/pdfExport';
import { exportAllLeaveRecordsToExcel } from '../utils/excelExport';

interface FiscalQuarterReportViewProps {
  leaveRecords: LeaveRecord[];
}

export const FiscalQuarterReportView: React.FC<FiscalQuarterReportViewProps> = ({ leaveRecords }) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2569');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [expandedDept, setExpandedDept] = useState<Record<string, boolean>>({
    'สำนักปลัด': true,
    'กองคลัง': true,
  });

  const departments: Department[] = [
    'สำนักปลัด', 
    'กองคลัง', 
    'กองช่าง', 
    'กองสาธารณสุขและสิ่งแวดล้อม', 
    'กองการศึกษา', 
    'กองยุทธศาสตร์และงบประมาณ',
    'หน่วยตรวจสอบภายใน'
  ];

  const toggleDept = (dept: string) => {
    setExpandedDept(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  // Helper to determine fiscal quarter for a date string (YYYY-MM-DD)
  const getQuarterInfo = (dateStr: string) => {
    if (!dateStr) return { q: 'Q1', fiscalYear: 2569 };
    const [y, m] = dateStr.split('-').map(Number);
    if (m === 10 || m === 11 || m === 12) {
      return { q: 'Q1', fiscalYear: y + 543 + 1 };
    } else if (m === 1 || m === 2 || m === 3) {
      return { q: 'Q2', fiscalYear: y + 543 };
    } else if (m === 4 || m === 5 || m === 6) {
      return { q: 'Q3', fiscalYear: y + 543 };
    } else {
      return { q: 'Q4', fiscalYear: y + 543 };
    }
  };

  // Filter approved leaves for selected fiscal year
  const fyLeaves = leaveRecords.filter(r => {
    if (r.status !== 'อนุมัติ') return false;
    const info = getQuarterInfo(r.startDate);
    return String(info.fiscalYear) === selectedFiscalYear;
  });

  // Calculate totals per quarter
  const q1Total = fyLeaves.filter(r => getQuarterInfo(r.startDate).q === 'Q1').reduce((sum, r) => sum + r.totalDays, 0);
  const q2Total = fyLeaves.filter(r => getQuarterInfo(r.startDate).q === 'Q2').reduce((sum, r) => sum + r.totalDays, 0);
  const q3Total = fyLeaves.filter(r => getQuarterInfo(r.startDate).q === 'Q3').reduce((sum, r) => sum + r.totalDays, 0);
  const q4Total = fyLeaves.filter(r => getQuarterInfo(r.startDate).q === 'Q4').reduce((sum, r) => sum + r.totalDays, 0);
  const totalFyDays = q1Total + q2Total + q3Total + q4Total;

  // Breakdown by Department & Quarter with detailed employee leaves
  const deptQuarterData = departments.map(dept => {
    const deptLeaves = fyLeaves.filter(l => l.department === dept);
    const q1 = deptLeaves.filter(l => getQuarterInfo(l.startDate).q === 'Q1').reduce((s, l) => s + l.totalDays, 0);
    const q2 = deptLeaves.filter(l => getQuarterInfo(l.startDate).q === 'Q2').reduce((s, l) => s + l.totalDays, 0);
    const q3 = deptLeaves.filter(l => getQuarterInfo(l.startDate).q === 'Q3').reduce((s, l) => s + l.totalDays, 0);
    const q4 = deptLeaves.filter(l => getQuarterInfo(l.startDate).q === 'Q4').reduce((s, l) => s + l.totalDays, 0);
    const total = q1 + q2 + q3 + q4;
    return { dept, q1, q2, q3, q4, total, records: deptLeaves };
  });

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    try {
      await exportElementToPDF(reportRef.current, {
        filename: `รายงานสรุปสถิติวันลารายไตรมาส_ปีงบประมาณ_${selectedFiscalYear}.pdf`,
        orientation: 'landscape',
        scale: 2,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">สรุปวันลาประจำปีงบประมาณและรายชื่อบุคลากรรายกอง</h2>
          <p className="text-xs text-slate-500">รายงานวิเคราะห์สถิติวันลาสะสมตามปีงบประมาณและรายละเอียดรายบุคคล แยกตามส่วนราชการ เทศบาลตำบลทุ่งช้าง</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">ปีงบประมาณ:</label>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="2569">พ.ศ. 2569 (ต.ค. 68 - ก.ย. 69)</option>
              <option value="2568">พ.ศ. 2568 (ต.ค. 67 - ก.ย. 68)</option>
            </select>
          </div>
          <button
            onClick={() => exportAllLeaveRecordsToExcel(fyLeaves)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
            title="ส่งออกสถิติวันลาปีงบประมาณนี้เป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel ({fyLeaves.length} รายการ)</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
            title="ดาวน์โหลดรายงานเป็น PDF"
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
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน (A4)</span>
          </button>
        </div>
      </div>

      <div 
        ref={reportRef}
        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs print:p-0 print:border-none print:shadow-none"
      >
        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800">ไตรมาส 1 (ต.ค. - ธ.ค.)</span>
            <div className="text-xl font-bold text-emerald-900 mt-1">{q1Total} <span className="text-xs font-normal">วัน</span></div>
          </div>
          <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200/80">
            <span className="text-[11px] font-bold text-teal-800">ไตรมาส 2 (ม.ค. - มี.ค.)</span>
            <div className="text-xl font-bold text-teal-900 mt-1">{q2Total} <span className="text-xs font-normal">วัน</span></div>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-800">ไตรมาส 3 (เม.ย. - มิ.ย.)</span>
            <div className="text-xl font-bold text-amber-900 mt-1">{q3Total} <span className="text-xs font-normal">วัน</span></div>
          </div>
          <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200/80">
            <span className="text-[11px] font-bold text-cyan-800">ไตรมาส 4 (ก.ค. - ก.ย.)</span>
            <div className="text-xl font-bold text-cyan-900 mt-1">{q4Total} <span className="text-xs font-normal">วัน</span></div>
          </div>
          <div className="bg-slate-900 text-white p-4 rounded-2xl col-span-2 sm:col-span-1 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-300">รวมทั้งปีงบประมาณ</span>
            <div className="text-xl font-bold text-white mt-1">{totalFyDays} <span className="text-xs font-normal text-slate-300">วัน</span></div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse font-sarabun-it9">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3.5 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3.5 px-4">สำนัก / กอง</th>
                <th className="py-3.5 px-4 text-center">ไตรมาส 1 (วัน)</th>
                <th className="py-3.5 px-4 text-center">ไตรมาส 2 (วัน)</th>
                <th className="py-3.5 px-4 text-center">ไตรมาส 3 (วัน)</th>
                <th className="py-3.5 px-4 text-center">ไตรมาส 4 (วัน)</th>
                <th className="py-3.5 px-4 text-center bg-slate-800">รวม (วัน)</th>
                <th className="py-3.5 px-4 text-center print:hidden pdf-exclude">ดูรายชื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptQuarterData.map((item, idx) => {
                const isExpanded = !!expandedDept[item.dept];
                return (
                  <React.Fragment key={item.dept}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{item.dept}</td>
                      <td className="py-4 px-4 text-center font-semibold text-emerald-700">{item.q1 || '-'}</td>
                      <td className="py-4 px-4 text-center font-semibold text-teal-700">{item.q2 || '-'}</td>
                      <td className="py-4 px-4 text-center font-semibold text-amber-700">{item.q3 || '-'}</td>
                      <td className="py-4 px-4 text-center font-semibold text-cyan-700">{item.q4 || '-'}</td>
                      <td className="py-4 px-4 text-center font-bold text-emerald-900 bg-emerald-50/40">
                        {item.total} วัน
                      </td>
                      <td className="py-4 px-4 text-center print:hidden pdf-exclude">
                        {item.records.length > 0 ? (
                          <button
                            onClick={() => toggleDept(item.dept)}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            <span>{isExpanded ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อผู้ลา'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">ไม่มีการลา</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Employee Detail Rows for this Department */}
                    {isExpanded && item.records.length > 0 && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={8} className="p-4 sm:px-8">
                          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                              <User className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                              <span>รายชื่อบุคลากรผู้ลาในสังกัด {item.dept} ({item.records.length} รายการ)</span>
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border border-slate-100 rounded-xl overflow-hidden">
                                <thead className="bg-slate-100/80 text-slate-700 font-semibold">
                                  <tr>
                                    <th className="p-2.5">ชื่อ - นามสกุล</th>
                                    <th className="p-2.5">ประเภทการลา</th>
                                    <th className="p-2.5">ตั้งแต่วันที่ - ถึงวันที่</th>
                                    <th className="p-2.5 text-center">จำนวนวัน</th>
                                    <th className="p-2.5">เหตุผลการลา</th>
                                    <th className="p-2.5 text-center">ไตรมาส</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {item.records.map(rec => {
                                    const qInfo = getQuarterInfo(rec.startDate);
                                    return (
                                      <tr key={rec.id} className="hover:bg-slate-50">
                                        <td className="p-2.5 font-bold text-slate-900">{rec.employeeName}</td>
                                        <td className="p-2.5">
                                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                            rec.leaveType === 'ลาพักผ่อน' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            rec.leaveType === 'ลาป่วย' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                          }`}>
                                            {rec.leaveType}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-slate-700">{rec.startDate} ถึง {rec.endDate}</td>
                                        <td className="p-2.5 text-center font-bold text-emerald-800">{rec.totalDays} วัน</td>
                                        <td className="p-2.5 text-slate-600 truncate max-w-xs">{rec.reason}</td>
                                        <td className="p-2.5 text-center font-bold text-slate-700">{qInfo.q}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200/80">
                <td colSpan={2} className="py-4 px-4 text-right">รวมทั้งสิ้นทุกส่วนราชการ :</td>
                <td className="py-4 px-4 text-center text-emerald-700">{q1Total} วัน</td>
                <td className="py-4 px-4 text-center text-teal-700">{q2Total} วัน</td>
                <td className="py-4 px-4 text-center text-amber-700">{q3Total} วัน</td>
                <td className="py-4 px-4 text-center text-cyan-700">{q4Total} วัน</td>
                <td className="py-4 px-4 text-center text-emerald-950 text-base bg-emerald-100/70">{totalFyDays} วัน</td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
