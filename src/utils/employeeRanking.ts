import { Employee, PersonnelType } from '../types';

export type CareerTrackType =
  | 'บริหารท้องถิ่น'
  | 'อำนวยการท้องถิ่น'
  | 'วิชาการ'
  | 'ทั่วไป'
  | 'ข้าราชการหรือพนักงานครูส่วนท้องถิ่น'
  | 'ลูกจ้างประจำ'
  | 'พนักงานจ้าง';

export const ORDERED_CAREER_TRACKS: CareerTrackType[] = [
  'บริหารท้องถิ่น',
  'อำนวยการท้องถิ่น',
  'วิชาการ',
  'ทั่วไป',
  'ข้าราชการหรือพนักงานครูส่วนท้องถิ่น',
  'ลูกจ้างประจำ',
  'พนักงานจ้าง',
];

// Position hierarchy definitions strictly according to government standards and user prompt
const POSITIONS_BY_TRACK: Record<CareerTrackType, string[]> = {
  'บริหารท้องถิ่น': [
    'นักบริหารงานท้องถิ่น',
    'ปลัดเทศบาล',
    'รองปลัดเทศบาล',
    'นายกเทศมนตรี',
    'รองนายกเทศมนตรี'
  ],
  'อำนวยการท้องถิ่น': [
    'นักบริหารงานทั่วไป',
    'หัวหน้าสำนักปลัด',
    'นักบริหารงานการคลัง',
    'ผู้อำนวยการกองคลัง',
    'นักบริหารงานช่าง',
    'ผู้อำนวยการกองช่าง',
    'นักบริหารงานสาธารณสุขและสิ่งแวดล้อม',
    'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
    'นักบริหารงานสวัสดิการสังคม',
    'ผู้อำนวยการกองสวัสดิการสังคม',
    'นักบริหารงานการศึกษา',
    'ผู้อำนวยการกองการศึกษา',
    'นักบริหารงานยุทธศาสตร์',
    'ผู้อำนวยการกอง'
  ],
  'วิชาการ': [
    'นักจัดการงานทั่วไป',
    'นักทรัพยากรบุคคล',
    'นักวิเคราะห์นโยบายและแผน',
    'นิติกร',
    'นักวิชาการเงินและบัญชี',
    'นักวิชาการคลัง',
    'นักวิชาการจัดเก็บรายได้',
    'นักวิชาการพัสดุ',
    'นักวิชาการตรวจสอบภายใน',
    'นักวิชาการสาธารณสุข',
    'พยาบาลวิชาชีพ',
    'นักวิชาการสุขาภิบาล',
    'นักวิชาการสิ่งแวดล้อม',
    'นายสัตวแพทย์',
    'นายสัตว์แพทย์',
    'วิศวกรรมโยธา',
    'วิศวกรโยธา',
    'วิศวกร',
    'นักจัดการงานช่าง',
    'นักพัฒนาชุมชน',
    'นักจัดการงานเทศกิจ',
    'นักจัดการงานป้องกันและบรรเทาสาธารณภัย',
    'นักจัดการงานทะเบียนและบัตร',
    'สถาปนิก',
    'นักวิชาการคอมพิวเตอร์',
    'นักวิชาการศึกษา'
  ],
  'ทั่วไป': [
    'เจ้าพนักงานธุรการ',
    'เจ้าพนักงานการเงินและบัญชี',
    'เจ้าพนักงานพัสดุ',
    'เจ้าพนักงานสาธารสุข',
    'เจ้าพนักงานสาธารณสุข',
    'เจ้าพนักงานสุขาภิบาล',
    'เจ้าพนักงานทันตสาธารณสุข',
    'นายช่างโยธา',
    'นายช่างเขียนแบบ',
    'เจ้าพนักงานพัฒนาชุมชน',
    'เจ้าพนักงานเทศกิจ',
    'เจ้าพนักงานทะเบียนและบัตร',
    'เจ้าพนักงานป้องกันและบรรเทาสาธารณภัย',
    'เจ้าพนักงานจัดเก็บรายได้',
    'นายช่างสำรวจ',
    'นายช่างไฟฟ้า',
    'นายช่างเครื่องกล'
  ],
  'ข้าราชการหรือพนักงานครูส่วนท้องถิ่น': [
    'ครู',
    'ครูผู้ช่วย',
    'พนักงานครู',
    'ศึกษานิเทศก์'
  ],
  'ลูกจ้างประจำ': [
    'ลูกจ้างประจำ'
  ],
  'พนักงานจ้าง': [
    'พนักงานจ้างตามภารกิจ',
    'พนักงานจ้างทั่วไป',
    'ผู้ช่วยเจ้าพนักงาน',
    'ผู้ช่วยนักวิชาการ',
    'คนงาน',
    'พนักงานขับรถยนต์',
    'นักการภารโรง'
  ]
};

/**
 * Determine the career track of an employee based on their personnel type and position.
 */
