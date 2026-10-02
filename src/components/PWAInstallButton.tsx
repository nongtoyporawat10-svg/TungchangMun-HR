import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-sky-500 transition-colors"
      >
        <Download className="w-4 h-4" />
        ติดตั้งแอปลงเครื่อง
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          ติดตั้งลง iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">ติดตั้งลง iPhone / iPad</h3>
              <p className="text-sm text-slate-600 mb-4 text-left">
                1. แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือของ Safari ด้านล่าง<br/><br/>
                2. เลื่อนลงและเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-800 hover:bg-slate-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
