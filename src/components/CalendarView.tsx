import React, { useState } from 'react';
import { LeaveRecord, Employee } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  User, 
  Clock, 
  CalendarDays, 
  Sparkles,
  Info,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { getThaiHolidayInfo, isWeekend, isWorkingDay } from '../utils/thaiHolidays';
import { ThaiHolidaysModal } from './ThaiHolidaysModal';

interface CalendarViewProps {
  leaveRecords: LeaveRecord[];
  employees: Employee[];
  onEditRecord?: (record: LeaveRecord) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ leaveRecords, employees, onEditRecord }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // Current actual date
  const [selectedDayLeaves, setSelectedDayLeaves] = useState<LeaveRecord[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days array
  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ dayNum: null, dateStr: null, dayOfWeek: i });
  }

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const monthFormatted = String(month + 1).padStart(2, '0');
    const dayFormatted = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
    const dayDate = new Date(year, month, d);
    days.push({ dayNum: d, dateStr, dayOfWeek: dayDate.getDay() });
  }

  const handleDayClick = (dateStr: string | null, dayLeaves: LeaveRecord[]) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    setSelectedDayLeaves(dayLeaves);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-teal-950/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              ปฏิทินการลาและวันหยุดราชการ : {monthNamesThai[month]} พ.ศ. {year + 543}
            </h2>
            <p className="text-xs text-slate-500">
              นับวันทำการและวันหยุดตามปฏิทินวันหยุดราชการไทย เทศบาลตำบลทุ่งช้าง
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsHolidaysModalOpen(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 text-amber-600" />
            <span>วันหยุดราชการ พ.ศ. {year + 543}</span>
          </button>
          
          <button
            onClick={goToToday}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            วันนี้
          </button>
          <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-xl text-slate-700 shadow-2xs transition-all cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-800">
              {monthNamesThai[month]} {year + 543}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-xl text-slate-700 shadow-2xs transition-all cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-900 text-white text-center py-3.5 text-xs font-semibold tracking-wider">
          <span className="text-rose-400 font-bold">อาทิตย์</span>
          <span>จันทร์</span>
          <span>อังคาร</span>
          <span>พุธ</span>
          <span>พฤหัสบดี</span>
          <span>ศุกร์</span>
          <span className="text-sky-400 font-bold">เสาร์</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100">
          {days.map((item, idx) => {
            if (!item.dayNum || !item.dateStr) {
              return <div key={`empty-${idx}`} className="bg-slate-50/40 min-h-[115px] p-2"></div>;
            }

            // Find leaves for this date
            const dayLeaves = leaveRecords.filter(
              r => r.status === 'อนุมัติ' && item.dateStr! >= r.startDate && item.dateStr! <= r.endDate
            );

            const isToday = item.dateStr === new Date().toISOString().split('T')[0];
            const weekend = isWeekend(item.dateStr);
            const holiday = getThaiHolidayInfo(item.dateStr);
            const isSunday = item.dayOfWeek === 0;
            const isSaturday = item.dayOfWeek === 6;

            return (
              <div
                key={item.dateStr}
                onClick={() => handleDayClick(item.dateStr, dayLeaves)}
                className={`min-h-[120px] sm:min-h-[135px] p-2 sm:p-2.5 transition-all cursor-pointer flex flex-col justify-between ${
                  holiday 
                    ? 'bg-rose-50/40 hover:bg-rose-50/70 border-rose-100' 
                    : weekend 
                    ? 'bg-slate-50/70 hover:bg-slate-100/80' 
                    : 'bg-white hover:bg-slate-50/80'
                } ${isToday ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center ${
                      isToday 
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs' 
                        : isSunday 
                        ? 'text-rose-600 bg-rose-50' 
                        : isSaturday 
                        ? 'text-sky-600 bg-sky-50' 
                        : holiday 
                        ? 'text-rose-700 bg-rose-100 font-black' 
                        : 'text-slate-800'
                    }`}>
                      {item.dayNum}
                    </span>

                    {holiday && (
                      <span className="hidden xl:inline text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded-md truncate max-w-[90px]" title={holiday.name}>
                        วันหยุด
                      </span>
                    )}
                  </div>

                  {dayLeaves.length > 0 && (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                      ลา {dayLeaves.length}
                    </span>
                  )}
                </div>

                {/* Holiday Name Banner inside Calendar Cell */}
                {holiday && (
                  <div className="mt-1 px-1.5 py-0.5 bg-rose-100/80 border border-rose-200/80 rounded-lg text-[10px] text-rose-900 font-bold leading-tight line-clamp-2" title={holiday.name}>
                    ⭐ {holiday.name}
                  </div>
                )}

                {/* Leaves in this day */}
                <div className="mt-1.5 space-y-1 overflow-hidden flex-1">
                  {dayLeaves.slice(0, 2).map(leave => (
                    <div
                      key={leave.id}
                      className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-lg truncate font-medium border ${
                        leave.leaveType === 'ลาพักผ่อน' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' :
                        leave.leaveType === 'ลาป่วย' ? 'bg-sky-50 text-sky-800 border-sky-200/60' :
                        'bg-indigo-50 text-indigo-800 border-indigo-200/60'
                      }`}
                      title={`${leave.employeeName} (${leave.leaveType})`}
                    >
                      <span className="font-semibold">{leave.employeeName.split(' ')[0]}</span> ({leave.leaveType})
                    </div>
                  ))}
                  {dayLeaves.length > 2 && (
                    <div className="text-[10px] text-slate-400 font-medium pl-1">
                      + อีก {dayLeaves.length - 2} ท่าน
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Modal Drawer */}
      {selectedDateStr && selectedDayLeaves && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    ข้อมูลวันที่ {selectedDateStr}
                  </h3>
                  {getThaiHolidayInfo(selectedDateStr) ? (
                    <p className="text-xs font-bold text-rose-600 flex items-center space-x-1 mt-0.5">
                      <span>⭐ วันหยุดราชการ: {getThaiHolidayInfo(selectedDateStr)?.name}</span>
                    </p>
                  ) : isWeekend(selectedDateStr) ? (
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      วันหยุดประจำสัปดาห์ (เสาร์-อาทิตย์)
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      วันทำการปฏิบัติราชการปกติ (Working Day)
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDayLeaves.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">ไม่มีบุคลากรลาในวันนี้</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isWorkingDay(selectedDateStr) ? 'ปฏิบัติราชการปกติครบทุกท่าน' : 'เป็นวันหยุดตามระเบียบราชการ'}
                  </p>
                </div>
              ) : (
                selectedDayLeaves.map(leave => (
                  <div key={leave.id} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{leave.employeeName}</h4>
                        <p className="text-xs text-slate-500">{leave.department}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {leave.leaveType}
                        </span>
                        {onEditRecord && (
                          <button
                            onClick={() => {
                              setSelectedDateStr(null);
                              onEditRecord(leave);
                            }}
                            className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                            title="แก้ไขรายละเอียดวันลา"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>ช่วงวันที่: {leave.startDate} ถึง {leave.endDate} ({leave.totalDays} วัน)</span>
                    </div>
                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="font-semibold text-slate-900">เหตุผล: </span>{leave.reason}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDateStr(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thai Public Holidays Reference Modal */}
      {isHolidaysModalOpen && (
        <ThaiHolidaysModal
          isOpen={isHolidaysModalOpen}
          onClose={() => setIsHolidaysModalOpen(false)}
          initialYear={year}
        />
      )}
    </div>
  );
};

