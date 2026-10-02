/**
 * Thai Official Public Holidays & Working Days Calculation Engine
 * ระบบปฏิทินวันหยุดราชการไทยและการคำนวณวันทำการตามระเบียบสำนักนายกรัฐมนตรี
 * สำหรับองค์กรปกครองส่วนท้องถิ่น (เทศบาลตำบลทุ่งช้าง)
 */

export interface ThaiHoliday {
  date: string; // YYYY-MM-DD
  name: string; // ชื่อวันหยุด
  type: 'official' | 'substitution' | 'special' | 'custom';
  description?: string;
}

// ฐานข้อมูลวันหยุดราชการไทยและวันหยุดตามประเพณี (พ.ศ. 2567 - 2571 / ค.ศ. 2024 - 2028)
// รวมวันหยุดนักขัตฤกษ์คงที่, วันหยุดทางพุทธศาสนา (วันพระใหญ่), และวันหยุดชดเชยตามประกาศ ครม.
const THAI_PUBLIC_HOLIDAYS_MAP: Record<string, { name: string; type: 'official' | 'substitution' | 'special' }> = {
  // ----------------- ปี 2567 (2024) -----------------
  '2024-01-01': { name: 'วันขึ้นปีใหม่', type: 'official' },
  '2024-01-02': { name: 'วันหยุดชดเชยวันสิ้นปี', type: 'substitution' },
  '2024-02-24': { name: 'วันมาฆบูชา', type: 'official' },
  '2024-02-26': { name: 'วันหยุดชดเชยวันมาฆบูชา', type: 'substitution' },
  '2024-04-06': { name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์ (วันจักรี)', type: 'official' },
  '2024-04-08': { name: 'วันหยุดชดเชยวันจักรี', type: 'substitution' },
  '2024-04-12': { name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ (เทศกาลสงกรานต์)', type: 'special' },
  '2024-04-13': { name: 'วันสงกรานต์ (วันผู้สูงอายุแห่งชาติ)', type: 'official' },
  '2024-04-14': { name: 'วันสงกรานต์ (วันครอบครัว)', type: 'official' },
  '2024-04-15': { name: 'วันสงกรานต์', type: 'official' },
  '2024-04-16': { name: 'วันหยุดชดเชยวันสงกรานต์', type: 'substitution' },
  '2024-05-01': { name: 'วันแรงงานแห่งชาติ', type: 'official' },
  '2024-05-04': { name: 'วันฉัตรมงคล', type: 'official' },
  '2024-05-06': { name: 'วันหยุดชดเชยวันฉัตรมงคล', type: 'substitution' },
  '2024-05-22': { name: 'วันวิสาขบูชา', type: 'official' },
  '2024-06-03': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'official' },
  '2024-07-20': { name: 'วันอาสาฬหบูชา', type: 'official' },
  '2024-07-21': { name: 'วันเข้าพรรษา', type: 'official' },
  '2024-07-22': { name: 'วันหยุดชดเชยวันอาสาฬหบูชาและวันเข้าพรรษา', type: 'substitution' },
  '2024-07-28': { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)', type: 'official' },
  '2024-07-29': { name: 'วันหยุดชดเชยวันเฉลิมพระชนมพรรษา ร.10', type: 'substitution' },
  '2024-08-12': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ', type: 'official' },
  '2024-10-13': { name: 'วันนวมินทรมหาราช (วันคล้ายวันสวรรคต ร.9)', type: 'official' },
  '2024-10-14': { name: 'วันหยุดชดเชยวันนวมินทรมหาราช', type: 'substitution' },
  '2024-10-23': { name: 'วันปิยมหาราช', type: 'official' },
  '2024-12-05': { name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ', type: 'official' },
  '2024-12-10': { name: 'วันรัฐธรรมนูญ', type: 'official' },
  '2024-12-30': { name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ', type: 'special' },
  '2024-12-31': { name: 'วันสิ้นปี', type: 'official' },

  // ----------------- ปี 2568 (2025) -----------------
  '2025-01-01': { name: 'วันขึ้นปีใหม่', type: 'official' },
  '2025-02-12': { name: 'วันมาฆบูชา', type: 'official' },
  '2025-04-06': { name: 'วันจักรี', type: 'official' },
  '2025-04-07': { name: 'วันหยุดชดเชยวันจักรี', type: 'substitution' },
  '2025-04-13': { name: 'วันสงกรานต์ (วันผู้สูงอายุแห่งชาติ)', type: 'official' },
  '2025-04-14': { name: 'วันสงกรานต์ (วันครอบครัว)', type: 'official' },
  '2025-04-15': { name: 'วันสงกรานต์', type: 'official' },
  '2025-04-16': { name: 'วันหยุดชดเชยวันสงกรานต์', type: 'substitution' },
  '2025-05-01': { name: 'วันแรงงานแห่งชาติ', type: 'official' },
  '2025-05-04': { name: 'วันฉัตรมงคล', type: 'official' },
  '2025-05-05': { name: 'วันหยุดชดเชยวันฉัตรมงคล', type: 'substitution' },
  '2025-05-11': { name: 'วันวิสาขบูชา', type: 'official' },
  '2025-05-12': { name: 'วันหยุดชดเชยวันวิสาขบูชา', type: 'substitution' },
  '2025-06-02': { name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ', type: 'special' },
  '2025-06-03': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'official' },
  '2025-07-10': { name: 'วันอาสาฬหบูชา', type: 'official' },
  '2025-07-11': { name: 'วันเข้าพรรษา', type: 'official' },
  '2025-07-28': { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)', type: 'official' },
  '2025-08-11': { name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ', type: 'special' },
  '2025-08-12': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ', type: 'official' },
  '2025-10-13': { name: 'วันนวมินทรมหาราช', type: 'official' },
  '2025-10-23': { name: 'วันปิยมหาราช', type: 'official' },
  '2025-12-05': { name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ', type: 'official' },
  '2025-12-10': { name: 'วันรัฐธรรมนูญ', type: 'official' },
  '2025-12-31': { name: 'วันสิ้นปี', type: 'official' },

  // ----------------- ปี 2569 (2026) -----------------
  '2026-01-01': { name: 'วันขึ้นปีใหม่', type: 'official' },
  '2026-01-02': { name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ (เทศกาลปีใหม่)', type: 'special' },
  '2026-03-03': { name: 'วันมาฆบูชา', type: 'official' },
  '2026-04-06': { name: 'วันจักรี', type: 'official' },
  '2026-04-13': { name: 'วันสงกรานต์ (วันผู้สูงอายุแห่งชาติ)', type: 'official' },
  '2026-04-14': { name: 'วันสงกรานต์ (วันครอบครัว)', type: 'official' },
  '2026-04-15': { name: 'วันสงกรานต์', type: 'official' },
  '2026-04-16': { name: 'วันหยุดชดเชยวันสงกรานต์', type: 'substitution' },
  '2026-05-01': { name: 'วันแรงงานแห่งชาติ', type: 'official' },
  '2026-05-04': { name: 'วันฉัตรมงคล', type: 'official' },
  '2026-05-31': { name: 'วันวิสาขบูชา', type: 'official' },
  '2026-06-01': { name: 'วันหยุดชดเชยวันวิสาขบูชา', type: 'substitution' },
  '2026-06-03': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'official' },
  '2026-07-28': { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)', type: 'official' },
  '2026-07-29': { name: 'วันอาสาฬหบูชา', type: 'official' },
  '2026-07-30': { name: 'วันเข้าพรรษา', type: 'official' },
  '2026-08-12': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ', type: 'official' },
  '2026-10-13': { name: 'วันนวมินทรมหาราช', type: 'official' },
  '2026-10-23': { name: 'วันปิยมหาราช', type: 'official' },
  '2026-12-05': { name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ', type: 'official' },
  '2026-12-07': { name: 'วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9', type: 'substitution' },
  '2026-12-10': { name: 'วันรัฐธรรมนูญ', type: 'official' },
  '2026-12-31': { name: 'วันสิ้นปี', type: 'official' },

  // ----------------- ปี 2570 (2027) -----------------
  '2027-01-01': { name: 'วันขึ้นปีใหม่', type: 'official' },
  '2027-02-21': { name: 'วันมาฆบูชา', type: 'official' },
  '2027-02-22': { name: 'วันหยุดชดเชยวันมาฆบูชา', type: 'substitution' },
  '2027-04-06': { name: 'วันจักรี', type: 'official' },
  '2027-04-13': { name: 'วันสงกรานต์ (วันผู้สูงอายุแห่งชาติ)', type: 'official' },
  '2027-04-14': { name: 'วันสงกรานต์ (วันครอบครัว)', type: 'official' },
  '2027-04-15': { name: 'วันสงกรานต์', type: 'official' },
  '2027-05-01': { name: 'วันแรงงานแห่งชาติ', type: 'official' },
  '2027-05-03': { name: 'วันหยุดชดเชยวันแรงงานแห่งชาติ', type: 'substitution' },
  '2027-05-04': { name: 'วันฉัตรมงคล', type: 'official' },
  '2027-05-20': { name: 'วันวิสาขบูชา', type: 'official' },
  '2027-06-03': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'official' },
  '2027-07-18': { name: 'วันอาสาฬหบูชา', type: 'official' },
  '2027-07-19': { name: 'วันเข้าพรรษา / วันหยุดชดเชยวันอาสาฬหบูชา', type: 'official' },
  '2027-07-28': { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)', type: 'official' },
  '2027-08-12': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ', type: 'official' },
  '2027-10-13': { name: 'วันนวมินทรมหาราช', type: 'official' },
  '2027-10-23': { name: 'วันปิยมหาราช', type: 'official' },
  '2027-10-25': { name: 'วันหยุดชดเชยวันปิยมหาราช', type: 'substitution' },
  '2027-12-05': { name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ', type: 'official' },
  '2027-12-06': { name: 'วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9', type: 'substitution' },
  '2027-12-10': { name: 'วันรัฐธรรมนูญ', type: 'official' },
  '2027-12-31': { name: 'วันสิ้นปี', type: 'official' },

  // ----------------- ปี 2571 (2028) -----------------
  '2028-01-01': { name: 'วันขึ้นปีใหม่', type: 'official' },
  '2028-01-03': { name: 'วันหยุดชดเชยวันขึ้นปีใหม่', type: 'substitution' },
  '2028-02-09': { name: 'วันมาฆบูชา', type: 'official' },
  '2028-04-06': { name: 'วันจักรี', type: 'official' },
  '2028-04-13': { name: 'วันสงกรานต์', type: 'official' },
  '2028-04-14': { name: 'วันสงกรานต์', type: 'official' },
  '2028-04-15': { name: 'วันสงกรานต์', type: 'official' },
  '2028-04-17': { name: 'วันหยุดชดเชยวันสงกรานต์', type: 'substitution' },
  '2028-05-01': { name: 'วันแรงงานแห่งชาติ', type: 'official' },
  '2028-05-04': { name: 'วันฉัตรมงคล', type: 'official' },
  '2028-05-08': { name: 'วันวิสาขบูชา', type: 'official' },
  '2028-06-03': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'official' },
  '2028-06-05': { name: 'วันหยุดชดเชยวันเฉลิมพระชนมพรรษาพระราชินี', type: 'substitution' },
  '2028-07-06': { name: 'วันอาสาฬหบูชา', type: 'official' },
  '2028-07-07': { name: 'วันเข้าพรรษา', type: 'official' },
  '2028-07-28': { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)', type: 'official' },
  '2028-08-12': { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ', type: 'official' },
  '2028-08-14': { name: 'วันหยุดชดเชยวันแม่แห่งชาติ', type: 'substitution' },
  '2028-10-13': { name: 'วันนวมินทรมหาราช', type: 'official' },
  '2028-10-23': { name: 'วันปิยมหาราช', type: 'official' },
  '2028-12-05': { name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ', type: 'official' },
  '2028-12-10': { name: 'วันรัฐธรรมนูญ', type: 'official' },
  '2028-12-11': { name: 'วันหยุดชดเชยวันรัฐธรรมนูญ', type: 'substitution' },
  '2028-12-31': { name: 'วันสิ้นปี', type: 'official' },
};

// วันหยุดประจำปีคงที่ (ทุกปี) ในกรณีที่ไม่ได้ระบุปีเฉพาะไว้ข้างต้น
const STATIC_ANNUAL_HOLIDAYS: Record<string, string> = {
  '01-01': 'วันขึ้นปีใหม่',
  '04-06': 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์ (วันจักรี)',
  '04-13': 'วันสงกรานต์ (วันผู้สูงอายุแห่งชาติ)',
  '04-14': 'วันสงกรานต์ (วันครอบครัว)',
  '04-15': 'วันสงกรานต์',
  '05-01': 'วันแรงงานแห่งชาติ',
  '05-04': 'วันฉัตรมงคล',
  '06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)',
  '08-12': 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ',
  '10-13': 'วันนวมินทรมหาราช (วันคล้ายวันสวรรคต ร.9)',
  '10-23': 'วันปิยมหาราช',
  '12-05': 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ',
  '12-10': 'วันรัฐธรรมนูญ',
  '12-31': 'วันสิ้นปี',
};

// Helper: อ่านวันหยุดพิเศษที่ผู้ใช้กำหนดเอง (Custom Local Holidays) จาก LocalStorage
export const getCustomHolidays = (): ThaiHoliday[] => {
  try {
    const data = localStorage.getItem('thungchang_custom_holidays');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading custom holidays', e);
  }
  return [];
};

// Helper: บันทึกวันหยุดพิเศษเพิ่มเติม
export const saveCustomHoliday = (holiday: ThaiHoliday) => {
  try {
    const list = getCustomHolidays().filter(h => h.date !== holiday.date);
    list.push(holiday);
    localStorage.setItem('thungchang_custom_holidays', JSON.stringify(list));
  } catch (e) {
    console.error('Error saving custom holiday', e);
  }
};

// Helper: ลบวันหยุดพิเศษ
export const deleteCustomHoliday = (dateStr: string) => {
  try {
    const list = getCustomHolidays().filter(h => h.date !== dateStr);
    localStorage.setItem('thungchang_custom_holidays', JSON.stringify(list));
  } catch (e) {
    console.error('Error deleting custom holiday', e);
  }
};

/**
 * ตรวจสอบว่าวันที่ระบุเป็นวันเสาร์หรือวันอาทิตย์หรือไม่
 */
export const isWeekend = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = อาทิตย์, 6 = เสาร์
};

/**
 * ดึงข้อมูลวันหยุดราชการไทย (ถ้ามี)
 */
export const getThaiHolidayInfo = (date: string | Date): { name: string; type: 'official' | 'substitution' | 'special' | 'custom' } | null => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${day}`;
  const monthDay = `${m}-${day}`;

  // 1. ตรวจสอบจาก Custom Holidays ก่อน
  const custom = getCustomHolidays().find(h => h.date === dateStr);
  if (custom) {
    return { name: custom.name, type: 'custom' };
  }

  // 2. ตรวจสอบจาก Map รายปี
  if (THAI_PUBLIC_HOLIDAYS_MAP[dateStr]) {
    return THAI_PUBLIC_HOLIDAYS_MAP[dateStr];
  }

  // 3. ตรวจสอบจาก Static Annual Holidays
  if (STATIC_ANNUAL_HOLIDAYS[monthDay]) {
    return {
      name: STATIC_ANNUAL_HOLIDAYS[monthDay],
      type: 'official',
    };
  }

  return null;
};

/**
 * ตรวจสอบว่าเป็นวันหยุดราชการไทยหรือไม่
 */
export const isThaiHoliday = (date: string | Date): boolean => {
  return getThaiHolidayInfo(date) !== null;
};

/**
 * ตรวจสอบว่าเป็นวันหยุดงาน (เสาร์-อาทิตย์ หรือวันหยุดราชการ) หรือไม่
 */
export const isNonWorkingDay = (date: string | Date): boolean => {
  return isWeekend(date) || isThaiHoliday(date);
};

/**
 * ตรวจสอบว่าเป็นวันทำการราชการปกติหรือไม่
 */
export const isWorkingDay = (date: string | Date): boolean => {
  return !isNonWorkingDay(date);
};

export interface DayBreakdown {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6
  dayOfWeekThai: string; // จันทร์, อังคาร...
  formattedThaiDate: string; // 15 ก.ค. 2569
  isWeekend: boolean;
  isHoliday: boolean;
  isWorkingDay: boolean;
  holidayName?: string;
  holidayType?: string;
}

export interface LeaveCalculationResult {
  startDate: string;
  endDate: string;
  totalCalendarDays: number; // จำนวนวันตามปฏิทินทั้งหมด (รวมวันหยุด)
  workingDays: number; // จำนวนวันทำการจริง (หักวันหยุดราชการและเสาร์-อาทิตย์)
  weekendDays: number; // จำนวนวันเสาร์-อาทิตย์
  officialHolidaysCount: number; // จำนวนวันหยุดราชการไทยในขอบเขตวันที่ลา
  nonWorkingDaysCount: number; // ผลรวมของวันหยุดทั้งหมด (เสาร์-อาทิตย์ + วันหยุดราชการ)
  daysBreakdown: DayBreakdown[]; // รายละเอียดในแต่ละวัน
  holidaysList: Array<{ date: string; name: string; dayThai: string }>;
  recommendedDays: number; // วันลาที่ต้องหักสิทธิคำนวณตามระเบียบ
  regulationRuleText: string; // คำอธิบายตามระเบียบสำนักนายกฯ
}

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/**
 * คำนวณแจกแจงวันทำการและวันหยุดตามวันหยุดราชการไทยอย่างแม่นยำ
 * ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555 และระเบียบพนักงานส่วนท้องถิ่น
 */
export const calculateLeaveBreakdown = (
  startDateStr: string,
  endDateStr: string,
  leaveType: string = 'ลาพักผ่อน'
): LeaveCalculationResult => {
  if (!startDateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    startDateStr = todayStr;
  }
  if (!endDateStr) {
    endDateStr = startDateStr;
  }

  // Ensure start <= end
  let start = new Date(startDateStr + 'T00:00:00');
  let end = new Date(endDateStr + 'T00:00:00');
  if (isNaN(start.getTime())) start = new Date();
  if (isNaN(end.getTime())) end = start;

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const daysBreakdown: DayBreakdown[] = [];
  const holidaysList: Array<{ date: string; name: string; dayThai: string }> = [];

  let current = new Date(start);
  let workingDaysCount = 0;
  let weekendDaysCount = 0;
  let officialHolidaysCount = 0;

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const dayOfWeek = current.getDay();
    const dayOfWeekThai = `วัน${THAI_DAYS[dayOfWeek]}`;
    const formattedThaiDate = `${current.getDate()} ${THAI_MONTHS_SHORT[current.getMonth()]} ${y + 543}`;

    const weekend = isWeekend(current);
    const holidayInfo = getThaiHolidayInfo(current);
    const isHoliday = holidayInfo !== null;
    const isWork = !weekend && !isHoliday;

    if (weekend) weekendDaysCount++;
    if (isHoliday && !weekend) {
      // นับวันหยุดราชการเฉพาะวันจันทร์-ศุกร์ เพื่อไม่ให้นับซ้ำซ้อนกับเสาร์อาทิตย์
      officialHolidaysCount++;
    } else if (isHoliday && weekend) {
      // วันหยุดที่ตรงกับเสาร์อาทิตย์
      officialHolidaysCount++;
    }

    if (isWork) {
      workingDaysCount++;
    }

    if (isHoliday && holidayInfo) {
      holidaysList.push({
        date: dateStr,
        name: holidayInfo.name,
        dayThai: `${dayOfWeekThai}ที่ ${formattedThaiDate}`,
      });
    }

    daysBreakdown.push({
      dateStr,
      dayOfWeek,
      dayOfWeekThai,
      formattedThaiDate,
      isWeekend: weekend,
      isHoliday,
      isWorkingDay: isWork,
      holidayName: holidayInfo?.name,
      holidayType: holidayInfo?.type,
    });

    // Advance 1 day
    current.setDate(current.getDate() + 1);
  }

  const totalCalendarDays = daysBreakdown.length;
  const nonWorkingDaysCount = totalCalendarDays - workingDaysCount;

  // กฎระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลา:
  // - ลาพักผ่อน: ให้นับเฉพาะ "วันทำการ" (ห้ามหักวันหยุดราชการ/เสาร์-อาทิตย์)
  // - ลากิจส่วนตัว / ลาป่วยทั่วไป: นับเฉพาะวันทำการ
  // - ลาคลอดบุตร / ลาอุปสมบท: ให้นับวันหยุดราชการรวมด้วย (นับวันปฏิทินต่อเนื่อง)
  let recommendedDays = workingDaysCount;
  let regulationRuleText = 'นับเฉพาะวันทำการ (ไม่รวมวันเสาร์-อาทิตย์และวันหยุดราชการ)';

  if (leaveType === 'ลาคลอดบุตร' || leaveType === 'ลาอุปสมบท') {
    recommendedDays = totalCalendarDays;
    regulationRuleText = 'นับรวมวันหยุดราชการและวันเสาร์-อาทิตย์ (นับวันปฏิทินต่อเนื่องตามระเบียบ)';
  } else if (leaveType === 'ลาพักผ่อน') {
    recommendedDays = workingDaysCount;
    regulationRuleText = 'การลาพักผ่อนนับเฉพาะวันทำการตามระเบียบสำนักนายกรัฐมนตรี (ไม่นับวันหยุดราชการ)';
  } else {
    // ลาป่วย / ลากิจส่วนตัว / อื่นๆ
    recommendedDays = workingDaysCount;
    regulationRuleText = 'นับเฉพาะวันปฏิบัติราชการปกติ (วันทำการ)';
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalCalendarDays,
    workingDays: workingDaysCount,
    weekendDays: weekendDaysCount,
    officialHolidaysCount,
    nonWorkingDaysCount,
    daysBreakdown,
    holidaysList,
    recommendedDays: Math.max(1, recommendedDays),
    regulationRuleText,
  };
};

/**
 * ดึงรายการวันหยุดราชการไทยทั้งหมดในรอบปี พ.ศ. ที่ระบุ
 */
export const getHolidaysForYear = (yearCE: number): Array<{ date: string; name: string; type: string; dayThai: string }> => {
  const result: Array<{ date: string; name: string; type: string; dayThai: string }> = [];

  // 1. จาก Map รายปี
  Object.entries(THAI_PUBLIC_HOLIDAYS_MAP).forEach(([dateStr, info]) => {
    if (dateStr.startsWith(`${yearCE}-`)) {
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeekThai = `วัน${THAI_DAYS[d.getDay()]}`;
      const formatted = `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${yearCE + 543}`;
      result.push({
        date: dateStr,
        name: info.name,
        type: info.type,
        dayThai: `${dayOfWeekThai} (${formatted})`,
      });
    }
  });

  // 2. Custom holidays
  getCustomHolidays().forEach(h => {
    if (h.date.startsWith(`${yearCE}-`)) {
      if (!result.some(r => r.date === h.date)) {
        const d = new Date(h.date + 'T00:00:00');
        const dayOfWeekThai = `วัน${THAI_DAYS[d.getDay()]}`;
        const formatted = `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${yearCE + 543}`;
        result.push({
          date: h.date,
          name: h.name,
          type: 'custom',
          dayThai: `${dayOfWeekThai} (${formatted})`,
        });
      }
    }
  });

  // 3. Static annual if not already included
  Object.entries(STATIC_ANNUAL_HOLIDAYS).forEach(([monthDay, name]) => {
    const dateStr = `${yearCE}-${monthDay}`;
    if (!result.some(r => r.date === dateStr)) {
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeekThai = `วัน${THAI_DAYS[d.getDay()]}`;
      const formatted = `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${yearCE + 543}`;
      result.push({
        date: dateStr,
        name,
        type: 'official',
        dayThai: `${dayOfWeekThai} (${formatted})`,
      });
    }
  });

  // Sort by date
  return result.sort((a, b) => a.date.localeCompare(b.date));
};
