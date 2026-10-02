import React, { useState } from 'react';
import { 
  AdminUser, 
  AdminRole, 
  ORDERED_DEPARTMENTS, 
  Department 
} from '../types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Sparkles,
  RefreshCw,
  AlertTriangle,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AdminUsersManagementViewProps {
  adminUsers: AdminUser[];
  currentAdmin: AdminUser | null;
  onAddAdminUser: (newUser: AdminUser) => void;
  onUpdateAdminUser: (updatedUser: AdminUser) => void;
  onDeleteAdminUser: (id: string) => void;
}

export const AdminUsersManagementView: React.FC<AdminUsersManagementViewProps> = ({
  adminUsers,
  currentAdmin,
  onAddAdminUser,
  onUpdateAdminUser,
  onDeleteAdminUser
}) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    password: string;
    position: string;
    department: string;
    role: AdminRole;
    email: string;
    phone: string;
    isActive: boolean;
  }>({
    name: '',
    username: '',
    password: '',
    position: '',
    department: 'สำนักปลัดเทศบาล',
    role: 'officer',
    email: '',
    phone: '',
    isActive: true
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      position: '',
      department: 'สำนักปลัดเทศบาล',
      role: 'hr_officer',
      email: '',
      phone: '',
      isActive: true
    });
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      position: user.position,
      department: user.department,
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
      isActive: user.isActive
    });
    setIsAddModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('กรุณากรอกชื่อและชื่อผู้ใช้งาน');
      return;
    }

    if (editingUser) {
      const updated: AdminUser = {
        ...editingUser,
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password.trim() || editingUser.password || 'password123',
        position: formData.position.trim(),
        department: formData.department,
        role: formData.role,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        isActive: formData.isActive
      };
      onUpdateAdminUser(updated);
    } else {
      if (!formData.password.trim()) {
        alert('กรุณากำหนดรหัสผ่านสำหรับเจ้าหน้าที่ใหม่');
        return;
      }
      const newUser: AdminUser = {
        id: `admin_${Date.now()}`,
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password.trim(),
        position: formData.position.trim(),
        department: formData.department,
        role: formData.role,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        isActive: formData.isActive,
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: '-'
      };
      onAddAdminUser(newUser);
    }

    setIsAddModalOpen(false);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword.trim()) return;

    const updated: AdminUser = {
      ...resetPasswordUser,
      password: newPassword.trim()
    };
    onUpdateAdminUser(updated);
    setResetPasswordUser(null);
    setNewPassword('');
    alert(`รีเซ็ตรหัสผ่านของ "${resetPasswordUser.name}" เรียบร้อยแล้ว`);
  };

  // Filtered Users
  const filteredUsers = adminUsers.filter(user => {
    const matchSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = roleFilter === 'all' || user.role === roleFilter;

    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
            <span>👑</span>
            <span>ผู้ดูแลระบบสูงสุด</span>
          </span>
        );
      case 'hr_officer':
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
            <span>📋</span>
            <span>เจ้าหน้าที่งานบุคคล</span>
          </span>
        );
      case 'approver':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
            <span>✍️</span>
            <span>ผู้มีอำนาจลงนาม</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
            <span>👤</span>
            <span>เจ้าหน้าที่ทั่วไป</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.primaryGradient} opacity-10 rounded-full blur-3xl pointer-events-none`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                การจัดการสิทธิ์และความปลอดภัย
              </span>
              <span className="text-xs text-slate-400">ระบบบริหารราชการภายใน</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <span>จัดการบัญชีเจ้าหน้าที่และผู้ดูแลระบบ</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              เพิ่ม กำหนดสิทธิ์ และควบคุมการเข้าถึงระบบหลังบ้านสำหรับบุคลากรที่ได้รับมอบหมาย
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className={`bg-gradient-to-r ${theme.primaryGradient} hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-950/40 flex items-center space-x-2 self-start md:self-auto active:scale-95 transition-all cursor-pointer`}
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มเจ้าหน้าที่เข้าระบบ</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400">เจ้าหน้าที่ทั้งหมด</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{adminUsers.length} <span className="text-xs font-normal text-slate-400">คน</span></p>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400">สถานะใช้งานปกติ</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {adminUsers.filter(u => u.isActive).length} <span className="text-xs font-normal text-slate-400">คน</span>
            </p>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400">ผู้ดูแลระบบสูงสุด</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {adminUsers.filter(u => u.role === 'super_admin').length} <span className="text-xs font-normal text-slate-400">คน</span>
            </p>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400">งานการเจ้าหน้าที่ (HR)</p>
            <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
              {adminUsers.filter(u => u.role === 'hr_officer').length} <span className="text-xs font-normal text-slate-400">คน</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, ตำแหน่ง, ชื่อผู้ใช้..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium shrink-0">สิทธิ์:</span>
          {['all', 'super_admin', 'hr_officer', 'approver', 'officer'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                roleFilter === role
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'all' && 'ทั้งหมด'}
              {role === 'super_admin' && 'ผู้ดูแลระบบ'}
              {role === 'hr_officer' && 'งานบุคคล'}
              {role === 'approver' && 'ผู้อนุมัติ'}
              {role === 'officer' && 'เจ้าหน้าที่'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6">เจ้าหน้าที่</th>
                <th className="py-3.5 px-4">ชื่อผู้ใช้ (Username)</th>
                <th className="py-3.5 px-4">ตำแหน่งและสังกัด</th>
                <th className="py-3.5 px-4">ระดับสิทธิ์</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <User className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="font-semibold">ไม่พบข้อมูลเจ้าหน้าที่ตามเงื่อนไขที่ค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-100 shadow-xs shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {currentAdmin?.id === user.id && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                บัญชีคุณ
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                            {user.phone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{user.phone}</span>
                              </span>
                            )}
                            {user.email && (
                              <span className="flex items-center space-x-1 hidden sm:inline-flex">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{user.email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {user.username}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-800 text-xs sm:text-sm">{user.position || '-'}</p>
                      <p className="text-xs text-slate-500">{user.department || '-'}</p>
                    </td>

                    <td className="py-4 px-4">
                      {getRoleBadge(user.role)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {user.isActive ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ใช้งานอยู่</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-500 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>ระงับสิทธิ์</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setResetPasswordUser(user);
                            setNewPassword('');
                          }}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="เปลี่ยน/รีเซ็ตรหัสผ่าน"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {adminUsers.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`คุณแน่ใจว่าต้องการลบบัญชีเจ้าหน้าที่ "${user.name}" (${user.username}) หรือไม่?`)) {
                                onDeleteAdminUser(user.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="ลบบัญชี"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Admin User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingUser ? 'แก้ไขข้อมูลเจ้าหน้าที่' : 'เพิ่มเจ้าหน้าที่เข้าระบบ'}
                  </h3>
                  <p className="text-xs text-slate-500">กำหนดชื่อ บัญชีผู้ใช้ สิทธิ์ และรหัสผ่าน</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น นายประเสริฐ จิตมั่น"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ชื่อผู้ใช้งาน (Username) *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="เช่น officer_hr"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {editingUser ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน (Password) *'}
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'เว้นว่างไว้หากใช้รหัสเดิม' : 'กำหนดรหัสผ่าน'}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="เช่น เจ้าพนักงานธุรการปฏิบัติงาน"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">สังกัด</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ORDERED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ระดับสิทธิ์การใช้งาน (Role) *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="super_admin">👑 ผู้ดูแลระบบสูงสุด (Super Admin - จัดการได้ทุกอย่าง)</option>
                  <option value="hr_officer">📋 เจ้าหน้าที่งานบุคคล (HR Officer - จัดการวันลา บุคลากร รายงาน)</option>
                  <option value="approver">✍️ ผู้มีอำนาจลงนาม/อนุมัติ (Approver - พิจารณาและอนุมัติคำขอ)</option>
                  <option value="officer">👤 เจ้าหน้าที่ทั่วไป (Officer - ดูข้อมูลและบันทึกทั่วไป)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="เช่น user@thungchang.go.th"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">เปิดใช้งานบัญชีนี้ (Active)</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${theme.primaryGradient} hover:opacity-95 shadow-md`}
                >
                  บันทึกข้อมูลเจ้าหน้าที่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h3>
                  <p className="text-xs text-slate-500">{resetPasswordUser.name} ({resetPasswordUser.username})</p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">กำหนดรหัสผ่านใหม่ *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md"
                >
                  อัปเดตรหัสผ่าน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