export function getEmployeeCareerTrack(emp: Pick<Employee, 'position' | 'personnelType'>): CareerTrackType {
  const pos = (emp.position || '').trim();
  const type = (emp.personnelType || '') as PersonnelType;

  // 1. Check personnelType overrides first for non-civil servants
  if (type === 'ลูกจ้างประจำ') {
    return 'ลูกจ้างประจำ';
  }
  if (type === 'พนักงานจ้างตามภารกิจ' || type === 'พนักงานจ้างทั่วไป') {
    return 'พนักงานจ้าง';
  }

  // 2. Check Teacher track
  if (
    pos.startsWith('ครู') ||
    pos.includes('พนักงานครู') ||
    pos.includes('ศึกษานิเทศก์') ||
    type === ('ข้าราชการครู' as any)
  ) {
    return 'ข้าราชการหรือพนักงานครูส่วนท้องถิ่น';
  }

  // 3. Check Executive Track (บริหารท้องถิ่น)
  if (
    pos.includes('นักบริหารงานท้องถิ่น') ||
    pos.includes('ปลัดเทศบาล') ||
    pos.includes('รองปลัดเทศบาล') ||
    pos.includes('นายกเทศมนตรี')
  ) {
    return 'บริหารท้องถิ่น';
  }

  // 4. Check Directorial Track (อำนวยการท้องถิ่น)
  if (
    pos.includes('นักบริหารงานทั่วไป') ||
    pos.includes('นักบริหารงานการคลัง') ||
    pos.includes('นักบริหารงานช่าง') ||
    pos.includes('นักบริหารงานสาธารณสุข') ||
    pos.includes('นักบริหารงานสวัสดิการ') ||
    pos.includes('นักบริหารงานการศึกษา') ||
    pos.includes('หัวหน้าสำนักปลัด') ||
    (pos.includes('ผู้อำนวยการ') && !pos.includes('โรงเรียน'))
  ) {
    return 'อำนวยการท้องถิ่น';
  }

  // 5. Check Professional Track (วิชาการ)
  // Keywords like นัก... (except นักบริหารงาน which was matched above), พยาบาล, นายสัตวแพทย์, วิศวกร, นิติกร
  if (
    pos.startsWith('นัก') ||
    pos.startsWith('นิติกร') ||
    pos.startsWith('พยาบาล') ||
    pos.startsWith('นายสัตวแพทย์') ||
    pos.startsWith('นายสัตว์แพทย์') ||
    pos.startsWith('วิศวกรรม') ||
    pos.startsWith('วิศวกร') ||
    pos.startsWith('สถาปนิก') ||
    pos.includes('วิชาการ')
  ) {
    return 'วิชาการ';
  }

  // 6. Check General Operational Track (ทั่วไป)
  // Keywords like เจ้าพนักงาน..., นายช่าง...
  if (
    pos.startsWith('เจ้าพนักงาน') ||
    pos.startsWith('นายช่าง') ||
    pos.includes('ช่าง') ||
    pos.includes('เจ้าหน้าที่')
  ) {
    return 'ทั่วไป';
  }

  // Fallback based on personnelType
  if (type === 'ข้าราชการ') {
    return 'วิชาการ';
  }

  return 'พนักงานจ้าง';
}

/**
 * Returns the track order number (0 to 6) for sorting
 */
export function getCareerTrackRank(track: CareerTrackType): number {
  switch (track) {
    case 'บริหารท้องถิ่น':
      return 0;
    case 'อำนวยการท้องถิ่น':
      return 1;
    case 'วิชาการ':
      return 2;
    case 'ทั่วไป':
      return 3;
    case 'ข้าราชการหรือพนักงานครูส่วนท้องถิ่น':
      return 4;
    case 'ลูกจ้างประจำ':
      return 5;
    case 'พนักงานจ้าง':
      return 6;
    default:
      return 99;
  }
}

/**
 * Returns the position order within its track (0, 1, 2, ...)
 */
export function getPositionRankInTrack(position: string, track: CareerTrackType): number {
  const cleanPos = (position || '').trim();
  const list = POSITIONS_BY_TRACK[track] || [];

  for (let i = 0; i < list.length; i++) {
    if (cleanPos.includes(list[i]) || list[i].includes(cleanPos)) {
      return i;
    }
  }
  return 900;
}

/**
 * Compare two employees based on government career track & position hierarchy:
 * 1. Career Track (บริหารท้องถิ่น > อำนวยการท้องถิ่น > วิชาการ > ทั่วไป > ครู > ลูกจ้างประจำ > พนักงานจ้าง)
 * 2. Position rank within that track
 * 3. Contract sub-type (พนักงานจ้างตามภารกิจ > พนักงานจ้างทั่วไป)
 * 4. Alphabetical name
 */
export function compareEmployeesByRank(a: Employee, b: Employee): number {
  const trackA = getEmployeeCareerTrack(a);
  const trackB = getEmployeeCareerTrack(b);

  const trackRankA = getCareerTrackRank(trackA);
  const trackRankB = getCareerTrackRank(trackB);

  if (trackRankA !== trackRankB) {
    return trackRankA - trackRankB;
  }

  // Same track, compare position rank within track
  const posRankA = getPositionRankInTrack(a.position, trackA);
  const posRankB = getPositionRankInTrack(b.position, trackB);

  if (posRankA !== posRankB) {
    return posRankA - posRankB;
  }

  // If in 'พนักงานจ้าง', prioritize 'พนักงานจ้างตามภารกิจ' before 'พนักงานจ้างทั่วไป'
  if (trackA === 'พนักงานจ้าง') {
    if (a.personnelType === 'พนักงานจ้างตามภารกิจ' && b.personnelType === 'พนักงานจ้างทั่วไป') {
      return -1;
    }
    if (a.personnelType === 'พนักงานจ้างทั่วไป' && b.personnelType === 'พนักงานจ้างตามภารกิจ') {
      return 1;
    }
  }

  // Default to Thai alphabetical name comparison
  return (a.name || '').localeCompare(b.name || '', 'th');
}

/**
 * Sort an array of employees according to government career track hierarchy
 */
export function sortEmployeesByCareerTrack<T extends Employee>(employees: T[]): T[] {
  return [...employees].sort(compareEmployeesByRank);
}
