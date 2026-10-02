import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Info, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen
} from 'lucide-react';
import { 
  getHolidaysForYear, 
  getCustomHolidays, 
  saveCustomHoliday, 
  deleteCustomHoliday,
  ThaiHoliday 
} from '../utils/thaiHolidays';

interface ThaiHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: number;
}

export const ThaiHolidaysModal: React.FC<ThaiHolidaysModalProps> = ({
  isOpen,
  onClose,
  initialYear = 2026,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-amber-900/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>ปฏิทินวันหยุดราชการไทย</span>
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded-full">
                  พ.ศ. {yearBE}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ฐานข้อมูลวันหยุดนักขัตฤกษ์และวันหยุดชดเชยตามประกาศสำนักนายกรัฐมนตรี
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

        {/* Regulation Banner */}
        <div className="mt-4 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start space-x-3 text-xs text-blue-900">
          <BookOpen className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">หลักเกณฑ์การนับวันลาของข้าราชการ/พนักงานเทศบาล:</span>
            <p className="mt-0.5 text-blue-800 leading-relaxed">
              การลาพักผ่อนและลากิจส่วนตัวให้นับเฉพาะ <strong className="underline">"วันทำการ"</strong> (ไม่นับวันเสาร์-อาทิตย์และวันหยุดราชการ) 
              ส่วนการลาคลอดบุตรและลาอุปสมบทให้นับรวมวันหยุดราชการด้วย
            </p>
          </div>
        </div>

        {/* Year Selector & Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-all cursor-pointer"
              title="ปีก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-800">
              พ.ศ. {yearBE} ({selectedYear})
            </span>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-all cursor-pointer"
              title="ปีถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อวันหยุด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddCustomOpen(!isAddCustomOpen)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ วันหยุดพิเศษ</span>
            </button>
          </div>
        </div>

        {/* Add Custom Holiday Form */}
        {isAddCustomOpen && (
          <form onSubmit={handleAddCustom} className="mt-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>กำหนดวันหยุดพิเศษ/วันหยุดเทศบาลเพิ่มเติม</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="text-amber-800 hover:text-amber-950 text-xs font-bold"
              >
                ปิด
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">วันที่หยุด *</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อวันหยุด *</label>
                <input
                  type="text"
                  placeholder="เช่น วันหยุดประเพณีแข่งเรือทุ่งช้าง"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">หมายเหตุ/คำอธิบาย (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น ตามประกาศเทศบาลตำบลทุ่งช้าง / มติ ครม. พิเศษ"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                บันทึกวันหยุด
              </button>
            </div>
          </form>
        )}

        {/* Holidays List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2 max-h-[50vh]">
          {holidays.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
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
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isCustom 
                      ? 'bg-amber-50/60 border-amber-200' 
                      : isSpecial
                      ? 'bg-purple-50/60 border-purple-200'
                      : isSub 
                      ? 'bg-sky-50/60 border-sky-200' 
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isCustom 
                        ? 'bg-amber-600 text-white' 
                        : isSpecial
                        ? 'bg-purple-600 text-white'
                        : isSub 
                        ? 'bg-sky-600 text-white' 
                        : 'bg-rose-600 text-white'
                    }`}>
                      <CalendarDays className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{h.name}</span>
                        {isCustom && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full font-bold">
                            กำหนดเอง
                          </span>
                        )}
                        {isSub && (
                          <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.2 rounded-full font-bold">
                            วันหยุดชดเชย
                          </span>
                        )}
                        {isSpecial && (
                          <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.2 rounded-full font-bold">
                            วันหยุดกรณีพิเศษ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {h.dayThai} ({h.date})
                      </p>
                    </div>
                  </div>

                  {isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(h.date)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
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
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>รวมทั้งหมด {holidays.length} วันหยุดในปี พ.ศ. {yearBE}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
