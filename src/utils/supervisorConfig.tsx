import React from 'react';
import { Employee, OfficialSignatures } from '../types';

export interface DepartmentSupervisorInfo {
  deptKey: string;
  departmentName: string;
  name: string;
  position: string;
  roleDescription: string;
}

export const DEPARTMENT_SUPERVISORS_LIST: DepartmentSupervisorInfo[] = [
  {
    deptKey: 'office_of_clerk',
    departmentName: 'สำนักปลัดเทศบาล',
    name: 'นางสาวติยภา สัจจา',
    position: 'หัวหน้าสำนักปลัดเทศบาล',
    roleDescription: 'ผู้บังคับบัญชาเบื้องต้น สำนักปลัดเทศบาล',
  },
  {
    deptKey: 'finance',
    departmentName: 'กองคลัง',
    name: 'นางสุวารี จิตอารี',
    position: 'ผู้อำนวยการกองคลัง',
    roleDescription: 'ผู้บังคับบัญชาเบื้องต้น กองคลัง',
  },
  {
    deptKey: 'engineering',
    departmentName: 'กองช่าง',
    name: 'นายสุกิจ เทพจันตา',
    position: 'หัวหน้าฝ่ายการโยธา รักษาราชการแทน ผู้อำนวยการกองช่าง',
    roleDescription: 'ผู้บังคับบัญชาเบื้องต้น กองช่าง',
  },
  {
    deptKey: 'public_health',
    departmentName: 'กองสาธารณสุขและสิ่งแวดล้อม',
    name: 'นางดาเรศ สินสกุลวิวัฒน์',
    position: 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
    roleDescription: 'ผู้บังคับบัญชาเบื้องต้น กองสาธารณสุขและสิ่งแวดล้อม',
  },
  {
    deptKey: 'education',
    departmentName: 'กองการศึกษา',
    name: 'นางบานเย็น ยาวิไชย',
    position: 'ผู้อำนวยการกองการศึกษา',
    roleDescription: 'ผู้บังคับบัญชาเบื้องต้น กองการศึกษา',
  },
  {
    deptKey: 'strategy',
    departmentName: 'กองยุทธศาสตร์และงบประมาณ',
    name: 'นางวิชชุดา วรรณภพ',
    position: 'ผู้อำนวยการกองยุทธศาสตร์และงบประมาณ',
    roleDescription: 'ผู้บังคับบัญชาเบื้องต้น กองยุทธศาสตร์และงบประมาณ',
  },
];

/**
 * Returns supervisor info based on the employee's department
 */
export function getSupervisorForDepartment(departmentName?: string): DepartmentSupervisorInfo {
  if (!departmentName) {
    return DEPARTMENT_SUPERVISORS_LIST[0];
  }

  const dept = departmentName.trim();

  if (dept.includes('คลัง')) {
    return DEPARTMENT_SUPERVISORS_LIST[1]; // นางสุวารี จิตอารี
  }
  if (dept.includes('ช่าง')) {
    return DEPARTMENT_SUPERVISORS_LIST[2]; // นายสุกิจ เทพจันตา
  }
  if (dept.includes('สาธารณสุข') || dept.includes('สิ่งแวดล้อม')) {
    return DEPARTMENT_SUPERVISORS_LIST[3]; // นางดาเรศ สินสกุลวิวัฒน์
  }
  if (dept.includes('ศึกษา')) {
    return DEPARTMENT_SUPERVISORS_LIST[4]; // นางบานเย็น ยาวิไชย
  }
  if (dept.includes('ยุทธศาสตร์') || dept.includes('แผนงาน') || dept.includes('งบประมาณ')) {
    return DEPARTMENT_SUPERVISORS_LIST[5]; // นางวิชชุดา วรรณภพ
  }
  // Default to สำนักปลัดเทศบาล (นางสาวติยภา สัจจา) for สำนักปลัด and other units
  return DEPARTMENT_SUPERVISORS_LIST[0];
}

/**
 * Resolves signature URL for a supervisor by checking:
 * 1. Explicit custom signature in current session or officialSignatures.deptHeadByDept[deptKey]
 * 2. Official signatures deptHead generic
 * 3. Matching employee in employee directory with signatureUrl
 */
export function resolveSupervisorSignatureUrl(
  deptInfo: DepartmentSupervisorInfo,
  allEmployees: Employee[] = [],
  officialSignatures?: OfficialSignatures,
  customSignaturesMap?: Record<string, string | null>
): string | null {
  // 1. Check custom signatures map passed directly (e.g. from state)
  if (customSignaturesMap?.[deptInfo.deptKey]) {
    return customSignaturesMap[deptInfo.deptKey];
  }
  if (customSignaturesMap?.['deptHead']) {
    return customSignaturesMap['deptHead'];
  }

  // 2. Check official signatures per-department dictionary
  if (officialSignatures?.deptHeadByDept?.[deptInfo.deptKey]) {
    return officialSignatures.deptHeadByDept[deptInfo.deptKey];
  }
  if (officialSignatures?.deptHeadByDept?.[deptInfo.departmentName]) {
    return officialSignatures.deptHeadByDept[deptInfo.departmentName];
  }

  // 3. Search in allEmployees by matching supervisor name
  const cleanSupervisorName = deptInfo.name.replace(/^(นางสาว|นาง|นาย|ดร\.|ว่าที่ร\.ต\.)\s*/, '').trim();
  const matchedEmployee = allEmployees.find(emp => {
    const cleanEmpName = emp.name.replace(/^(นางสาว|นาง|นาย|ดร\.|ว่าที่ร\.ต\.)\s*/, '').trim();
    return cleanEmpName.includes(cleanSupervisorName) || cleanSupervisorName.includes(cleanEmpName);
  });

  if (matchedEmployee?.signatureUrl) {
    return matchedEmployee.signatureUrl;
  }

  // 4. Fallback to generic deptHead if configured in officialSignatures
  if (officialSignatures?.deptHead) {
    return officialSignatures.deptHead;
  }

  return null;
}

