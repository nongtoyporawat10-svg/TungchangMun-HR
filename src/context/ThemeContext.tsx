import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorTone = 'emerald' | 'navy' | 'indigo' | 'amber' | 'slate';

export interface ThemeConfig {
  id: ColorTone;
  name: string;
  subname: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  primaryGradient: string;
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryRing: string;
  accentText: string;
  activeNavTab: string;
  cardHighlight: string;
  heroGradient: string;
  appBackground: string;
  dotColor: string;
}

export const THEME_CONFIGS: Record<ColorTone, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'เขียวมรกตเทศบาล',
    subname: 'สุภาพ สง่างาม น่าเชื่อถือ (ค่าเริ่มต้น)',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    primaryGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    primaryBg: 'bg-emerald-600',
    primaryHoverBg: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryRing: 'ring-emerald-500/20',
    accentText: 'text-emerald-400',
    activeNavTab: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/30',
    cardHighlight: 'border-emerald-500/40 bg-emerald-50/40',
    heroGradient: 'from-slate-900 via-emerald-950/40 to-slate-900',
    appBackground: 'bg-slate-100/90',
    dotColor: 'bg-emerald-400',
  },
  navy: {
    id: 'navy',
    name: 'น้ำเงินคราม-แซฟไฟร์',
    subname: 'สไตล์ผู้บริหาร คมเข้ม สากล',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/30',
    primaryGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    primaryBg: 'bg-blue-600',
    primaryHoverBg: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryRing: 'ring-blue-500/20',
    accentText: 'text-blue-400',
    activeNavTab: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40 border border-blue-400/30',
    cardHighlight: 'border-blue-500/40 bg-blue-50/40',
    heroGradient: 'from-slate-950 via-blue-950/40 to-slate-900',
    appBackground: 'bg-slate-100/90',
    dotColor: 'bg-blue-400',
  },
  indigo: {
    id: 'indigo',
    name: 'ม่วงครามราชการ',
    subname: 'สิริวัณณวรี เอกลักษณ์ไทยร่วมสมัย',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    primaryGradient: 'from-indigo-600 via-purple-600 to-indigo-700',
    primaryBg: 'bg-indigo-600',
    primaryHoverBg: 'hover:bg-indigo-700',
    primaryText: 'text-indigo-600',
    primaryRing: 'ring-indigo-500/20',
    accentText: 'text-indigo-400',
    activeNavTab: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/40 border border-indigo-400/30',
    cardHighlight: 'border-indigo-500/40 bg-indigo-50/40',
    heroGradient: 'from-slate-950 via-indigo-950/40 to-slate-900',
    appBackground: 'bg-slate-100/90',
    dotColor: 'bg-indigo-400',
  },
  amber: {
    id: 'amber',
    name: 'ศิลาแลง-ทองคำเมืองน่าน',
    subname: 'อัตลักษณ์ล้านนาตะวันออก อบอุ่น',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    primaryGradient: 'from-amber-600 via-orange-600 to-amber-700',
    primaryBg: 'bg-amber-600',
    primaryHoverBg: 'hover:bg-amber-700',
    primaryText: 'text-amber-600',
    primaryRing: 'ring-amber-500/20',
    accentText: 'text-amber-400',
    activeNavTab: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/40 border border-amber-400/30',
    cardHighlight: 'border-amber-500/40 bg-amber-50/40',
    heroGradient: 'from-slate-950 via-amber-950/30 to-slate-900',
    appBackground: 'bg-stone-100/90',
    dotColor: 'bg-amber-400',
  },
  slate: {
    id: 'slate',
    name: 'มินิมอลโมเดิร์น',
    subname: 'เรียบหรู สบายตา โทนสีเทาเข้ม',
    badgeBg: 'bg-slate-600/30',
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-500/40',
    primaryGradient: 'from-slate-800 via-slate-700 to-slate-900',
    primaryBg: 'bg-slate-800',
    primaryHoverBg: 'hover:bg-slate-700',
    primaryText: 'text-slate-800',
    primaryRing: 'ring-slate-400/20',
    accentText: 'text-slate-300',
    activeNavTab: 'bg-slate-800 text-white shadow-md shadow-slate-950/40 border border-slate-600/50',
    cardHighlight: 'border-slate-400/40 bg-slate-100/60',
    heroGradient: 'from-slate-950 via-slate-900 to-slate-950',
    appBackground: 'bg-slate-100/90',
    dotColor: 'bg-slate-300',
  },
};

interface ThemeContextType {
  colorTone: ColorTone;
  setColorTone: (tone: ColorTone) => void;
  theme: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorTone, setColorToneState] = useState<ColorTone>(() => {
    const saved = localStorage.getItem('thungchang_color_tone');
    if (saved && (saved in THEME_CONFIGS)) {
      return saved as ColorTone;
    }
    return 'emerald';
  });

  const setColorTone = (tone: ColorTone) => {
    setColorToneState(tone);
    try {
      localStorage.setItem('thungchang_color_tone', tone);
    } catch (e) {
      console.error(e);
    }
  };

  const theme = THEME_CONFIGS[colorTone];

  return (
    <ThemeContext.Provider value={{ colorTone, setColorTone, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
