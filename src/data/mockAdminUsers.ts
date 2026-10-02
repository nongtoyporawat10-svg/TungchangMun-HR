import { AdminUser } from '../types';

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin_1',
    username: 'admin',
    password: 'password123',
    name: 'นายวินัย พนาขวา',
    position: 'นายกเทศมนตรีตำบลทุ่งช้าง',
    department: 'ผู้บริหารเทศบาล',
    role: 'super_admin',
    email: 'mayor@thungchang.go.th',
    phone: '081-881-2345',
    isActive: true,
    createdAt: '2025-10-01',
    lastLoginAt: '2026-08-18'
  },
  {
    id: 'admin_2',
    username: 'hr',
    password: 'password123',
    name: 'นางสาวสุพรรณี มีสา',
    position: 'นักทรัพยากรบุคคลชำนาญการ',
    department: 'สำนักปลัดเทศบาล',
    role: 'hr_officer',
    email: 'hr@thungchang.go.th',
    phone: '089-992-3456',
    isActive: true,
    createdAt: '2025-10-01',
    lastLoginAt: '2026-08-17'
  },
  {
    id: 'admin_3',
    username: 'clerk',
    password: 'password123',
    name: 'นางสาวติยภา สัจจา',
    position: 'หัวหน้าสำนักปลัด รักษาราชการแทนปลัดฯ',
    department: 'สำนักปลัดเทศบาล',
    role: 'approver',
    email: 'clerk@thungchang.go.th',
    phone: '084-567-8901',
    isActive: true,
    createdAt: '2025-10-01',
    lastLoginAt: '2026-08-16'
  }
];
