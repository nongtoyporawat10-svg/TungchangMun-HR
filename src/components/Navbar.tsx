import React, { useState } from 'react';
import { TabType, AppMode, AdminUser } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarCheck,
  ClipboardList, 
  Users,
  ShieldCheck,
  FileText, 
  BarChart3, 
  UserCheck, 
  Sparkles, 
  PlusCircle, 
  Building2, 
  CloudCheck, 
  Palette,
  Lock,
  LogOut,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  UserCheck2,
  ShieldAlert
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { useTheme } from '../context/ThemeContext';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  appMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  currentAdmin: AdminUser | null;
  onLogoutAdmin: () => void;
  onOpenAdminLogin: () => void;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenNewLeaveModal: () => void;
  onOpenAILeaveModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  appMode,
  onSwitchMode,
  currentAdmin,
  onLogoutAdmin,
  onOpenAdminLogin,
  currentTab, 
  onTabChange, 
  onOpenNewLeaveModal,
  onOpenAILeaveModal
}) => {
  const { theme } = useTheme();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const backofficeTabs = [
    { id: 'dashboard' as TabType, label: 'หน้าหลัก', icon: LayoutDashboard },
    { id: 'calendar' as TabType, label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'leave-list' as TabType, label: 'รายการวันลา', icon: ClipboardList },
    { id: 'employees' as TabType, label: 'จัดการบุคลากร', icon: Users },
    { id: 'admin-users' as TabType, label: 'จัดการเจ้าหน้าที่', icon: ShieldCheck },
    { id: 'reports-daily-monthly' as TabType, label: 'รายงานรายวัน/เดือน', icon: FileText },
    { id: 'reports-fiscal-quarter' as TabType, label: 'สรุปงบประมาณ/ไตรมาส', icon: BarChart3 },
    { id: 'reports-individual' as TabType, label: 'รายงานรายบุคคล', icon: UserCheck },
    { id: 'holidays' as TabType, label: 'จัดการวันหยุดราชการ', icon: CalendarCheck },
    { id: 'ai-advisor' as TabType, label: 'ผู้ช่วย AI', icon: Sparkles },
  ];

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-xl text-white shadow-lg shadow-slate-950/20 sticky top-0 z-30 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Municipality Branding & Mode Badge */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5">
              <div 
                onClick={() => onSwitchMode(appMode === 'portal' ? 'backoffice' : 'portal')}
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center shadow-md p-1 overflow-hidden border border-slate-700/60 ring-2 ${theme.primaryRing} flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
                title="คลิกเพื่อสลับโหมด"
              >
                <img 
                  src={logoImg} 
                  alt="ตราสัญลักษณ์เทศบาลตำบลทุ่งช้าง" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className={`${theme.badgeBg} ${theme.badgeText} text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium border ${theme.badgeBorder}`}>
                    เทศบาลตำบลทุ่งช้าง
                  </span>
                  
                  {/* App Mode Indicator Badge */}
                  {appMode === 'portal' ? (
                    <span className="inline-flex items-center text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      <span>หน้าบ้านพนักงาน</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                      <span>ระบบหลังบ้าน</span>
                    </span>
                  )}

                  <span className="inline-flex items-center text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-semibold hidden md:inline-flex">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor} animate-pulse mr-1`}></span>
                    <span>เชื่อมคลาวด์สด</span>
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight mt-0.5 flex items-center gap-2">
                  <span>{appMode === 'portal' ? 'ระบบบริการยื่นใบลาพนักงาน' : 'ระบบควบคุมและรายงานวันลา (หลังบ้าน)'}</span>
                </h1>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <PWAInstallButton />
              
              {/* Tone Switcher Button */}
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-medium text-xs flex items-center space-x-1.5 transition-all border border-slate-700/80 shadow-xs"
                title="เปลี่ยนโทนสีระบบ"
              >
                <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                <span className="hidden xl:inline text-[11px]">โทนสี: {theme.name}</span>
                <span className="xl:hidden text-[11px]">สี</span>
              </button>

              {/* Portal Mode Actions vs Backoffice Actions */}
              {appMode === 'portal' ? (
                <>
                  {currentAdmin ? (
                    <button
                      onClick={() => onSwitchMode('backoffice')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">ระบบหลังบ้าน</span>
                      <span className="sm:hidden">หลังบ้าน</span>
                    </button>
                  ) : (
                    <button
                      onClick={onOpenAdminLogin}
                      className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 border border-slate-700/80 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                      <span className="hidden sm:inline">เข้าสู่ระบบเจ้าหน้าที่</span>
                      <span className="sm:hidden">Login</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Backoffice Quick Tools */}
                  {onOpenAILeaveModal && (
                    <button
                      onClick={onOpenAILeaveModal}
                      className={`bg-gradient-to-r ${theme.primaryGradient} hover:opacity-95 text-white px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-slate-950/40 border border-white/20 active:scale-95 transition-all`}
                      title="สแกนใบลาด้วย AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse" />
                      <span className="hidden lg:inline">สแกนใบลา AI</span>
                      <span className="lg:hidden">AI</span>
                    </button>
                  )}

                  <button
                    onClick={onOpenNewLeaveModal}
                    className="bg-slate-800/90 hover:bg-slate-700/90 hover:text-white text-slate-200 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-1.5 transition-all border border-slate-700/80 shadow-xs"
                    title="บันทึกวันลาใหม่"
                  >
                    <PlusCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.accentText}`} />
                    <span className="hidden sm:inline">บันทึกปกติ</span>
                  </button>

                  {/* Switch back to Employee Portal */}
                  <button
                    onClick={() => onSwitchMode('portal')}
                    className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all"
                    title="ดูหน้าบริการพนักงาน"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden md:inline">หน้าบ้านพนักงาน</span>
                  </button>

                  {/* Admin User Profile & Logout Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-1.5 border border-slate-700 shadow-xs cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 font-bold flex items-center justify-center text-[10px]">
                        {currentAdmin?.name.charAt(0) || 'A'}
                      </div>
                      <span className="max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline">
                        {currentAdmin?.name.split(' ')[0] || 'ผู้ดูแล'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs divide-y divide-slate-800">
                        <div className="p-2.5 space-y-1">
                          <p className="font-bold text-white text-sm truncate">{currentAdmin?.name || 'ผู้ดูแลระบบ'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{currentAdmin?.position}</p>
                          <span className="inline-block bg-slate-800 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-md mt-1 border border-slate-700">
                            {currentAdmin?.role === 'super_admin' ? '👑 Super Admin' : currentAdmin?.role === 'hr_officer' ? '📋 HR Officer' : '✍️ Approver'}
                          </span>
                        </div>

                        <div className="p-1.5 space-y-1">
                          <button
                            onClick={() => {
                              onTabChange('admin-users');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                            <span>จัดการเจ้าหน้าที่และสิทธิ์</span>
                          </button>
                          <button
                            onClick={() => {
                              onSwitchMode('portal');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-2"
                          >
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <span>สลับไปหน้าบ้านพนักงาน</span>
                          </button>
                        </div>

                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogoutAdmin();
                            }}
                            className="w-full text-left p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 flex items-center space-x-2 font-bold"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>ออกจากระบบหลังบ้าน</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Only in Backoffice Mode) */}
          {appMode === 'backoffice' && (
            <div className="hidden md:flex space-x-1 overflow-x-auto pb-3 pt-1 border-t border-slate-800/80 scrollbar-none">
              {backofficeTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? theme.activeNavTab
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
};