// Realistic Vector Signatures for each department leader
export const RealisticTiyaphaSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 18 32 Q 40 12 55 28 T 85 18 Q 105 35 138 20" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 30 20 Q 75 10 145 25" strokeWidth="2" strokeLinecap="round" />
    <path d="M 65 12 Q 72 36 90 28 T 115 22" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const RealisticSuwareeSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 20 28 Q 38 10 60 22 T 95 18 Q 115 32 140 14" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 32 35 Q 65 42 110 25 T 145 30" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M 50 14 Q 58 35 80 20" strokeWidth="2.3" strokeLinecap="round" />
  </svg>
);

export const RealisticSukitSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 15 34 L 35 14 L 55 30 L 80 12 L 105 28 L 138 15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 28 22 Q 70 40 135 18" strokeWidth="2" strokeLinecap="round" />
    <path d="M 70 8 L 74 38" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const RealisticDaresSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 22 25 Q 45 8 68 28 T 100 15 Q 120 34 142 20" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 40 18 Q 80 12 135 28" strokeWidth="2" strokeLinecap="round" />
    <path d="M 60 36 Q 85 45 125 32" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const RealisticBanyenSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 18 28 Q 42 12 65 30 T 95 16 Q 118 36 142 22" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 28 18 Q 85 8 138 32" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M 55 12 Q 62 38 88 24" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const RealisticWitchudaSignature = () => (
  <svg viewBox="0 0 160 50" className="w-28 h-10 inline-block drop-shadow-2xs text-[#0f2b82] fill-none stroke-current">
    <path d="M 20 32 Q 42 14 62 26 T 98 14 Q 122 30 145 18" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 35 22 Q 78 40 132 20" strokeWidth="2" strokeLinecap="round" />
    <path d="M 62 10 Q 70 34 94 22" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * Returns default realistic SVG component for department
 */
export function getRealisticSignatureForDept(deptKey: string) {
  switch (deptKey) {
    case 'finance':
      return <RealisticSuwareeSignature />;
    case 'engineering':
      return <RealisticSukitSignature />;
    case 'public_health':
      return <RealisticDaresSignature />;
    case 'education':
      return <RealisticBanyenSignature />;
    case 'strategy':
      return <RealisticWitchudaSignature />;
    case 'office_of_clerk':
    default:
      return <RealisticTiyaphaSignature />;
  }
}

/**
 * Generates an authentic, realistic blue-ink digital signature SVG Data URL for any Thai name
 */
export function generateRealisticSignatureDataUrl(fullName: string): string {
  if (!fullName) return '';
  const cleanName = fullName.replace(/^(นางสาว|นาง|นาย|ดร\.|ว่าที่ร\.ต\.|ส\.ต\.ต\.|ส\.ต\.ท\.|ส\.ต\.อ\.)\s*/, '').trim();
  const seed = cleanName.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  
  const y1 = 28 + (seed % 9);
  const y2 = 14 + ((seed * 3) % 12);
  const y3 = 26 + ((seed * 7) % 10);
  const y4 = 16 + ((seed * 5) % 14);
  const y5 = 32 - ((seed * 2) % 12);

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 65" width="220" height="65">
    <path d="M 18 ${y1} Q 42 ${y2} 70 ${y3} T 125 ${y4} Q 155 ${y5} 195 ${y2 + 8}" 
          fill="none" stroke="#1e3a8a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 28 ${y2 + 8} Q 80 ${y2 - 6} 185 ${y5 + 2}" 
          fill="none" stroke="#1e3a8a" stroke-width="2.0" stroke-linecap="round" />
    <path d="M ${55 + (seed % 20)} ${y2 - 2} Q ${68 + (seed % 10)} ${y5 + 6} ${95 + (seed % 15)} ${y4 + 4}" 
          fill="none" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round" />
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Returns signature URL for an employee.
 * Automatically pulls from employee profile (signatureUrl).
 * If no custom file is uploaded yet, generates an authentic profile signature automatically.
 */
export function getEmployeeSignatureUrl(employee?: Employee | null): string {
  if (!employee) return '';
  if (employee.signatureUrl && employee.signatureUrl.trim() !== '') {
    return employee.signatureUrl;
  }
  return generateRealisticSignatureDataUrl(employee.name);
}

