import React, { useState } from 'react';
import { TabType, AppMode, AdminUser } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  Users, 
  Sparkles,
  MoreHorizontal,
  FileText,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Lock,
  ExternalLink,
  PlusCircle,
  Clock,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  appMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  currentAdmin: AdminUser | null;
  onOpenAdminLogin: () => void;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAILeaveModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  appMode,
  onSwitchMode,
  currentAdmin,
  onOpenAdminLogin,
  currentTab,
  onTabChange,
  onOpenAILeaveModal,
}) => {
  const { theme } = useTheme();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard' as TabType, label: 'หน้าหลัก', icon: LayoutDashboard },
    { id: 'calendar' as TabType, label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'leave-list' as TabType, label: 'รายการลา', icon: ClipboardList },
    { id: 'employees' as TabType, label: 'บุคลากร', icon: Users },
  ];

  const reportTabs = [
    { id: 'admin-users' as TabType, label: 'จัดการเจ้าหน้าที่ & สิทธิ์', icon: ShieldCheck, desc: 'เพิ่ม ลบ กำหนดสิทธิ์ผู้ดูแลระบบ' },
    { id: 'reports-daily-monthly' as TabType, label: 'รายงานรายวัน/รายเดือน', icon: FileText, desc: 'สรุปการลาประจำวันและประจำเดือน' },
    { id: 'reports-fiscal-quarter' as TabType, label: 'สรุปงบประมาณ/ไตรมาส', icon: BarChart3, desc: 'สถิติแยกตามไตรมาสและปีงบประมาณ' },
    { id: 'reports-individual' as TabType, label: 'รายงานรายบุคคล', icon: UserCheck, desc: 'ตรวจสอบประวัติวันลาของแต่ละท่าน' },
    { id: 'ai-advisor' as TabType, label: 'ที่ปรึกษา AI ระเบียบลา', icon: Sparkles, desc: 'วิเคราะห์สิทธิวันลาตามระเบียบราชการ' },
  ];

  if (appMode === 'portal') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 md:hidden px-3 py-2 pb-safe shadow-2xl shadow-slate-950 flex items-center justify-around">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center text-slate-300 hover:text-white"
        >
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] mt-0.5 font-bold">ยื่นคำขอลา</span>
        </button>

        {currentAdmin ? (
          <button
            onClick={() => onSwitchMode('backoffice')}
            className="flex items-center space-x-1.5 bg-emerald-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>เข้าสู่ระบบหลังบ้าน</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-2xl text-xs font-bold shadow-md"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>เข้าสู่ระบบเจ้าหน้าที่</span>
          </button>
        )}
      </nav>
    );
  }

  return (
    <>
      {/* Slide-Up Drawer for More Reports & Admin Users on Smartphone */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 md:hidden flex items-end animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t border-slate-800 text-white w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${theme.dotColor}`}></span>
                <h3 className="font-bold text-base text-white">เมนูเพิ่มเติม & จัดการสิทธิ์</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {reportTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl text-left transition-all ${
                      isActive
                        ? `${theme.primaryBg} text-white shadow-lg`
                        : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-black/20 text-white' : `bg-slate-700 ${theme.accentText}`}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{tab.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onSwitchMode('portal');
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-950/80 border border-indigo-700 text-indigo-200 py-3 rounded-2xl text-xs font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>สลับไปหน้าบริการพนักงาน (Portal)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Smartphone Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 md:hidden px-2 py-1.5 pb-safe shadow-2xl shadow-slate-950">
        <div className="grid grid-cols-5 items-center justify-between max-w-md mx-auto">
          {mainTabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                  isActive ? `${theme.accentText} font-bold` : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? `scale-110 ${theme.accentText}` : ''}`} />
                </div>
                <span className="text-[10px] truncate max-w-[64px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}

          {/* Center AI Quick Scanner Floating Action Button */}
          <div className="flex justify-center relative -top-3">
            <button
              onClick={onOpenAILeaveModal}
              className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${theme.primaryGradient} text-white flex flex-col items-center justify-center shadow-lg shadow-slate-950/80 border-2 border-slate-900 ring-2 ${theme.primaryRing} active:scale-90 transition-transform`}
              title="สแกนใบลา AI"
            >
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              <span className="text-[9px] font-extrabold tracking-tight">สแกน AI</span>
            </button>
          </div>

          {mainTabs.slice(2, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                  isActive ? `${theme.accentText} font-bold` : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? `scale-110 ${theme.accentText}` : ''}`} />
                </div>
                <span className="text-[10px] truncate max-w-[64px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              reportTabs.some(r => r.id === currentTab)
                ? `${theme.accentText} font-bold`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${reportTabs.some(r => r.id === currentTab) ? 'bg-white/10' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] truncate max-w-[64px] mt-0.5">เมนู...</span>
          </button>
        </div>
      </nav>
    </>
  );
};
