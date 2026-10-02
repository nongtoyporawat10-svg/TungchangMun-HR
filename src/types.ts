export type Department = 
  | 'สำนักปลัดเทศบาล'
  | 'สำนักปลัด' 
  | 'กองคลัง' 
  | 'กองช่าง' 
  | 'กองสาธารณสุขและสิ่งแวดล้อม' 
  | 'กองการศึกษา' 
  | 'กองยุทธศาสตร์และแผนงาน'
  | 'กองยุทธศาสตร์และงบประมาณ'
  | 'หน่วยตรวจสอบภายใน';

export const ORDERED_DEPARTMENTS: Department[] = [
  'สำนักปลัดเทศบาล',
  'กองคลัง',
  'กองช่าง',
  'กองสาธารณสุขและสิ่งแวดล้อม',
  'กองการศึกษา',
  'กองยุทธศาสตร์และแผนงาน',
  'หน่วยตรวจสอบภายใน',
];

export const getDepartmentOrderIndex = (dept: string): number => {
  if (!dept) return 99;
  if (dept.includes('สำนักปลัด')) return 0;
  if (dept.includes('คลัง')) return 1;
  if (dept.includes('ช่าง')) return 2;
  if (dept.includes('สาธารณสุข')) return 3;
  if (dept.includes('ศึกษา')) return 4;
  if (dept.includes('ยุทธศาสตร์') || dept.includes('แผนงาน') || dept.includes('งบประมาณ')) return 5;
  if (dept.includes('ตรวจสอบภายใน')) return 6;
  return 99;
};

export type PersonnelType = 
  | 'ข้าราชการ' 
  | 'ลูกจ้างประจำ' 
  | 'พนักงานจ้างตามภารกิจ' 
  | 'พนักงานจ้างทั่วไป';

export type LeaveType = 
  | 'ลาพักผ่อน' 
  | 'ลาป่วย' 
  | 'ลากิจส่วนตัว' 
  | 'ลาคลอดบุตร' 
  | 'ลาอุปสมบท' 
  | 'ไปราชการ'
  | 'อื่นๆ';

export type LeaveStatus = 'อนุมัติ' | 'รออนุมัติ' | 'ไม่อนุมัติ';

export type AdminRole = 
  | 'super_admin'  // ผู้ดูแลระบบสูงสุด (จัดการทุกอย่าง รวมถึงบัญชีเจ้าหน้าที่)
  | 'hr_officer'    // เจ้าหน้าที่งานการเจ้าหน้าที่ (ตรวจสอบสถิติ จัดการวันลา จัดการบุคลากร)
  | 'approver'      // ผู้บริหาร/ผู้บังคับบัญชา (ลงนามและอนุมัติคำขอ)
  | 'officer';      // เจ้าหน้าที่ทั่วไป (บันทึกข้อมูลและดูรายงาน)

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  position: string;
  department: string;
  role: AdminRole;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  signatureUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type AppMode = 'portal' | 'backoffice';

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: Department;
  personnelType: PersonnelType;
  phone: string;
  avatar?: string;
  photoUrl?: string;
  signatureUrl?: string;
  startDate?: string;
  accumulatedLeaveDays?: number;
  leaveQuotas: {
    vacation: number; // ลาพักผ่อน (ปกติ 10 วัน/ปี)
    sick: number;     // ลาป่วย
    personal: number; // ลากิจส่วนตัว
  };
}

export interface OfficialSignatures {
  mayor?: string;      // นายกเทศมนตรีตำบลทุ่งช้าง
  clerk?: string;      // ปลัดเทศบาลตำบลทุ่งช้าง / ผู้รักษาราชการแทน
  deptHead?: string;   // หัวหน้าสำนักปลัด / ผู้อำนวยการกอง (ค่าเริ่มต้น)
  checker?: string;    // ผู้ตรวจสอบสถิติวันลา
  deptHeadByDept?: Record<string, string>; // ลายเซ็นผู้บังคับบัญชาเบื้องต้นแยกตามสังกัด (6 ส่วนราชการ)
}

