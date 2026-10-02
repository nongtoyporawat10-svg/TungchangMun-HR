import React from 'react';
import { Employee, LeaveRecord, TabType, LeaveStatus } from '../types';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle, 
  ArrowRight, 
  CalendarDays,
  FileSpreadsheet,
  Building,
  UserCheck,
  Bell,
  Sparkles,
  User,
  Edit3
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  employees: Employee[];
  leaveRecords: LeaveRecord[];
  onNavigateTab: (tab: TabType) => void;
  onOpenNewLeave: () => void;
  onOpenAILeave?: () => void;
  onUpdateStatus: (id: string, status: LeaveStatus) => void;
  onEditRecord?: (record: LeaveRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  leaveRecords,
  onNavigateTab,
  onOpenNewLeave,
  onOpenAILeave,
  onUpdateStatus,
  onEditRecord,
}) => {
  const { theme } = useTheme();
  // Today's date in YYYY-MM-DD dynamically
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getTodayStr();

  const formatThaiDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiDays = [
      'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
    ];
    const dayName = thaiDays[dateObj.getDay()];
    const monthName = thaiMonths[m - 1];
    const thaiYear = y + 543;
    return {
      dayName,
      short: `${d} ${monthName}`,
      full: `${dayName}ที่ ${d} ${monthName} ${thaiYear}`
    };
  };

  const thaiDateInfo = formatThaiDate(todayStr);

  // Find who is on leave today
  const onLeaveToday = leaveRecords.filter(r => 
    r.status === 'อนุมัติ' && todayStr >= r.startDate && todayStr <= r.endDate
  );

  // Pending leaves
  const pendingLeaves = leaveRecords.filter(r => r.status === 'รออนุมัติ');

  // Total leave days approved in current fiscal year (2569: Oct 1, 2025 - Sep 30, 2026)
  const approvedLeaves = leaveRecords.filter(r => r.status === 'อนุมัติ');
  const totalDaysTaken = approvedLeaves.reduce((acc, curr) => acc + curr.totalDays, 0);

  // Count by leave type
  const leaveTypeCounts = approvedLeaves.reduce((acc, curr) => {
    acc[curr.leaveType] = (acc[curr.leaveType] || 0) + curr.totalDays;
    return acc;
  }, {} as Record<string, number>);

  // Count by department
  const deptCounts = approvedLeaves.reduce((acc, curr) => {
    acc[curr.department] = (acc[curr.department] || 0) + curr.totalDays;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-r ${theme.heroGradient} text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-white/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className={`inline-flex items-center space-x-2 ${theme.badgeBg} ${theme.badgeText} px-3 py-1 rounded-full text-xs font-medium mb-4 border ${theme.badgeBorder} backdrop-blur-md`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>ปีงบประมาณ 2569 (ต.ค. 2568 - ก.ย. 2569)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            ระบบบริหารจัดการและควบคุมวันลา
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            ตรวจสอบสถานะการลาของบุคลากรประจำวัน ปฏิทินการปฏิบัติงาน รายงานสถิติวันลาประจำเดือน 
            และสรุปข้อมูลตามปีงบประมาณและไตรมาส เทศบาลตำบลทุ่งช้าง
          </p>
          <div className="flex flex-wrap gap-3">
            {onOpenAILeave && (
              <button
                onClick={onOpenAILeave}
                className={`bg-gradient-to-r ${theme.primaryGradient} hover:opacity-95 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-slate-950/40 transition-all flex items-center space-x-2 text-sm border border-white/20 active:scale-95`}
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>เพิ่มวันลาด้วย AI (สแกน PDF/JPG)</span>
              </button>
            )}
            <button
              onClick={onOpenNewLeave}
              className="bg-slate-800/90 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center space-x-2 text-sm shadow-xs"
            >
              <CalendarDays className={`w-4 h-4 ${theme.accentText}`} />
              <span>บันทึกแบบปกติ</span>
            </button>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="bg-slate-800/50 hover:bg-slate-700/60 text-slate-300 hover:text-white font-medium px-5 py-2.5 rounded-xl border border-slate-700/60 transition-all flex items-center space-x-2 text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>ดูปฏิทินการลา</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">พนักงานทั้งหมด</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{employees.length} <span className="text-sm font-normal text-slate-500">คน</span></h3>
            <p className="text-xs text-teal-600 mt-1 flex items-center font-medium">
              <Building className="w-3.5 h-3.5 mr-1" /> 7 ส่วนราชการ/กอง
            </p>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 border border-sky-100 rounded-2xl flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">กำลังลาในวันนี้ {thaiDateInfo.short}</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{onLeaveToday.length} <span className="text-sm font-normal text-slate-500">คน</span></h3>
            <p className="text-xs text-slate-500 mt-1 truncate max-w-[170px]">
              {onLeaveToday.length > 0 ? onLeaveToday.map(l => l.employeeName).join(', ') : 'ไม่มีผู้ลาวันนี้'}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">รออนุมัติคำขอ</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{pendingLeaves.length} <span className="text-sm font-normal text-slate-500">รายการ</span></h3>
            <p className="text-xs text-indigo-600 mt-1 flex items-center font-medium">
              <Clock className="w-3.5 h-3.5 mr-1" /> รอผู้บริหารพิจารณา
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center relative shadow-xs">
            <Clock className="w-6 h-6" />
            {pendingLeaves.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {pendingLeaves.length}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">วันลาสะสมรวม (ปี 69)</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalDaysTaken} <span className="text-sm font-normal text-slate-500">วัน</span></h3>
            <p className="text-xs text-slate-500 mt-1">จากรายการที่อนุมัติแล้ว</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* HIGHLIGHTED PENDING APPROVAL NOTIFICATION QUEUE (Quick Action Bar) */}
      {pendingLeaves.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 shadow-xl border border-indigo-500/30 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-400/30">
                <Bell className="w-5 h-5 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">แจ้งเตือน: คำขอลาที่รอการอนุมัติเร่งด่วน ({pendingLeaves.length} รายการ)</h3>
                <p className="text-xs text-indigo-200">ผู้บริหารสามารถพิจารณาอนุมัติหรือไม่อนุมัติได้ทันที</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('leave-list')}
              className="text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl transition-all font-semibold flex items-center justify-center space-x-1 border border-indigo-400/30 self-start sm:self-auto"
            >
              <span>จัดการในรายการลา</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {pendingLeaves.map(leave => (
              <div key={leave.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-indigo-400/30 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      รออนุมัติ
                    </span>
                    <h4 className="font-bold text-white text-base mt-1.5">{leave.employeeName}</h4>
                    <p className="text-xs text-indigo-200">{leave.department} • <span className="font-semibold text-emerald-300">{leave.leaveType}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white bg-indigo-950/70 px-2.5 py-1 rounded-xl border border-indigo-700/80">
                      {leave.totalDays} วัน
                    </span>
                  </div>
                </div>

                <div className="text-xs text-indigo-100 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-800/50">
                  <div className="flex justify-between font-medium text-indigo-200 mb-1">
                    <span>ช่วงวันที่: {leave.startDate} ถึง {leave.endDate}</span>
                  </div>
                  <p className="italic text-slate-300 truncate">เหตุผล: {leave.reason}</p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-indigo-800/40">
                  <button
                    onClick={() => onUpdateStatus(leave.id, 'ไม่อนุมัติ')}
                    className="bg-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ไม่อนุมัติ</span>
                  </button>
                  <button
                    onClick={() => onUpdateStatus(leave.id, 'อนุมัติ')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all shadow-md shadow-emerald-950/30 border border-emerald-400/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>อนุมัติทันที</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Who is on leave today & Quick breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Who is on leave today & Recent Leaves */}
        <div className="lg:col-span-2 space-y-6">
          {/* Who is on leave today box */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse ring-4 ring-amber-500/20"></div>
                <h3 className="font-bold text-slate-900 text-lg">บุคลากรที่ลาในวันนี้ {thaiDateInfo.full}</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('calendar')}
                className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center space-x-1 transition-colors"
              >
                <span>ดูปฏิทินทั้งหมด</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {onLeaveToday.length === 0 ? (
              <div className="bg-slate-50/70 rounded-2xl p-6 text-center border border-dashed border-slate-300/80">
                <UserCheck className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <p className="text-slate-800 font-semibold">ไม่มีบุคลากรลาในวันนี้ ปฏิบัติราชการครบทุกท่าน</p>
                <p className="text-slate-400 text-xs mt-1">กำลังพลพร้อมปฏิบัติงานเต็มอัตรากำลัง</p>
              </div>
            ) : (
              <div className="space-y-3">
                {onLeaveToday.map(leave => {
                  const emp = employees.find(e => e.id === leave.employeeId || e.name === leave.employeeName);
                  const photo = emp?.photoUrl || emp?.avatar;
                  return (
                    <div key={leave.id} className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        {photo ? (
                          <img
                            src={photo}
                            alt={leave.employeeName}
                            referrerPolicy="no-referrer"
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-400 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-13 h-13 bg-amber-100/80 text-amber-900 rounded-2xl font-bold flex flex-col items-center justify-center text-xs shadow-2xs border border-amber-300 shrink-0">
                            <User className="w-5 h-5 text-amber-700 mb-0.5" />
                            <span>{leave.employeeName.slice(0, 2)}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{leave.employeeName}</h4>
                          <p className="text-xs text-slate-600">{leave.department} • <span className="font-semibold text-amber-800">{leave.leaveType}</span></p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <span className="bg-amber-100/90 text-amber-900 text-xs px-3 py-1 rounded-full font-bold border border-amber-200">
                          {leave.totalDays} วัน ({leave.startDate} ถึง {leave.endDate})
                        </span>
                        <p className="text-xs text-slate-500 mt-1 italic">เหตุผล: {leave.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Leave Requests */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">รายการลาล่าสุด</h3>
              <button 
                onClick={() => onNavigateTab('leave-list')}
                className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center space-x-1 transition-colors"
              >
                <span>ดูทั้งหมด ({leaveRecords.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">พนักงาน / สังกัด</th>
                    <th className="py-3 px-3">ประเภทการลา</th>
                    <th className="py-3 px-3">ช่วงวันที่ลา</th>
                    <th className="py-3 px-3">สถานะ</th>
                    <th className="py-3 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {leaveRecords.slice(0, 5).map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{record.employeeName}</div>
                        <div className="text-xs text-slate-500">{record.department}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-700">{record.leaveType}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-xs font-medium">
                        {record.startDate} ถึง {record.endDate} <span className="text-slate-400">({record.totalDays} วัน)</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          record.status === 'อนุมัติ' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : record.status === 'รออนุมัติ'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {onEditRecord ? (
                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium inline-flex items-center space-x-1 transition-colors border border-amber-200/60 cursor-pointer"
                            title="แก้ไขรายละเอียดวันลา"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>แก้ไข</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Stats by leave type and departments */}
        <div className="space-y-6">
          {/* Leave Type breakdown */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
              <span>สถิติแยกตามประเภทการลา</span>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">ปีงบ 2569</span>
            </h3>

            <div className="space-y-3.5">
              {Object.entries(leaveTypeCounts).map(([type, days]) => {
                const total = totalDaysTaken || 1;
                const percentage = Math.round((Number(days) / total) * 100);
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{type}</span>
                      <span className="font-bold text-slate-900">{days} วัน <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          type === 'ลาพักผ่อน' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          type === 'ลาป่วย' ? 'bg-gradient-to-r from-sky-500 to-blue-500' :
                          type === 'ลากิจส่วนตัว' ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department breakdown */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-base mb-4">สถิติวันลาตามส่วนราชการ</h3>
            <div className="space-y-2.5">
              {Object.entries(deptCounts).map(([dept, days]) => (
                <div key={dept} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{dept}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-xl">
                    {days} วัน
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold text-base mb-2 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-teal-400" />
                <span>ระเบียบการลาท้องถิ่น</span>
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                การยื่นลาพักผ่อนต้องได้รับอนุมัติจากผู้บังคับบัญชาก่อนวันลาไม่น้อยกว่า 3 วันทำการ ยกเว้นกรณีฉุกเฉินหรือลาป่วย
              </p>
              <button 
                onClick={() => onNavigateTab('ai-advisor')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all border border-slate-700 flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>ปรึกษาผู้ช่วย AI ตรวจสอบระเบียบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
