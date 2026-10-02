import React, { useState, useEffect } from 'react';
import { TabType, AppMode, LeaveRecord, Employee, LeaveStatus, AdminUser } from './types';
import { INITIAL_EMPLOYEES, INITIAL_LEAVE_RECORDS } from './data/mockData';
import { INITIAL_ADMIN_USERS } from './data/mockAdminUsers';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { LeaveListView } from './components/LeaveListView';
import { EmployeeManagementView } from './components/EmployeeManagementView';
import { AdminUsersManagementView } from './components/AdminUsersManagementView';
import { EmployeePortalView } from './components/EmployeePortalView';
import { DailyMonthlyReportView } from './components/DailyMonthlyReportView';
import { FiscalQuarterReportView } from './components/FiscalQuarterReportView';
import { IndividualReportView } from './components/IndividualReportView';
import { HolidayManagementView } from './components/HolidayManagementView';
import { AIAssistantView } from './components/AIAssistantView';
import { LeaveModal } from './components/LeaveModal';
import { AILeaveUploadModal } from './components/AILeaveUploadModal';
import { EmployeeModal } from './components/EmployeeModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Building2, ShieldCheck, Cloud, RefreshCw } from 'lucide-react';
import logoImg from './assets/logo.jpg';
import { safeLocalStorageSet } from './utils/imageOptimizer';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  initializeFirestoreDatabase,
  subscribeToEmployees,
  subscribeToLeaveRecords,
  subscribeToAdminUsers,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  deleteMultipleEmployeesFromFirestore,
  saveLeaveRecordToFirestore,
  deleteLeaveRecordFromFirestore,
  deleteMultipleLeaveRecordsFromFirestore,
  saveAdminUserToFirestore,
  deleteAdminUserFromFirestore
} from './lib/firebase';