export type ApprovalStage = 
  | 'pending_checker'     // รอเจ้าหน้าที่ตรวจสอบสถิติวันลา
  | 'pending_dept_head'   // รอความเห็น ผอ.กอง / หัวหน้าส่วนราชการ
  | 'pending_clerk'       // รอความเห็น ปลัดเทศบาล
  | 'pending_mayor'       // รอนายกเทศมนตรีลงคำสั่งอนุมัติ
  | 'completed'           // อนุมัติครบทุกขั้นตอนเรียบร้อย
  | 'rejected';           // ไม่อนุมัติ / ยุติคำขอ

export interface ApprovalStepInfo {
  step: number;
  roleTitle: string;
  approverName: string;
  position: string;
  isApproved: boolean;
  actionDate?: string;
  comment?: string;
  signatureUrl?: string;
  isCurrent: boolean;
}

export interface SignatureDetectionResult {
  hasApplicantSignature: boolean;
  hasCheckerSignature: boolean;
  hasDeptHeadSignature: boolean;
  hasClerkSignature: boolean;
  hasMayorSignature: boolean;
  allSignaturesPresent: boolean;
  missingSignatures: string[];
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string; // YYYY-MM-DD
  attachmentUrl?: string;
  attachmentName?: string;
  
  // Hierarchical Workflow State
  currentApprovalStage?: ApprovalStage;
  signaturesComplete?: boolean;
  detectedSignatures?: {
    applicant: boolean;
    checker: boolean;
    deptHead: boolean;
    clerk: boolean;
    mayor: boolean;
  };

  // Step 0: Applicant Signature
  applicantSignatureUrl?: string;
  applicantSignedAt?: string;

  // Step 1: Leave Statistics Checker (งานการเจ้าหน้าที่ / HR)
  checkerApproved?: boolean;
  checkerName?: string;
  checkerPosition?: string;
  checkerComment?: string;
  checkerSignatureUrl?: string;
  checkerApprovedAt?: string;
  accumulatedDaysSnapshot?: number;
  thisYearQuotaSnapshot?: number;
  totalAvailableSnapshot?: number;
  usedBeforeSnapshot?: number;
  currentLeaveDaysSnapshot?: number;
  remainingSnapshot?: number;

  // Step 2: Head of Department (ผอ.กอง / หัวหน้าส่วนราชการ)
  deptHeadApproved?: boolean;
  deptHeadName?: string;
  deptHeadPosition?: string;
  deptHeadComment?: string;
  deptHeadSignatureUrl?: string;
  deptHeadApprovedAt?: string;

  // Step 3: Municipal Clerk (ปลัดเทศบาลตำบลทุ่งช้าง)
  clerkApproved?: boolean;
  clerkName?: string;
  clerkPosition?: string;
  clerkComment?: string;
  clerkSignatureUrl?: string;
  clerkApprovedAt?: string;

  // Step 4: Mayor (นายกเทศมนตรีตำบลทุ่งช้าง - ผู้มีอำนาจสั่งการสูงสุด)
  mayorApproved?: boolean;
  mayorName?: string;
  mayorPosition?: string;
  mayorOrder?: 'อนุญาต' | 'ไม่อนุมัติ';
  mayorComment?: string;
  mayorSignatureUrl?: string;
  mayorApprovedAt?: string;

  // Official Travel (ไปราชการ) specific fields
  destination?: string;        // เช่น ศาลากลางจังหวัดน่าน, โรงแรมดิเอ็มเพรส เชียงใหม่
  orderNumber?: string;        // เช่น คำสั่งเทศบาลตำบลทุ่งช้าง ที่ ๑๒๓/๒๕๖๙ หรือ บันทึกข้อความ ที่ นน ๕...
  transportType?: string;      // เช่น รถยนต์ส่วนกลาง, รถยนต์ส่วนบุคคล, รถโดยสารประจำทาง, เครื่องบิน
  withBudget?: boolean;        // ขอเบิกจ่ายงบประมาณ หรือ ไม่ขอเบิกจ่ายงบประมาณ
  budgetAmount?: number;       // จำนวนเงินประมาณการ (บาท)
  fundingSource?: string;      // แหล่งงบประมาณ / โครงการ
  companionNames?: string;     // ผู้ร่วมเดินทางไปราชการ
}

export type TabType = 
  | 'dashboard' 
  | 'calendar' 
  | 'leave-list' 
  | 'employees'
  | 'admin-users'
  | 'reports-daily-monthly' 
  | 'reports-fiscal-quarter' 
  | 'reports-individual'
  | 'ai-advisor'
  | 'holidays';
