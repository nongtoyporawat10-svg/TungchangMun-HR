import * as XLSX from 'xlsx';
import { LeaveRecord, Employee, Department, LeaveType } from '../types';

/**
 * Format ISO date string (YYYY-MM-DD) to Thai readable date (e.g., 12 ก.ค. 2569)
 */
export function formatThaiDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const thaiMonths = [
      '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${d} ${thaiMonths[m] || ''} ${y + 543}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate a timestamped filename
 */
export function generateExportFilename(prefix: string, ext: 'xlsx' | 'csv' | 'json' | string): string {
  const now = new Date();
  const yearBE = now.getFullYear() + 543;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${prefix}_เทศบาลตำบลทุ่งช้าง_${yearBE}${month}${day}_${hours}${mins}.${ext}`;
}

/**
 * Map LeaveRecord to formatted row object for Excel / CSV export
 */
export function mapLeaveRecordToExportRow(record: LeaveRecord, index: number, employees?: Employee[]) {
  const emp = employees?.find(e => e.id === record.employeeId || e.name === record.employeeName);
  
  // 4-stage approval summary text
  let approvalWorkflowStatus = 'รอเสนอตามลำดับขั้น';
  if (record.status === 'อนุมัติ') {
    approvalWorkflowStatus = 'อนุมัติครบ 4 ขั้นแล้ว';
  } else if (record.status === 'ไม่อนุมัติ') {
    approvalWorkflowStatus = 'ไม่อนุมัติ';
  } else if (!record.checkerApproved) {
    approvalWorkflowStatus = 'ขั้นที่ 1: รอตราตรวจสถิติ (งานบุคคล)';
  } else if (!record.deptHeadApproved) {
    approvalWorkflowStatus = 'ขั้นที่ 2: รอ ผอ.กอง พิจารณา';
  } else if (!record.clerkApproved) {
    approvalWorkflowStatus = 'ขั้นที่ 3: รอ ปลัดเทศบาล พิจารณา';
  } else {
    approvalWorkflowStatus = 'ขั้นที่ 4: รอ นายกเทศมนตรี อนุมัติ';
  }

  return {
    'ลำดับ': index + 1,
    'รหัสใบลา': record.id,
    'ชื่อ-นามสกุลผู้ขอลา': record.employeeName,
    'ตำแหน่ง': emp?.position || '-',
    'สำนัก/กอง': record.department,
    'ประเภทการลา': record.leaveType,
    'วันที่เริ่มลา': record.startDate,
    'วันที่สิ้นสุด': record.endDate,
    'วันที่เริ่มลา (พ.ศ.)': formatThaiDate(record.startDate),
    'วันที่สิ้นสุด (พ.ศ.)': formatThaiDate(record.endDate),
    'จำนวนวันลา (วันทำการ)': record.totalDays,
    'เหตุผลการลา': record.reason || '-',
    'เบอร์โทรศัพท์ติดต่อ': emp?.phone || '-',
    'สถานะผลการอนุมัติ': record.status,
    'ขั้นตอนการพิจารณา': approvalWorkflowStatus,
    'วันที่ยื่นคำขอ': formatThaiDate(record.createdAt),
    // 4-Stage Approval Details
    '1. ตรวจสถิติ (จนท.บุคคล)': record.checkerApproved ? `ผ่านแล้ว (${record.checkerName || 'เจ้าหน้าที่'})` : 'รอดำเนินการ',
    'วันที่ตรวจสถิติ': formatThaiDate(record.checkerApprovedAt),
    '2. ผอ.กอง/หัวหน้าส่วน': record.deptHeadApproved ? `เสนอเห็นควร (${record.deptHeadName || 'ผอ.กอง'})` : 'รอดำเนินการ',
    'ความเห็น ผอ.กอง': record.deptHeadComment || '-',
    'วันที่ ผอ.กองลงนาม': formatThaiDate(record.deptHeadApprovedAt),
    '3. ปลัดเทศบาล': record.clerkApproved ? `เสนอเห็นควร (${record.clerkName || 'ปลัดเทศบาล'})` : 'รอดำเนินการ',
    'ความเห็น ปลัดเทศบาล': record.clerkComment || '-',
    'วันที่ ปลัดฯ ลงนาม': formatThaiDate(record.clerkApprovedAt),
    '4. นายกเทศมนตรี': record.mayorApproved ? `อนุมัติแล้ว (${record.mayorName || 'นายกเทศมนตรี'})` : (record.status === 'ไม่อนุมัติ' ? 'ไม่อนุมัติ' : 'รอดำเนินการ'),
    'คำสั่ง นายกเทศมนตรี': record.mayorComment || (record.status === 'อนุมัติ' ? 'อนุมัติตามเสนอ' : '-'),
    'วันที่ นายกฯ ลงนาม': formatThaiDate(record.mayorApprovedAt),
    // Duty travel specific details
    'สถานที่ไปราชการ': record.destination || '-',
    'เลขที่คำสั่งไปราชการ': record.orderNumber || '-',
    'ยานพาหนะเดินทาง': record.transportType || '-',
    'งบประมาณที่ใช้ (บาท)': record.budgetAmount ? Number(record.budgetAmount) : 0,
    'แหล่งงบประมาณ': record.fundingSource || '-',
    'รายชื่อผู้ร่วมเดินทาง': record.companionNames || '-',
    'ไฟล์แนบ': record.attachmentName || '-',
    'มีลายมือชื่อผู้ขอลา': record.applicantSignatureUrl ? 'มี' : 'ไม่มี',
  };
}

/**
 * Export all leave records (with multiple analytic sheets) to Excel (.xlsx)
 */
export function exportAllLeaveRecordsToExcel(
  records: LeaveRecord[],
  employees: Employee[] = [],
  customFilename?: string
): boolean {
  try {
    const filename = customFilename || generateExportFilename('ข้อมูลวันลาและประวัติการลาทั้งหมด', 'xlsx');

    // 1. Sheet 1: Main Leave Records Data
    const mappedRows = records.map((record, idx) => mapLeaveRecordToExportRow(record, idx, employees));
    const mainWorksheet = XLSX.utils.json_to_sheet(mappedRows);

    // Set auto column widths for main sheet
    const colWidths = [
      { wch: 6 },  // ลำดับ
      { wch: 18 }, // รหัสใบลา
      { wch: 24 }, // ชื่อ-นามสกุล
      { wch: 24 }, // ตำแหน่ง
      { wch: 22 }, // สำนัก/กอง
      { wch: 16 }, // ประเภทการลา
      { wch: 14 }, // เริ่มลา (ISO)
      { wch: 14 }, // สิ้นสุด (ISO)
      { wch: 18 }, // เริ่มลา (พ.ศ.)
      { wch: 18 }, // สิ้นสุด (พ.ศ.)
      { wch: 16 }, // จำนวนวันลา
      { wch: 30 }, // เหตุผล
      { wch: 16 }, // เบอร์โทร
      { wch: 14 }, // สถานะ
      { wch: 28 }, // ขั้นตอนพิจารณา
      { wch: 16 }, // วันที่ยื่นคำขอ
      { wch: 24 }, // 1. ตรวจสถิติ
      { wch: 16 }, // วันที่ตรวจสถิติ
      { wch: 24 }, // 2. ผอ.กอง
      { wch: 25 }, // ความเห็น ผอ.กอง
      { wch: 16 }, // วันที่ ผอ.กอง
      { wch: 24 }, // 3. ปลัด
      { wch: 25 }, // ความเห็น ปลัด
      { wch: 16 }, // วันที่ ปลัด
      { wch: 24 }, // 4. นายก
      { wch: 25 }, // คำสั่ง นายก
      { wch: 16 }, // วันที่ นายก
      { wch: 25 }, // สถานที่ไปราชการ
      { wch: 20 }, // เลขที่คำสั่ง
      { wch: 18 }, // ยานพาหนะ
      { wch: 16 }, // งบประมาณ
      { wch: 18 }, // แหล่งงบ
      { wch: 25 }, // ผู้ร่วมเดินทาง
      { wch: 20 }, // ไฟล์แนบ
      { wch: 16 }, // ลายมือชื่อ
    ];
    mainWorksheet['!cols'] = colWidths;

    // 2. Sheet 2: Department Summary Statistics
    const deptMap = new Map<string, { totalRequests: number; approvedRequests: number; pendingRequests: number; totalDays: number }>();
    records.forEach(r => {
      const current = deptMap.get(r.department) || { totalRequests: 0, approvedRequests: 0, pendingRequests: 0, totalDays: 0 };
      current.totalRequests += 1;
      if (r.status === 'อนุมัติ') {
        current.approvedRequests += 1;
      } else if (r.status === 'รออนุมัติ') {
        current.pendingRequests += 1;
      }
      current.totalDays += (r.totalDays || 0);
      deptMap.set(r.department, current);
    });

    const deptRows = Array.from(deptMap.entries()).map(([dept, stat], idx) => ({
      'ลำดับ': idx + 1,
      'สำนัก/กอง': dept,
      'จำนวนคำขอลาทั้งหมด (ครั้ง)': stat.totalRequests,
      'อนุมัติแล้ว (ครั้ง)': stat.approvedRequests,
      'อยู่ระหว่างเสนอพิจารณา (ครั้ง)': stat.pendingRequests,
      'รวมวันลาสะสม (วันทำการ)': stat.totalDays,
    }));
    const deptWorksheet = XLSX.utils.json_to_sheet(deptRows);
    deptWorksheet['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 20 }];

    // 3. Sheet 3: Leave Type Summary Statistics
    const typeMap = new Map<string, { count: number; totalDays: number; approvedDays: number }>();
    records.forEach(r => {
      const current = typeMap.get(r.leaveType) || { count: 0, totalDays: 0, approvedDays: 0 };
      current.count += 1;
      current.totalDays += (r.totalDays || 0);
      if (r.status === 'อนุมัติ') {
        current.approvedDays += (r.totalDays || 0);
      }
      typeMap.set(r.leaveType, current);
    });

    const typeRows = Array.from(typeMap.entries()).map(([type, stat], idx) => ({
      'ลำดับ': idx + 1,
      'ประเภทการลา': type,
      'จำนวนครั้งที่ยื่น': stat.count,
      'รวมวันลาที่ขอ (วันทำการ)': stat.totalDays,
      'รวมวันลาที่อนุมัติแล้ว (วันทำการ)': stat.approvedDays,
    }));
    const typeWorksheet = XLSX.utils.json_to_sheet(typeRows);
    typeWorksheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 26 }];

    // 4. Sheet 4: Backup & System Metadata
    const now = new Date();
    const backupMetadataRows = [
      { 'รายการข้อมูล': 'ชื่อระบบ', 'รายละเอียด': 'ระบบบันทึกและควบคุมวันลา พนักงานเทศบาลตำบลทุ่งช้าง' },
      { 'รายการข้อมูล': 'หน่วยงาน', 'รายละเอียด': 'เทศบาลตำบลทุ่งช้าง อำเภอทุ่งช้าง จังหวัดน่าน' },
      { 'รายการข้อมูล': 'วันที่สำรองข้อมูล (พ.ศ.)', 'รายละเอียด': formatThaiDate(now.toISOString().split('T')[0]) },
      { 'รายการข้อมูล': 'เวลาที่ส่งออกข้อมูล', 'รายละเอียด': now.toLocaleTimeString('th-TH') },
      { 'รายการข้อมูล': 'จำนวนรายการใบลาทั้งหมด', 'รายละเอียด': `${records.length} รายการ` },
      { 'รายการข้อมูล': 'จำนวนบุคลากรในระบบ', 'รายละเอียด': `${employees.length} คน` },
      { 'รายการข้อมูล': 'วัตถุประสงค์', 'รายละเอียด': 'สำรองข้อมูลประวัติวันลาเพื่อความปลอดภัยและใช้ตรวจสอบทางราชการ' },
    ];
    const metaWorksheet = XLSX.utils.json_to_sheet(backupMetadataRows);
    metaWorksheet['!cols'] = [{ wch: 25 }, { wch: 45 }];

    // Create Workbook and add sheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'รายการวันลาทั้งหมด');
    XLSX.utils.book_append_sheet(workbook, deptWorksheet, 'สรุปแยกตามกอง');
    XLSX.utils.book_append_sheet(workbook, typeWorksheet, 'สรุปแยกตามประเภทการลา');
    XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'ข้อมูลสำรองระบบ');

    // Trigger download
    XLSX.writeFile(workbook, filename);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

/**
 * Export leave records to CSV with UTF-8 BOM so Thai characters display properly in Excel
 */
export function exportAllLeaveRecordsToCSV(
  records: LeaveRecord[],
  employees: Employee[] = [],
  customFilename?: string
): boolean {
  try {
    const filename = customFilename || generateExportFilename('ข้อมูลวันลา_สำรองข้อมูล', 'csv');
    const mappedRows = records.map((record, idx) => mapLeaveRecordToExportRow(record, idx, employees));

    if (mappedRows.length === 0) {
      alert('ไม่มีข้อมูลใบลาสำหรับส่งออก');
      return false;
    }

    const headers = Object.keys(mappedRows[0]);
    const csvRows = [headers.join(',')];

    for (const row of mappedRows) {
      const values = headers.map(header => {
        const val = (row as any)[header];
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(values.join(','));
    }

    // Add UTF-8 BOM (\uFEFF) to guarantee correct Thai character encoding in Excel
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
}

/**
 * Export Complete Backup Package (Leaves + Employees JSON backup)
 */
export function exportCompleteSystemBackupJSON(
  records: LeaveRecord[],
  employees: Employee[],
  customFilename?: string
): boolean {
  try {
    const filename = customFilename || generateExportFilename('สำรองฐานข้อมูลระบบวันลา_FullBackup', 'json');
    const backupData = {
      system: 'ระบบควบคุมวันลา เทศบาลตำบลทุ่งช้าง',
      backupDateISO: new Date().toISOString(),
      backupDateThai: formatThaiDate(new Date().toISOString().split('T')[0]),
      stats: {
        totalLeaveRecords: records.length,
        totalEmployees: employees.length,
      },
      leaveRecords: records,
      employees: employees,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting backup JSON:', error);
    return false;
  }
}