function MainApp() {
  const { theme } = useTheme();
  
  // App Mode: 'portal' (Employee Front-end) or 'backoffice' (Admin Management)
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('thungchang_app_mode');
    return (savedMode === 'backoffice' || savedMode === 'portal') ? savedMode : 'portal';
  });

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Current logged in Administrator
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('thungchang_current_admin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved current admin", e);
      }
    }
    return null;
  });

  // Admin Users List
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('thungchang_admin_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved admin users", e);
      }
    }
    return INITIAL_ADMIN_USERS;
  });
  
  // Persist employees and leave records in state & localStorage cache
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('thungchang_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved employees", e);
      }
    }
    return INITIAL_EMPLOYEES;
  });

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => {
    const saved = localStorage.getItem('thungchang_leave_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved leave records", e);
      }
    }
    return INITIAL_LEAVE_RECORDS;
  });

  // Real-time Cloud Sync with Firebase Firestore across all devices
  useEffect(() => {
    // 1. Initialize Firestore collections with existing local or default records if empty
    initializeFirestoreDatabase(employees, leaveRecords, adminUsers).then(() => {
      setIsCloudSynced(true);
    });

    // 2. Real-time listener for employees
    const unsubscribeEmployees = subscribeToEmployees((cloudEmployees) => {
      if (cloudEmployees && cloudEmployees.length > 0) {
        setEmployees(cloudEmployees);
        safeLocalStorageSet('thungchang_employees', JSON.stringify(cloudEmployees));
        setIsCloudSynced(true);
      }
    });

    // 3. Real-time listener for leave records
    const unsubscribeLeave = subscribeToLeaveRecords((cloudLeaveRecords) => {
      if (cloudLeaveRecords && cloudLeaveRecords.length > 0) {
        setLeaveRecords(cloudLeaveRecords);
        safeLocalStorageSet('thungchang_leave_records', JSON.stringify(cloudLeaveRecords));
        setIsCloudSynced(true);
      }
    });

    // 4. Real-time listener for admin users
    const unsubscribeAdmins = subscribeToAdminUsers((cloudAdmins) => {
      if (cloudAdmins && cloudAdmins.length > 0) {
        setAdminUsers(cloudAdmins);
        safeLocalStorageSet('thungchang_admin_users', JSON.stringify(cloudAdmins));
        setIsCloudSynced(true);
      }
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeLeave();
      unsubscribeAdmins();
    };
  }, []);

  useEffect(() => {
    safeLocalStorageSet('thungchang_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    safeLocalStorageSet('thungchang_leave_records', JSON.stringify(leaveRecords));
  }, [leaveRecords]);

  useEffect(() => {
    safeLocalStorageSet('thungchang_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    safeLocalStorageSet('thungchang_app_mode', appMode);
  }, [appMode]);

  useEffect(() => {
    if (currentAdmin) {
      safeLocalStorageSet('thungchang_current_admin', JSON.stringify(currentAdmin));
    } else {
      localStorage.removeItem('thungchang_current_admin');
    }
  }, [currentAdmin]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeaveRecord, setEditingLeaveRecord] = useState<LeaveRecord | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isQuickEmpModalOpen, setIsQuickEmpModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleOpenEditLeave = (record: LeaveRecord) => {
    setEditingLeaveRecord(record);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: LeaveStatus) => {
    const targetRecord = leaveRecords.find(r => r.id === id);
    if (!targetRecord) return;

    const updatedRecord: LeaveRecord = {
      ...targetRecord,
      status,
      approvedBy: status === 'อนุมัติ' 
        ? (currentAdmin ? `${currentAdmin.name} (${currentAdmin.position})` : 'นายสมชาย ใจดี (ปลัดเทศบาล)') 
        : targetRecord.approvedBy
    };

    setLeaveRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));
    
    // Save to Firestore for cross-device sync
    try {
      await saveLeaveRecordToFirestore(updatedRecord);
    } catch (err) {
      console.error('Error saving to Firestore:', err);
    }

    const empName = targetRecord.employeeName;
    const statusLabel = status === 'อนุมัติ' ? 'อนุมัติคำขอลา' : status === 'ไม่อนุมัติ' ? 'ปฏิเสธคำขอลา' : 'อัปเดตสถานะ';
    showToast(`🔔 แจ้งเตือนสถานะ: ${statusLabel}ของ "${empName}" เป็น "${status}" เรียบร้อยแล้ว (ซิงค์ทุกเครื่องทันที)`, status === 'อนุมัติ' ? 'success' : 'warning');
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('คุณต้องการลบรายการใบลาตินนี้ใช่หรือไม่?')) {
      setLeaveRecords(prev => prev.filter(r => r.id !== id));
      try {
        await deleteLeaveRecordFromFirestore(id);
      } catch (err) {
        console.error('Error deleting from Firestore:', err);
      }
      showToast('ลบรายการใบลาสำเร็จ', 'warning');
    }
  };

  const handleDeleteRecords = async (ids: string[]) => {
    if (window.confirm(`คุณต้องการลบรายการใบลาที่เลือกจำนวน ${ids.length} รายการใช่หรือไม่?`)) {
      setLeaveRecords(prev => prev.filter(r => !ids.includes(r.id)));
      try {
        await deleteMultipleLeaveRecordsFromFirestore(ids);
      } catch (err) {
        console.error('Error deleting multiple from Firestore:', err);
      }
      showToast(`ลบรายการใบลาที่เลือกจำนวน ${ids.length} รายการสำเร็จ`, 'warning');
    }
  };

  const handleAddNewLeave = async (record: LeaveRecord) => {
    const isExisting = leaveRecords.some(r => r.id === record.id);
    if (isExisting) {
      // Update existing record
      setLeaveRecords(prev => prev.map(r => r.id === record.id ? record : r));
      try {
        await saveLeaveRecordToFirestore(record);
      } catch (err) {
        console.error('Error updating leave in Firestore:', err);
      }
      showToast(`แก้ไขรายละเอียดวันลาของ "${record.employeeName}" สำเร็จ (ซิงค์ทุกอุปกรณ์แล้ว)`, 'success');
    } else {
      // Add new record
      setLeaveRecords(prev => [record, ...prev]);
      try {
        await saveLeaveRecordToFirestore(record);
      } catch (err) {
        console.error('Error adding leave to Firestore:', err);
      }
      showToast(`บันทึกคำขอลาใหม่ของ "${record.employeeName}" สำเร็จ (ซิงค์ทุกอุปกรณ์แล้ว)`, 'success');
    }
  };

  const handleAddEmployee = async (newEmp: Employee) => {
    setEmployees(prev => [newEmp, ...prev]);
    try {
      await saveEmployeeToFirestore(newEmp);
    } catch (err) {
      console.error('Error adding employee to Firestore:', err);
    }
    showToast(`เพิ่มข้อมูลบุคลากร "${newEmp.name}" สำเร็จ (ซิงค์ทุกอุปกรณ์แล้ว)`, 'success');
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    try {
      await saveEmployeeToFirestore(updatedEmp);
    } catch (err) {
      console.error('Error updating employee to Firestore:', err);
    }
    showToast(`แก้ไขข้อมูลบุคลากร "${updatedEmp.name}" สำเร็จ (ซิงค์ทุกอุปกรณ์แล้ว)`, 'success');
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    try {
      await deleteEmployeeFromFirestore(id);
    } catch (err) {
      console.error('Error deleting employee from Firestore:', err);
    }
    showToast('ลบข้อมูลบุคลากรสำเร็จ', 'warning');
  };

  const handleDeleteEmployees = async (ids: string[]) => {
    if (window.confirm(`คุณต้องการลบข้อมูลบุคลากรที่เลือกจำนวน ${ids.length} รายการใช่หรือไม่?`)) {
      setEmployees(prev => prev.filter(e => !ids.includes(e.id)));
      try {
        await deleteMultipleEmployeesFromFirestore(ids);
      } catch (err) {
        console.error('Error deleting employees from Firestore:', err);
      }
      showToast(`ลบข้อมูลบุคลากรที่เลือกจำนวน ${ids.length} รายการสำเร็จ`, 'warning');
    }
  };

  // Admin User Management Handlers
  const handleAddAdminUser = async (newAdmin: AdminUser) => {
    setAdminUsers(prev => [newAdmin, ...prev]);
    try {
      await saveAdminUserToFirestore(newAdmin);
    } catch (err) {
      console.error('Error adding admin user to Firestore:', err);
    }
    showToast(`เพิ่มเจ้าหน้าที่ "${newAdmin.name}" เข้าระบบเรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateAdminUser = async (updatedAdmin: AdminUser) => {
    setAdminUsers(prev => prev.map(u => u.id === updatedAdmin.id ? updatedAdmin : u));
    if (currentAdmin && currentAdmin.id === updatedAdmin.id) {
      setCurrentAdmin(updatedAdmin);
    }
    try {
      await saveAdminUserToFirestore(updatedAdmin);
    } catch (err) {
      console.error('Error updating admin user to Firestore:', err);
    }
    showToast(`อัปเดตข้อมูลเจ้าหน้าที่ "${updatedAdmin.name}" สำเร็จ`, 'success');
  };

  const handleDeleteAdminUser = async (id: string) => {
    setAdminUsers(prev => prev.filter(u => u.id !== id));
    try {
      await deleteAdminUserFromFirestore(id);
    } catch (err) {
      console.error('Error deleting admin user from Firestore:', err);
    }
    showToast('ลบบัญชีเจ้าหน้าที่สำเร็จ', 'warning');
  };

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setCurrentAdmin(user);
    setAppMode('backoffice');
    showToast(`ยินดีต้อนรับ ${user.name} เข้าสู่ระบบจัดการหลังบ้าน`, 'success');
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    setAppMode('portal');
    showToast('ออกจากระบบหลังบ้านเรียบร้อยแล้ว', 'warning');
  };

  const handleSwitchMode = (mode: AppMode) => {
    if (mode === 'backoffice' && !currentAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    setAppMode(mode);
  };

  return (
    <div className={`min-h-screen ${theme.appBackground} flex flex-col font-sans text-slate-900 selection:bg-indigo-600 selection:text-white relative transition-colors duration-200`}>
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-white border ${
            toast.type === 'success' ? 'bg-emerald-900 border-emerald-700' : 'bg-slate-900 border-slate-700'
          }`}>
            <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        appMode={appMode}
        onSwitchMode={handleSwitchMode}
        currentAdmin={currentAdmin}
        onLogoutAdmin={handleAdminLogout}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewLeaveModal={() => {
          setEditingLeaveRecord(null);
          setIsModalOpen(true);
        }}
        onOpenAILeaveModal={() => setIsAIModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8">
        {/* Front-End Portal Mode */}
        {appMode === 'portal' ? (
          <EmployeePortalView
            employees={employees}
            leaveRecords={leaveRecords}
            onSubmitLeave={handleAddNewLeave}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            currentAdmin={currentAdmin}
            onSwitchToBackoffice={() => setAppMode('backoffice')}
          />
        ) : (
          /* Backoffice Mode with Tabs */
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                employees={employees}
                leaveRecords={leaveRecords}
                onNavigateTab={setCurrentTab}
                onOpenNewLeave={() => {
                  setEditingLeaveRecord(null);
                  setIsModalOpen(true);
                }}
                onOpenAILeave={() => setIsAIModalOpen(true)}
                onUpdateStatus={handleUpdateStatus}
                onEditRecord={handleOpenEditLeave}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                leaveRecords={leaveRecords}
                employees={employees}
                onEditRecord={handleOpenEditLeave}
              />
            )}

            {currentTab === 'leave-list' && (
              <LeaveListView
                leaveRecords={leaveRecords}
                employees={employees}
                currentAdmin={currentAdmin}
                onOpenNewLeave={() => {
                  setEditingLeaveRecord(null);
                  setIsModalOpen(true);
                }}
                onOpenAILeave={() => setIsAIModalOpen(true)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteRecord={handleDeleteRecord}
                onDeleteRecords={handleDeleteRecords}
                onUpdateEmployee={handleUpdateEmployee}
                onEditRecord={handleOpenEditLeave}
                onSaveRecord={handleAddNewLeave}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeeManagementView
                employees={employees}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onDeleteEmployees={handleDeleteEmployees}
              />
            )}

            {currentTab === 'admin-users' && (
              <AdminUsersManagementView
                adminUsers={adminUsers}
                currentAdmin={currentAdmin}
                onAddAdminUser={handleAddAdminUser}
                onUpdateAdminUser={handleUpdateAdminUser}
                onDeleteAdminUser={handleDeleteAdminUser}
              />
            )}

            {currentTab === 'reports-daily-monthly' && (
              <DailyMonthlyReportView
                leaveRecords={leaveRecords}
                employees={employees}
              />
            )}

            {currentTab === 'reports-fiscal-quarter' && (
              <FiscalQuarterReportView
                leaveRecords={leaveRecords}
              />
            )}

            {currentTab === 'reports-individual' && (
              <IndividualReportView
                employees={employees}
                leaveRecords={leaveRecords}
              />
            )}

            {currentTab === 'holidays' && (
              <HolidayManagementView />
            )}

            {currentTab === 'ai-advisor' && (
              <AIAssistantView
                leaveRecords={leaveRecords}
                employees={employees}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl p-0.5 flex items-center justify-center shadow-md border border-slate-700 overflow-hidden shrink-0">
              <img 
                src={logoImg} 
                alt="ตราสัญลักษณ์เทศบาลตำบลทุ่งช้าง" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white">ระบบควบคุมวันลาพนักงาน เทศบาลตำบลทุ่งช้าง</p>
              <p className="text-xs text-slate-400">อำเภอทุ่งช้าง จังหวัดน่าน 55130</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ระบบสารสนเทศเพื่อการบริหารราชการส่วนท้องถิ่น ซิงค์คลาวด์สด</span>
          </div>
        </div>
      </footer>

      {/* New / Edit Leave Modal */}
      <LeaveModal
        employees={employees}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLeaveRecord(null);
        }}
        onSubmit={handleAddNewLeave}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenAddEmployeeModal={() => setIsQuickEmpModalOpen(true)}
        editingRecord={editingLeaveRecord}
      />

      {/* AI Leave Document Scanner Modal */}
      <AILeaveUploadModal
        employees={employees}
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSubmit={handleAddNewLeave}
        onOpenAddEmployeeModal={() => setIsQuickEmpModalOpen(true)}
      />

      {/* Quick Add Employee Modal */}
      <EmployeeModal
        isOpen={isQuickEmpModalOpen}
        onClose={() => setIsQuickEmpModalOpen(false)}
        onSave={handleAddEmployee}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        adminUsers={adminUsers}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Smartphone Bottom Navigation */}
      <BottomNav
        appMode={appMode}
        onSwitchMode={handleSwitchMode}
        currentAdmin={currentAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAILeaveModal={() => setIsAIModalOpen(true)}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
