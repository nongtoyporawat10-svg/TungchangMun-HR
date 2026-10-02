import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen
} from 'lucide-react';
import { 
  getHolidaysForYear, 
  saveCustomHoliday, 
  deleteCustomHoliday,
  ThaiHoliday 
} from '../utils/thaiHolidays';

export const HolidayManagementView: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New Custom Holiday Form
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const yearBE = selectedYear + 543;

  const holidays = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshTrigger; // Trigger recalculation
    const all = getHolidaysForYear(selectedYear);
    if (!searchTerm.trim()) return all;
    return all.filter(h => 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.date.includes(searchTerm) ||
      h.dayThai.includes(searchTerm)
    );
  }, [selectedYear, searchTerm, refreshTrigger]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate || !customName.trim()) {
      alert('กรุณากรอกวันที่และชื่อวันหยุด');
      return;
    }

    const newH: ThaiHoliday = {
      date: customDate,
      name: customName.trim(),
      type: 'custom',
      description: customDesc.trim() || undefined,
    };

    saveCustomHoliday(newH);
    setCustomDate('');
    setCustomName('');
    setCustomDesc('');
    setIsAddCustomOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteCustom = (dateStr: string) => {
    if (window.confirm(`ต้องการลบวันหยุดพิเศษวันที่ ${dateStr} หรือไม่?`)) {
      deleteCustomHoliday(dateStr);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-amber-900/20 shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>จัดการปฏิทินวันหยุดราชการ</span>
                <span className="text-xs sm:text-sm bg-amber-100 text-amber-900 font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  พ.ศ. {yearBE}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                กำหนดวันหยุดเทศกาลและวันหยุดชดเชยเพื่อให้ระบบคำนวณวันลาได้อย่างถูกต้อง
              </p>
            </div>
          </div>
        </div>

        {/* Regulation Banner */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3 text-sm text-blue-900">
          <BookOpen className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">หลักเกณฑ์การนับวันลาของข้าราชการ/พนักงานเทศบาล:</span>
            <p className="mt-1 text-blue-800 leading-relaxed">
              ระบบตรวจสอบวันลาจะไม่นับรวมวันหยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์โดยอัตโนมัติ สำหรับการลาพักผ่อนและลากิจส่วนตัวให้นับเฉพาะ <strong className="underline">"วันทำการ"</strong> 
              ส่วนการลาคลอดบุตรและลาอุปสมบทระบบจะนับรวมวันหยุดราชการตามระเบียบ
            </p>
          </div>
        </div>

        {/* Year Selector & Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="p-2 hover:bg-white rounded-xl text-slate-700 transition-all cursor-pointer shadow-sm"
              title="ปีก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-base font-bold text-slate-800 w-32 text-center">
              พ.ศ. {yearBE}
            </span>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="p-2 hover:bg-white rounded-xl text-slate-700 transition-all cursor-pointer shadow-sm"
              title="ปีถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อวันหยุด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddCustomOpen(!isAddCustomOpen)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวันหยุดพิเศษ</span>
            </button>
          </div>
        </div>

        {/* Add Custom Holiday Form */}
        {isAddCustomOpen && (
          <form onSubmit={handleAddCustom} className="mt-6 p-5 sm:p-6 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <h4 className="text-sm sm:text-base font-bold text-amber-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>กำหนดวันหยุดราชการเพิ่มเติมประจำปี</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="text-amber-700 hover:text-amber-950 text-sm font-bold bg-amber-200/50 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่หยุด *</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อวันหยุด *</label>
                <input
                  type="text"
                  placeholder="เช่น วันหยุดประเพณี..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุ/อ้างอิง (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น ตามประกาศเทศบาลตำบลทุ่งช้าง..."
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                บันทึกวันหยุด
              </button>
            </div>
          </form>
        )}

        {/* Holidays List Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              ไม่พบรายการวันหยุดที่ตรงกับเงื่อนไขค้นหา
            </div>
          ) : (
            holidays.map((h, idx) => {
              const isCustom = h.type === 'custom';
              const isSub = h.type === 'substitution';
              const isSpecial = h.type === 'special';

              return (
                <div
                  key={`${h.date}-${idx}`}
                  className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all hover:shadow-md ${
                    isCustom 
                      ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300' 
                      : isSpecial
                      ? 'bg-purple-50/60 border-purple-200 hover:border-purple-300'
                      : isSub 
                      ? 'bg-sky-50/60 border-sky-200 hover:border-sky-300' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                    isCustom 
                      ? 'bg-amber-500 text-white' 
                      : isSpecial
                      ? 'bg-purple-500 text-white'
                      : isSub 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-rose-500 text-white'
                  }`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isCustom && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                          กำหนดเอง
                        </span>
                      )}
                      {isSub && (
                        <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-md font-bold">
                          วันหยุดชดเชย
                        </span>
                      )}
                      {isSpecial && (
                        <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                          วันหยุดกรณีพิเศษ
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{h.name}</h4>
                    <p className="text-xs font-medium text-slate-500">
                      {h.dayThai}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {h.date}
                    </p>
                  </div>

                  {isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(h.date)}
                      className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                      title="ลบวันหยุดพิเศษนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> วันหยุดปกติ
            <span className="w-2 h-2 rounded-full bg-sky-500 ml-2"></span> วันหยุดชดเชย
            <span className="w-2 h-2 rounded-full bg-purple-500 ml-2"></span> วันหยุดพิเศษ
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-2"></span> เทศบาลกำหนดเอง
          </div>
          <span className="font-bold">รวมทั้งหมด {holidays.length} วันหยุดในปี พ.ศ. {yearBE}</span>
        </div>
      </div>
    </div>
  );
};
