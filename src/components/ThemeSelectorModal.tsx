import React from 'react';
import { ColorTone, THEME_CONFIGS, useTheme } from '../context/ThemeContext';
import { Palette, Check, Sparkles, X } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colorTone, setColorTone } = useTheme();

  if (!isOpen) return null;

  const toneOptions: { id: ColorTone; colorHex: string; gradient: string }[] = [
    { id: 'emerald', colorHex: '#059669', gradient: 'from-emerald-600 to-teal-600' },
    { id: 'navy', colorHex: '#2563eb', gradient: 'from-blue-600 to-indigo-600' },
    { id: 'indigo', colorHex: '#4f46e5', gradient: 'from-indigo-600 to-purple-600' },
    { id: 'amber', colorHex: '#d97706', gradient: 'from-amber-600 to-orange-600' },
    { id: 'slate', colorHex: '#334155', gradient: 'from-slate-700 to-slate-900' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900 space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
              <Palette className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">เลือกโทนสีของระบบ</h3>
              <p className="text-xs text-slate-500">ปรับแต่งชุดสีและบรรยากาศตามความต้องการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Choices Grid */}
        <div className="space-y-2.5">
          {toneOptions.map((opt) => {
            const config = THEME_CONFIGS[opt.id];
            const isSelected = colorTone === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setColorTone(opt.id);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  {/* Swatch */}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${opt.gradient} shadow-sm flex items-center justify-center text-white flex-shrink-0`}>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{config.name}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                          ใช้งานอยู่
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{config.subname}</p>
                  </div>
                </div>

                <div className="flex space-x-1">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${opt.gradient}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
