import React, { useState, useRef } from 'react';
import { Employee, Department, PersonnelType, ORDERED_DEPARTMENTS, getDepartmentOrderIndex } from '../types';
import { 
  CareerTrackType, 
  ORDERED_CAREER_TRACKS, 
  getEmployeeCareerTrack, 
  compareEmployeesByRank,
  sortEmployeesByCareerTrack 
} from '../utils/employeeRanking';
import { EmployeeModal } from './EmployeeModal';
import { BatchPhotoUploadModal } from './BatchPhotoUploadModal';
import { BatchSignatureUploadModal } from './BatchSignatureUploadModal';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Building2, 
  Phone, 
  Edit, 
  Trash2, 
  Award, 
  FileSpreadsheet, 
  Download, 
  User, 
  Layers, 
  LayoutGrid, 
  Table as TableIcon,
  CheckCircle2,
  Camera,
  UploadCloud,
  Sparkles,
  Images,
  PenTool,
  Check,
  Calendar,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { optimizeImageFile, optimizeSignatureImage } from '../utils/imageOptimizer';

interface EmployeeManagementViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteEmployees?: (ids: string[]) => void;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onDeleteEmployees,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPersonnelType, setSelectedPersonnelType] = useState<string>('ALL');
  const [selectedCareerTrack, setSelectedCareerTrack] = useState<string>('ALL');
  const [selectedPhotoStatus, setSelectedPhotoStatus] = useState<'ALL' | 'WITH_PHOTO' | 'WITHOUT_PHOTO'>('ALL');
  const [sortBy, setSortBy] = useState<'career_track' | 'department' | 'name'>('career_track');
  const [groupingMode, setGroupingMode] = useState<'career_track' | 'department'>('career_track');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchPhotoModalOpen, setIsBatchPhotoModalOpen] = useState(false);
  const [isBatchSignatureModalOpen, setIsBatchSignatureModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'grouped'>('grid');
  const [previewPhotoData, setPreviewPhotoData] = useState<{ url: string; name: string; position: string; department: string } | null>(null);
  const [targetQuickEmp, setTargetQuickEmp] = useState<Employee | null>(null);
  const [targetQuickSignatureEmp, setTargetQuickSignatureEmp] = useState<Employee | null>(null);
  const quickPhotoInputRef = useRef<HTMLInputElement>(null);
  const quickSignatureInputRef = useRef<HTMLInputElement>(null);

  const departments: Department[] = ORDERED_DEPARTMENTS;
  const careerTracks: CareerTrackType[] = ORDERED_CAREER_TRACKS;

  const getTrackBadgeColor = (track: CareerTrackType) => {
    switch (track) {
      case 'บริหารท้องถิ่น':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'อำนวยการท้องถิ่น':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'วิชาการ':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'ทั่วไป':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'ข้าราชการหรือพนักงานครูส่วนท้องถิ่น':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'ลูกจ้างประจำ':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'พนักงานจ้าง':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatThaiDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        const thaiMonths = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const thaiYear = y < 2500 ? y + 543 : y;
        return `${d} ${thaiMonths[m - 1] || ''} ${thaiYear}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const personnelTypes: PersonnelType[] = [
    'ข้าราชการ', 
    'ลูกจ้างประจำ', 
    'พนักงานจ้างตามภารกิจ', 
    'พนักงานจ้างทั่วไป'
  ];

  // Calculate photo statistics
  const withPhotoCount = employees.filter(e => Boolean(e.photoUrl || e.avatar)).length;
  const withoutPhotoCount = employees.length - withPhotoCount;

  // Filter and Sort employees
  // Priority sorting:
  // 1. By Career Track (บริหารท้องถิ่น > อำนวยการท้องถิ่น > วิชาการ > ทั่วไป > ครู > ลูกจ้างประจำ > พนักงานจ้าง)
  // 2. By Department
  // 3. By Name
  const sortedAndFilteredEmployees = [...employees]
    .filter(emp => {
      const track = getEmployeeCareerTrack(emp);
      const hasPhoto = Boolean(emp.photoUrl || emp.avatar);
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            track.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'ALL' || 
                          emp.department === selectedDept || 
                          (selectedDept.includes('สำนักปลัด') && emp.department.includes('สำนักปลัด')) ||
                          (selectedDept.includes('ยุทธศาสตร์') && emp.department.includes('ยุทธศาสตร์'));
      const matchesType = selectedPersonnelType === 'ALL' || emp.personnelType === selectedPersonnelType;
      const matchesTrack = selectedCareerTrack === 'ALL' || track === selectedCareerTrack;
      const matchesPhoto = selectedPhotoStatus === 'ALL' ||
                           (selectedPhotoStatus === 'WITH_PHOTO' && hasPhoto) ||
                           (selectedPhotoStatus === 'WITHOUT_PHOTO' && !hasPhoto);
      return matchesSearch && matchesDept && matchesType && matchesTrack && matchesPhoto;
    })
    .sort((a, b) => {
      if (sortBy === 'career_track') {
        return compareEmployeesByRank(a, b);
      }
      if (sortBy === 'department') {
        const rankA = getDepartmentOrderIndex(a.department);
        const rankB = getDepartmentOrderIndex(b.department);
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return compareEmployeesByRank(a, b);
      }
      return a.name.localeCompare(b.name, 'th');
    });

  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === sortedAndFilteredEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(sortedAndFilteredEmployees.map(e => e.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedEmpIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (emp: Employee) => {
    const exists = employees.some(e => e.id === emp.id);
    if (exists) {
      onUpdateEmployee(emp);
    } else {
      onAddEmployee(emp);
    }
  };

  const triggerQuickPhotoUpload = (emp: Employee) => {
    setTargetQuickEmp(emp);
    if (quickPhotoInputRef.current) {
      quickPhotoInputRef.current.value = '';
      quickPhotoInputRef.current.click();
    }
  };

  const handleQuickPhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetQuickEmp) return;

    try {
      const optimizedPhoto = await optimizeImageFile(file, 600, 600, 0.85);
      const updated: Employee = {
        ...targetQuickEmp,
        photoUrl: optimizedPhoto,
        avatar: optimizedPhoto
      };
      onUpdateEmployee(updated);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setTargetQuickEmp(null);
      if (quickPhotoInputRef.current) {
        quickPhotoInputRef.current.value = '';
      }
    }
  };

  const triggerQuickSignatureUpload = (emp: Employee) => {
    setTargetQuickSignatureEmp(emp);
    if (quickSignatureInputRef.current) {
      quickSignatureInputRef.current.value = '';
      quickSignatureInputRef.current.click();
    }
  };

  const handleQuickSignatureFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetQuickSignatureEmp) return;

    try {
      const optimizedSig = await optimizeSignatureImage(file, { removeBackground: true, inkColor: 'blue' });
      const updated: Employee = {
        ...targetQuickSignatureEmp,
        signatureUrl: optimizedSig
      };
      onUpdateEmployee(updated);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถประมวลผลรูปลายเซ็นได้');
    } finally {
      setTargetQuickSignatureEmp(null);
      if (quickSignatureInputRef.current) {
        quickSignatureInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          alert('ไม่พบข้อมูลในไฟล์ Excel หรือรูปแบบไฟล์ไม่ถูกต้อง');
          return;
        }

        let importedCount = 0;
        data.forEach((row, index) => {
          const name = row['ชื่อ-นามสกุล'] || row['ชื่อ'] || row['Name'] || row['name'];
          const position = row['ตำแหน่ง'] || row['Position'] || row['position'] || 'เจ้าหน้าที่ทั่วไป';
          const departmentRaw = row['สังกัด'] || row['กอง'] || row['สำนัก/กอง'] || row['Department'] || row['department'] || 'สำนักปลัดเทศบาล';
          const personnelTypeRaw = row['ประเภทบุคลากร'] || row['ประเภท'] || row['PersonnelType'] || 'ข้าราชการ';
          const phone = row['เบอร์โทร'] || row['โทรศัพท์'] || row['Phone'] || row['phone'] || '080-000-0000';
          const startDateRaw = row['วันที่บรรจุ (เช่น 2019-10-01 หรือ 2562-10-01)'] || 
                               row['วันที่บรรจุ'] || row['วันที่เริ่มปฏิบัติงาน'] || row['วันที่เริ่มงาน'] || 
                               row['StartDate'] || row['startDate'] || '';
          const photoUrl = row['รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)'] || 
                           row['รูปถ่าย'] || row['รูป'] || row['รูปภาพ'] || row['แนบรูป'] || 
                           row['แนบรูปถ่าย'] || row['ไฟล์รูป'] || row['ชื่อไฟล์รูป'] || 
                           row['URL รูปถ่าย'] || row['ลิงก์รูปภาพ'] || row['ลิงก์รูป'] || 
                           row['Photo'] || row['photo'] || row['Avatar'] || row['avatar'] || '';
          
          const vacation = Number(row['ลาพักผ่อน'] || row['vacation'] || 10);
          const sick = Number(row['ลาป่วย'] || row['sick'] || 30);
          const personal = Number(row['ลากิจ'] || row['personal'] || 45);

          if (name) {
            let department: Department = 'สำนักปลัดเทศบาล';
            if (String(departmentRaw).includes('สำนักปลัด')) department = 'สำนักปลัดเทศบาล';
            else if (String(departmentRaw).includes('คลัง')) department = 'กองคลัง';
            else if (String(departmentRaw).includes('ช่าง')) department = 'กองช่าง';
            else if (String(departmentRaw).includes('สาธารณสุข')) department = 'กองสาธารณสุขและสิ่งแวดล้อม';
            else if (String(departmentRaw).includes('ศึกษา')) department = 'กองการศึกษา';
            else if (String(departmentRaw).includes('ยุทธศาสตร์') || String(departmentRaw).includes('แผนงาน') || String(departmentRaw).includes('งบประมาณ')) department = 'กองยุทธศาสตร์และแผนงาน';
            else if (String(departmentRaw).includes('ตรวจสอบภายใน')) department = 'หน่วยตรวจสอบภายใน';

            let personnelType: PersonnelType = 'ข้าราชการ';
            const validTypes: PersonnelType[] = ['ข้าราชการ', 'ลูกจ้างประจำ', 'พนักงานจ้างตามภารกิจ', 'พนักงานจ้างทั่วไป'];
            for (const t of validTypes) {
              if (String(personnelTypeRaw).includes(t)) {
                personnelType = t;
                break;
              }
            }

            const cleanPhoto = String(photoUrl || '').trim();
            let cleanStartDate = String(startDateRaw || '').trim();
            if (cleanStartDate) {
              const parts = cleanStartDate.split(/[-/]/);
              if (parts.length === 3) {
                let year = parseInt(parts[0]);
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                if (year > 2500) {
                  year = year - 543;
                }
                cleanStartDate = `${year}-${month}-${day}`;
              }
            }

            const newEmp: Employee = {
              id: `imported-${Date.now()}-${index}`,
              name: String(name).trim(),
              position: String(position).trim(),
              department,
              personnelType,
              phone: String(phone).trim(),
              startDate: cleanStartDate || undefined,
              photoUrl: cleanPhoto.startsWith('http') || cleanPhoto.startsWith('data:') ? cleanPhoto : undefined,
              avatar: cleanPhoto.startsWith('http') || cleanPhoto.startsWith('data:') ? cleanPhoto : undefined,
              leaveQuotas: {
                vacation: isNaN(vacation) ? 10 : vacation,
                sick: isNaN(sick) ? 30 : sick,
                personal: isNaN(personal) ? 45 : personal,
              }
            };

            onAddEmployee(newEmp);
            importedCount++;
          }
        });

        alert(`นำเข้าข้อมูลบุคลากรสำเร็จ ${importedCount} รายการ (สามารถกดปุ่ม "แนบรูปถ่ายบุคลากร" หรือกดไอคอนกล้อง 📷 เพื่อแนบรูปถ่ายได้ทันที)`);
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
      } finally {
        if (e.target) {
          e.target.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ลำดับกอง': '1. สำนักปลัดเทศบาล',
        'ชื่อ-นามสกุล': 'นายสมชาย ใจดี',
        'ตำแหน่ง': 'ปลัดเทศบาลตำบลทุ่งช้าง',
        'สังกัด': 'สำนักปลัดเทศบาล',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '081-234-5678',
        'วันที่บรรจุ (เช่น 2019-10-01 หรือ 2562-10-01)': '2019-10-01',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Somchai.jpg',
        'ลาพักผ่อน': 10,
        'ลาป่วย': 30,
        'ลากิจ': 45
      },
      {
        'ลำดับกอง': '2. กองคลัง',
        'ชื่อ-นามสกุล': 'นางสาวสมหญิง รักงาน',
        'ตำแหน่ง': 'ผู้อำนวยการกองคลัง',
        'สังกัด': 'กองคลัง',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '089-876-5432',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Somying.jpg',
        'ลาพักผ่อน': 8,
        'ลาป่วย': 25,
        'ลากิจ': 40
      },
      {
        'ลำดับกอง': '3. กองช่าง',
        'ชื่อ-นามสกุล': 'นายวิชัย มั่นคง',
        'ตำแหน่ง': 'หัวหน้าฝ่ายช่างโยธา',
        'สังกัด': 'กองช่าง',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '086-555-1234',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Wichai.jpg',
        'ลาพักผ่อน': 10,
        'ลาป่วย': 30,
        'ลากิจ': 45
      },
      {
        'ลำดับกอง': '4. กองสาธารณสุขและสิ่งแวดล้อม',
        'ชื่อ-นามสกุล': 'นางสาวนิตยา สุขใจ',
        'ตำแหน่ง': 'นักวิชาการสุขาภิบาลชำนาญการ',
        'สังกัด': 'กองสาธารณสุขและสิ่งแวดล้อม',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '084-333-7890',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Nittaya.jpg',
        'ลาพักผ่อน': 6,
        'ลาป่วย': 28,
        'ลากิจ': 42
      },
      {
        'ลำดับกอง': '5. กองการศึกษา',
        'ชื่อ-นามสกุล': 'นายธนดล ศรีสุวรรณ',
        'ตำแหน่ง': 'นักวิชาการศึกษาปฏิบัติการ',
        'สังกัด': 'กองการศึกษา',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '082-111-9988',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Thanadol.jpg',
        'ลาพักผ่อน': 10,
        'ลาป่วย': 30,
        'ลากิจ': 45
      },
      {
        'ลำดับกอง': '6. กองยุทธศาสตร์และแผนงาน',
        'ชื่อ-นามสกุล': 'นางภาดา สุขสวัสดิ์',
        'ตำแหน่ง': 'นักวิเคราะห์นโยบายและแผน',
        'สังกัด': 'กองยุทธศาสตร์และแผนงาน',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '081-999-0011',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Pada.jpg',
        'ลาพักผ่อน': 10,
        'ลาป่วย': 30,
        'ลากิจ': 45
      },
      {
        'ลำดับกอง': '7. หน่วยตรวจสอบภายใน',
        'ชื่อ-นามสกุล': 'นางสาวกนกกาญจน์ ตรวจสอบ',
        'ตำแหน่ง': 'นักวิชาการตรวจสอบภายในชำนาญการ',
        'สังกัด': 'หน่วยตรวจสอบภายใน',
        'ประเภทบุคลากร': 'ข้าราชการ',
        'เบอร์โทร': '089-123-4455',
        'รูปถ่าย (ระบุชื่อไฟล์รูป เช่น Somchai.jpg หรือ แนบรูปภาพในระบบ)': 'Kanokkan.jpg',
        'ลาพักผ่อน': 10,
        'ลาป่วย': 30,
        'ลากิจ': 45
      }
    ];

    const worksheet = utils.json_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Template_เทศบาลตำบลทุ่งช้าง');
    writeFile(workbook, 'thung_chang_employee_template.xlsx');
  };

  // Group employees by ordered departments for Grouped View
  const groupedByDept = departments.map((dept, index) => {
    const deptEmployees = sortedAndFilteredEmployees.filter(e => {
      const idx = getDepartmentOrderIndex(e.department);
      return idx === index;
    });
    return {
      dept,
      index: index + 1,
      employees: deptEmployees
    };
  }).filter(group => selectedDept === 'ALL' || selectedDept.includes(group.dept) || group.dept.includes(selectedDept));

  // Group employees by ordered career tracks for Grouped View
  const groupedByTrack = careerTracks.map((track, index) => {
    const trackEmployees = sortedAndFilteredEmployees.filter(e => {
      return getEmployeeCareerTrack(e) === track;
    });
    return {
      track,
      index: index + 1,
      employees: trackEmployees
    };
  }).filter(group => selectedCareerTrack === 'ALL' || group.track === selectedCareerTrack);

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
            <h2 className="text-xl font-bold text-slate-900">จัดการข้อมูลและรูปถ่ายบุคลากร</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            เรียงลำดับตามสายงาน: 1. บริหารท้องถิ่น 2. อำนวยการท้องถิ่น 3. วิชาการ 4. ทั่วไป 5. ข้าราชการ/พนักงานครูส่วนท้องถิ่น 6. ลูกจ้างประจำ 7. พนักงานจ้าง
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedEmpIds.length > 0 && onDeleteEmployees && (
            <button
              onClick={() => {
                onDeleteEmployees(selectedEmpIds);
                setSelectedEmpIds([]);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>ลบบุคลากรที่เลือก ({selectedEmpIds.length})</span>
            </button>
          )}

          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200"
            title="ดาวน์โหลดไฟล์ตัวอย่าง Excel สำหรับกรอกข้อมูลบุคลากร"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>ดาวน์โหลดเทมเพลต Excel</span>
          </button>
          
          <button
            onClick={() => document.getElementById('excel-upload-input')?.click()}
            className="bg-teal-800 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-md shadow-teal-950/20 transition-all cursor-pointer"
            title="นำเข้าไฟล์ Excel รายชื่อบุคลากร"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>นำเข้า Excel</span>
          </button>
          <input
            id="excel-upload-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => setIsBatchPhotoModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            title="แนบรูปถ่ายบุคลากรหลายรูปพร้อมกันโดยจับคู่อัตโนมัติ"
          >
            <Images className="w-4 h-4" />
            <span>แนบรูปถ่าย (หลายคน)</span>
          </button>

          <button
            onClick={() => setIsBatchSignatureModalOpen(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-md shadow-blue-950/20 transition-all cursor-pointer"
            title="นำเข้าลายเซ็นดิจิทัลบุคลากรและผู้บริหารเพื่อใช้ในแบบฟอร์มขอลา"
          >
            <PenTool className="w-4 h-4" />
            <span>นำเข้าลายเซ็น (หลายคน/ผู้บริหาร)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>เพิ่มบุคลากร</span>
          </button>
        </div>
      </div>

      {/* Filter, Search Bar, Sort By, Photo Status, and View Mode Switcher */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ตำแหน่ง หรือสายงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <select
              value={selectedCareerTrack}
              onChange={(e) => setSelectedCareerTrack(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="ALL">ทุกสายงาน (7 ประเภท)</option>
              {careerTracks.map((track, idx) => {
                const count = employees.filter(e => getEmployeeCareerTrack(e) === track).length;
                return (
                  <option key={track} value={track}>
                    {idx + 1}. {track} ({count} คน)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="ALL">ทุกลำดับกอง / ส่วนราชการ ({employees.length} คน)</option>
              {departments.map((d, index) => {
                const count = employees.filter(e => getDepartmentOrderIndex(e.department) === index).length;
                return (
                  <option key={d} value={d}>
                    {index + 1}. {d} ({count} คน)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900"
            >
              <option value="career_track">เรียงตามสายงาน (บริหาร &gt; อำนวยการ &gt; วิชาการ...)</option>
              <option value="department">เรียงตามสังกัดส่วนราชการ (สำนักปลัด &gt; กองคลัง...)</option>
              <option value="name">เรียงตามชื่อ-สกุล (ก-ฮ)</option>
            </select>
          </div>
        </div>

        {/* Photo Status Quick Filters & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">ตัวกรองรูปถ่าย:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setSelectedPhotoStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedPhotoStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แสดงทุกคน ({employees.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhotoStatus('WITH_PHOTO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedPhotoStatus === 'WITH_PHOTO'
                    ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                มีรูปถ่ายแล้ว ({withPhotoCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhotoStatus('WITHOUT_PHOTO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedPhotoStatus === 'WITHOUT_PHOTO'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'text-amber-800 hover:text-amber-950 bg-amber-100/70'
                }`}
              >
                <span>ยังไม่มีรูปถ่าย ({withoutPhotoCount})</span>
                {withoutPhotoCount > 0 && (
                  <span className={`w-2 h-2 rounded-full ${selectedPhotoStatus === 'WITHOUT_PHOTO' ? 'bg-white' : 'bg-amber-500 animate-pulse'}`}></span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">มุมมอง:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 px-3 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-semibold cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="การ์ดบุคลากรพร้อมรูป"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>การ์ดรูปถ่าย</span>
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`p-1.5 px-3 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-semibold cursor-pointer ${
                  viewMode === 'grouped' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="จัดกลุ่มตามหมวดหมู่"
              >
                <Layers className="w-4 h-4" />
                <span>จัดกลุ่มแยกสายงาน/กอง</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 px-3 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-semibold cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="ตารางรายชื่อราชการ"
              >
                <TableIcon className="w-4 h-4" />
                <span>ตารางมาตรฐาน</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            แสดง {sortedAndFilteredEmployees.length} จากทั้งหมด {employees.length} คน
            {selectedPhotoStatus === 'WITHOUT_PHOTO' && ' (กรองเฉพาะบุคลากรที่ยังไม่มีรูปถ่าย)'}
            {selectedPhotoStatus === 'WITH_PHOTO' && ' (กรองเฉพาะบุคลากรที่มีรูปถ่ายแล้ว)'}
          </span>
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sortedAndFilteredEmployees.length > 0 && selectedEmpIds.length === sortedAndFilteredEmployees.length}
              onChange={handleToggleSelectAll}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="whitespace-nowrap">เลือกทั้งหมด ({sortedAndFilteredEmployees.length})</span>
          </label>
        </div>
      </div>

      {/* 1. GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredEmployees.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-base">ไม่พบข้อมูลบุคลากรที่ค้นหา</p>
            </div>
          ) : (
            sortedAndFilteredEmployees.map((emp) => {
              const deptRank = getDepartmentOrderIndex(emp.department) + 1;
              const track = getEmployeeCareerTrack(emp);
              const photo = emp.photoUrl || emp.avatar;
              return (
                <div 
                  key={emp.id} 
                  className={`bg-white rounded-3xl p-6 shadow-sm border transition-all flex flex-col justify-between ${
                    selectedEmpIds.includes(emp.id) ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200/80 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Career Track Badge, Personnel Type & Checkbox */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border leading-none ${getTrackBadgeColor(track)}`}>
                        {track}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border shrink-0 ${
                          emp.personnelType === 'ข้าราชการ' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          emp.personnelType === 'ลูกจ้างประจำ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          emp.personnelType === 'พนักงานจ้างตามภารกิจ' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {emp.personnelType || 'ข้าราชการ'}
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedEmpIds.includes(emp.id)}
                          onChange={() => handleToggleSelectOne(emp.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Large Photo & Name Layout */}
                    <div className="flex items-center space-x-4">
                      <div className="relative group shrink-0">
                        {photo ? (
                          <div className="relative">
                            <div 
                              onClick={() => setPreviewPhotoData({ url: photo, name: emp.name, position: emp.position, department: emp.department })}
                              className="cursor-pointer relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 shadow-md group-hover:border-emerald-600 group-hover:shadow-lg transition-all"
                              title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                            >
                              <img
                                src={photo}
                                alt={emp.name}
                                referrerPolicy="no-referrer"
                                className="w-24 h-24 sm:w-28 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[10px] bg-slate-900/80 text-white font-bold px-2 py-0.5 rounded-md shadow-xs">
                                  ดูรูปใหญ่
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerQuickPhotoUpload(emp);
                              }}
                              title="เปลี่ยนรูปถ่ายทันที"
                              className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer border border-white"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <div 
                              onClick={() => triggerQuickPhotoUpload(emp)}
                              className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-50 via-slate-50 to-orange-50 text-slate-800 rounded-2xl flex flex-col items-center justify-center shadow-xs border-2 border-dashed border-amber-300 hover:border-emerald-500 cursor-pointer transition-all p-2 text-center group"
                              title="คลิกเพื่ออัปโหลดรูปถ่ายบุคลากรนี้"
                            >
                              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-2xs">
                                <User className="w-6 h-6 text-amber-700" />
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full leading-tight">
                                ยังไม่มีรูป
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold mt-1 group-hover:underline flex items-center">
                                <Camera className="w-3 h-3 mr-0.5" /> เพิ่มรูป
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate" title={emp.name}>
                          {emp.name}
                        </h3>
                        <p className="text-xs text-emerald-700 font-semibold leading-snug">
                          {emp.position}
                        </p>
                        <div className="text-[11px] text-slate-500 flex items-center pt-1">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                          <span className="truncate">{emp.department}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                        {emp.startDate && (
                          <div className="text-[11px] text-emerald-800 font-medium flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                            <span>บรรจุ: {formatThaiDateDisplay(emp.startDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">โควตาวันลาคงเหลือ (ปีงบประมาณ 2569)</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-2xl border border-emerald-100">
                          <div className="font-extrabold text-base">{emp.leaveQuotas?.vacation ?? 10}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">พักผ่อน</div>
                        </div>
                        <div className="bg-teal-50 text-teal-800 p-2.5 rounded-2xl border border-teal-100">
                          <div className="font-extrabold text-base">{emp.leaveQuotas?.sick ?? 30}</div>
                          <div className="text-[10px] text-teal-600 font-semibold">ลาป่วย</div>
                        </div>
                        <div className="bg-indigo-50 text-indigo-800 p-2.5 rounded-2xl border border-indigo-100">
                          <div className="font-extrabold text-base">{emp.leaveQuotas?.personal ?? 45}</div>
                          <div className="text-[10px] text-indigo-600 font-semibold">ลากิจ</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center font-medium">
                      <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" /> สังกัดส่วนราชการที่ {deptRank}
                    </span>
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={() => triggerQuickPhotoUpload(emp)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                        title="อัปโหลด/เปลี่ยนรูปถ่าย"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">รูปถ่าย</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickSignatureUpload(emp)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                          emp.signatureUrl 
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title={emp.signatureUrl ? 'มีลายเซ็นดิจิทัลแล้ว (คลิกเพื่อเปลี่ยน)' : 'แนบลายเซ็นดิจิทัล'}
                      >
                        <PenTool className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">{emp.signatureUrl ? 'มีลายเซ็น' : '+ลายเซ็น'}</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                        title="แก้ไขข้อมูล / ลายเซ็น / รูปถ่าย"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
                            onDeleteEmployee(emp.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="ลบพนักงาน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. GROUPED VIEW (BY CAREER TRACK OR BY DEPARTMENT) */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {/* Sub-toggle for grouping type */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">รูปแบบการจัดกลุ่ม:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setGroupingMode('career_track')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  groupingMode === 'career_track'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จัดกลุ่มตาม 7 สายงานราชการ (บริหาร &gt; อำนวยการ &gt; วิชาการ...)
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('department')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  groupingMode === 'department'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จัดกลุ่มตามส่วนราชการ (สำนักปลัด &gt; กองคลัง &gt; กองช่าง...)
              </button>
            </div>
          </div>

          {groupingMode === 'career_track' ? (
            groupedByTrack.map(group => (
              <div key={group.track} className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {group.index}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                        <span>สายงาน{group.track}</span>
                      </h3>
                      <p className="text-xs text-slate-500">ลำดับสายงานที่ {group.index} ตามระเบียบบริหารงานบุคคลส่วนท้องถิ่น</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-emerald-800 font-bold text-xs rounded-xl shadow-2xs">
                    {group.employees.length} บุคลากร
                  </span>
                </div>

                <div className="p-4 sm:p-6">
                  {group.employees.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center">ไม่มีบุคลากรในสายงานนี้</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.employees.map(emp => {
                        const photo = emp.photoUrl || emp.avatar;
                        return (
                          <div key={emp.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all">
                            <div className="flex items-center space-x-3.5">
                              {photo ? (
                                <div
                                  onClick={() => setPreviewPhotoData({ url: photo, name: emp.name, position: emp.position, department: emp.department })}
                                  className="cursor-pointer relative group shrink-0"
                                  title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                                >
                                  <img
                                    src={photo}
                                    alt={emp.name}
                                    referrerPolicy="no-referrer"
                                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-sm group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              ) : (
                                <div 
                                  onClick={() => triggerQuickPhotoUpload(emp)}
                                  className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 rounded-2xl flex flex-col items-center justify-center font-bold text-xs border-2 border-dashed border-amber-300 hover:border-emerald-500 cursor-pointer shrink-0 shadow-2xs group"
                                  title="คลิกเพื่อเพิ่มรูปถ่าย"
                                >
                                  <User className="w-5 h-5 text-amber-700 mb-0.5 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] bg-amber-200/90 text-amber-900 px-1 rounded font-bold">ไม่มีรูป</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{emp.name}</h4>
                                <p className="text-xs text-emerald-700 font-semibold truncate mt-0.5">{emp.position}</p>
                                <span className="text-[10px] text-slate-500 font-medium">{emp.department} • {emp.personnelType}</span>
                                {emp.startDate && (
                                  <p className="text-[10px] text-emerald-700 font-medium flex items-center mt-0.5">
                                    <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
                                    <span>บรรจุ: {formatThaiDateDisplay(emp.startDate)}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => triggerQuickPhotoUpload(emp)}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 cursor-pointer"
                                title="อัปโหลด/เปลี่ยนรูปถ่าย"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerQuickSignatureUpload(emp)}
                                className={`p-2 rounded-xl border cursor-pointer ${
                                  emp.signatureUrl 
                                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' 
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title={emp.signatureUrl ? 'มีลายเซ็นดิจิทัลแล้ว (คลิกเปลี่ยน)' : 'แนบลายเซ็นดิจิทัล'}
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
                                    onDeleteEmployee(emp.id);
                                  }
                                }}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 cursor-pointer"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            groupedByDept.map(group => (
              <div key={group.dept} className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {group.index}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{group.dept}</h3>
                      <p className="text-xs text-slate-500">ลำดับที่ {group.index} ตามโครงสร้างเทศบาลตำบลทุ่งช้าง</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-emerald-800 font-bold text-xs rounded-xl shadow-2xs">
                    {group.employees.length} บุคลากร
                  </span>
                </div>

                <div className="p-4 sm:p-6">
                  {group.employees.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center">ไม่มีบุคลากรในสังกัดนี้</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.employees.map(emp => {
                        const photo = emp.photoUrl || emp.avatar;
                        return (
                          <div key={emp.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all">
                            <div className="flex items-center space-x-3.5">
                              {photo ? (
                                <div
                                  onClick={() => setPreviewPhotoData({ url: photo, name: emp.name, position: emp.position, department: emp.department })}
                                  className="cursor-pointer relative group shrink-0"
                                  title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                                >
                                  <img
                                    src={photo}
                                    alt={emp.name}
                                    referrerPolicy="no-referrer"
                                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-sm group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              ) : (
                                <div 
                                  onClick={() => triggerQuickPhotoUpload(emp)}
                                  className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 rounded-2xl flex flex-col items-center justify-center font-bold text-xs border-2 border-dashed border-amber-300 hover:border-emerald-500 cursor-pointer shrink-0 shadow-2xs group"
                                  title="คลิกเพื่อเพิ่มรูปถ่าย"
                                >
                                  <User className="w-5 h-5 text-amber-700 mb-0.5 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] bg-amber-200/90 text-amber-900 px-1 rounded font-bold">ไม่มีรูป</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{emp.name}</h4>
                                <p className="text-xs text-emerald-700 font-semibold truncate mt-0.5">{emp.position}</p>
                                <span className="text-[10px] text-slate-500 font-medium">{emp.personnelType} • {emp.phone}</span>
                                {emp.startDate && (
                                  <p className="text-[10px] text-emerald-700 font-medium flex items-center mt-0.5">
                                    <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
                                    <span>บรรจุ: {formatThaiDateDisplay(emp.startDate)}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => triggerQuickPhotoUpload(emp)}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 cursor-pointer"
                                title="อัปโหลด/เปลี่ยนรูปถ่าย"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerQuickSignatureUpload(emp)}
                                className={`p-2 rounded-xl border cursor-pointer ${
                                  emp.signatureUrl 
                                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' 
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title={emp.signatureUrl ? 'มีลายเซ็นดิจิทัลแล้ว (คลิกเปลี่ยน)' : 'แนบลายเซ็นดิจิทัล'}
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
                                    onDeleteEmployee(emp.id);
                                  }
                                }}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 cursor-pointer"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. OFFICIAL TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <TableIcon className="w-4 h-4 text-emerald-700" />
              <span>ตารางข้อมูลบุคลากร เรียงตามสายงาน (บริหาร &gt; อำนวยการ &gt; วิชาการ &gt; ทั่วไป &gt; ครู &gt; ลูกจ้างประจำ &gt; พนักงานจ้าง)</span>
            </h3>
            <span className="text-xs text-slate-500">รวม {sortedAndFilteredEmployees.length} คน</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                  <th className="py-3.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-3.5 px-3 text-center w-20">รูปถ่าย</th>
                  <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3.5 px-4">ตำแหน่ง</th>
                  <th className="py-3.5 px-4">สายงาน</th>
                  <th className="py-3.5 px-4">สังกัดส่วนราชการ</th>
                  <th className="py-3.5 px-4">ประเภทบุคลากร</th>
                  <th className="py-3.5 px-4">เบอร์โทร</th>
                  <th className="py-3.5 px-3 text-center">วันที่บรรจุ</th>
                  <th className="py-3.5 px-3 text-center">พักผ่อน</th>
                  <th className="py-3.5 px-3 text-center">ลาป่วย</th>
                  <th className="py-3.5 px-3 text-center">ลากิจ</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAndFilteredEmployees.map((emp, idx) => {
                  const photo = emp.photoUrl || emp.avatar;
                  const track = getEmployeeCareerTrack(emp);
                  const deptRank = getDepartmentOrderIndex(emp.department) + 1;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="relative inline-block group">
                          {photo ? (
                            <img
                              src={photo}
                              alt={emp.name}
                              referrerPolicy="no-referrer"
                              onClick={() => setPreviewPhotoData({ url: photo, name: emp.name, position: emp.position, department: emp.department })}
                              className="w-14 h-14 rounded-2xl object-cover mx-auto border-2 border-emerald-400/40 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                              title="คลิกดูรูปใหญ่"
                            />
                          ) : (
                            <div 
                              onClick={() => triggerQuickPhotoUpload(emp)}
                              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 font-bold mx-auto flex flex-col items-center justify-center text-[10px] border-2 border-dashed border-amber-300 hover:border-emerald-500 cursor-pointer shadow-2xs group"
                              title="คลิกเพื่อเพิ่มรูปถ่าย"
                            >
                              <User className="w-5 h-5 text-amber-700 mb-0.5 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] bg-amber-200/90 text-amber-900 px-1 rounded font-bold leading-tight">ไม่มีรูป</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">{emp.name}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{emp.position}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${getTrackBadgeColor(track)}`}>
                          {track}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {deptRank}. {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{emp.personnelType}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{emp.phone}</td>
                      <td className="py-3 px-3 text-center text-slate-700 font-medium whitespace-nowrap">
                        {emp.startDate ? formatThaiDateDisplay(emp.startDate) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700 text-sm">{emp.leaveQuotas?.vacation ?? 10}</td>
                      <td className="py-3 px-3 text-center font-bold text-teal-700 text-sm">{emp.leaveQuotas?.sick ?? 30}</td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-700 text-sm">{emp.leaveQuotas?.personal ?? 45}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => triggerQuickPhotoUpload(emp)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl cursor-pointer"
                            title="อัปโหลด/เปลี่ยนรูปถ่าย"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerQuickSignatureUpload(emp)}
                            className={`p-2 rounded-xl cursor-pointer ${
                              emp.signatureUrl 
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title={emp.signatureUrl ? 'มีลายเซ็นดิจิทัลแล้ว (คลิกเปลี่ยน)' : 'แนบลายเซ็นดิจิทัล'}
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden quick photo input */}
      <input
        type="file"
        ref={quickPhotoInputRef}
        onChange={handleQuickPhotoFileSelected}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden quick signature input */}
      <input
        type="file"
        ref={quickSignatureInputRef}
        onChange={handleQuickSignatureFileSelected}
        accept="image/*"
        className="hidden"
      />

      {/* Lightbox / High-Resolution Photo Viewer Modal */}
      {previewPhotoData && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoData(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">รูปถ่ายบุคลากร</h3>
              <button 
                onClick={() => setPreviewPhotoData(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-100">
              <img 
                src={previewPhotoData.url} 
                alt={previewPhotoData.name} 
                referrerPolicy="no-referrer"
                className="w-full max-h-96 object-contain mx-auto"
              />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-extrabold text-slate-900 text-lg">{previewPhotoData.name}</h4>
              <p className="text-sm text-emerald-700 font-semibold">{previewPhotoData.position}</p>
              <p className="text-xs text-slate-500">{previewPhotoData.department}</p>
            </div>

            <button
              onClick={() => setPreviewPhotoData(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-xs transition-all shadow-sm"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <EmployeeModal
        employee={editingEmployee}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
      />

      {/* Batch Photo Attachment Modal */}
      <BatchPhotoUploadModal
        isOpen={isBatchPhotoModalOpen}
        onClose={() => setIsBatchPhotoModalOpen(false)}
        employees={employees}
        onUpdateEmployee={onUpdateEmployee}
      />

      {/* Batch Signature Upload Modal */}
      <BatchSignatureUploadModal
        isOpen={isBatchSignatureModalOpen}
        onClose={() => setIsBatchSignatureModalOpen(false)}
        employees={employees}
        onUpdateEmployee={onUpdateEmployee}
      />
    </div>
  );
};
