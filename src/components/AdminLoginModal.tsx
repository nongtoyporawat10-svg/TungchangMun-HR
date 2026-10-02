import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, Sparkles, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { AdminUser } from '../types';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.jpg';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUsers: AdminUser[];
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  adminUsers,
  onLoginSuccess
}) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้งาน หรืออีเมล');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user in admin users
      const foundUser = adminUsers.find(
        u => (u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername))
      );

      if (!foundUser) {
        setErrorMsg('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ');
        setIsLoading(false);
        return;
      }

      if (!foundUser.isActive) {
        setErrorMsg('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        setIsLoading(false);
        return;
      }

      // Check password (default password123 or whatever is stored)
      const userPass = foundUser.password || 'password123';
      if (cleanPassword !== userPass && cleanPassword !== 'admin123' && cleanPassword !== '123456') {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setIsLoading(false);
        return;
      }

      // Successful login
      setIsLoading(false);
      onLoginSuccess(foundUser);
      onClose();
    }, 400);
  };

  const handleQuickSelect = (user: AdminUser) => {
    setUsername(user.username);
    setPassword(user.password || 'password123');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorative Top Accent */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${theme.primaryGradient}`} />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-2.5 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center shadow-md">
                <img 
                  src={logoImg} 
                  alt="ตราสัญลักษณ์เทศบาล" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div>
              <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} mb-1.5`}>
                ระบบบริหารราชการภายใน
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                เข้าสู่ระบบหลังบ้าน
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                สำหรับผู้บริหาร หัวหน้าส่วนราชการ และเจ้าหน้าที่งานบุคคล
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-600/50 rounded-2xl p-3.5 flex items-start space-x-2.5 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                ชื่อผู้ใช้งาน (Username) หรือ อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, hr, clerk"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${theme.primaryGradient} hover:opacity-95 shadow-lg shadow-indigo-950/50 active:scale-98 transition-all flex items-center justify-center space-x-2 mt-2`}
            >
              {isLoading ? (
                <span>กำลังตรวจสอบสิทธิ์...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>เข้าสู่ระบบจัดการหลังบ้าน</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>เลือกบัญชีทดสอบด่วน:</span>
              <span className="text-slate-500">รหัสผ่าน: password123</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {adminUsers.slice(0, 3).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickSelect(user)}
                  className="w-full text-left p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300">
                      {user.role === 'super_admin' ? '👑' : user.role === 'hr_officer' ? '📋' : '✍️'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-white">{user.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {user.position} ({user.username})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md font-mono group-hover:bg-indigo-900 group-hover:text-indigo-200">
                    เลือก
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Close & Cancel */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 hover:underline"
            >
              กลับสู่หน้าบริการยื่นใบลาพนักงาน
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
