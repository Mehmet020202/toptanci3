import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tema tanımlamaları
export const themes = {
  default: {
    name: 'Varsayılan',
    primary: '#3b82f6', // blue-500
    primaryLight: '#dbeafe', // blue-100
    primaryDark: '#2563eb', // blue-600
    secondary: '#10b981', // emerald-500
    secondaryLight: '#d1fae5', // emerald-100
    secondaryDark: '#059669', // emerald-600
    accent: '#8b5cf6', // violet-500
    accentLight: '#ede9fe', // violet-100
    accentDark: '#7c3aed', // violet-600
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-100
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-100
    negativeDark: '#dc2626', // red-600
  },
  dark: {
    name: 'Koyu',
    primary: '#6b7280', // gray-500
    primaryLight: '#1f2937', // gray-800
    primaryDark: '#111827', // gray-900
    secondary: '#3b82f6', // blue-500
    secondaryLight: '#1e3a8a', // blue-800
    secondaryDark: '#1e40af', // blue-900
    accent: '#8b5cf6', // violet-500
    accentLight: '#5b21b6', // violet-800
    accentDark: '#4c1d95', // violet-900
    positive: '#10b981', // emerald-500
    positiveLight: '#064e3b', // emerald-800
    positiveDark: '#047857', // emerald-900
    negative: '#ef4444', // red-500
    negativeLight: '#7f1d1d', // red-800
    negativeDark: '#991b1b', // red-900
  },
  warm: {
    name: 'Sıcak',
    primary: '#f97316', // orange-500
    primaryLight: '#fff7ed', // orange-50
    primaryDark: '#ea580c', // orange-600
    secondary: '#ef4444', // red-500
    secondaryLight: '#fee2e2', // red-50
    secondaryDark: '#dc2626', // red-600
    accent: '#eab308', // yellow-500
    accentLight: '#fefce8', // yellow-50
    accentDark: '#ca8a04', // yellow-600
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-50
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-50
    negativeDark: '#dc2626', // red-600
  },
  cool: {
    name: 'Soğuk',
    primary: '#14b8a6', // teal-500
    primaryLight: '#ccfbf1', // teal-100
    primaryDark: '#0d9488', // teal-600
    secondary: '#06b6d4', // cyan-500
    secondaryLight: '#cffafe', // cyan-100
    secondaryDark: '#0891b2', // cyan-600
    accent: '#6366f1', // indigo-500
    accentLight: '#e0e7ff', // indigo-100
    accentDark: '#4f46e5', // indigo-600
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-50
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-50
    negativeDark: '#dc2626', // red-600
  },
  blue: {
    name: 'Mavi',
    primary: '#3b82f6', // blue-500
    primaryLight: '#dbeafe', // blue-100
    primaryDark: '#2563eb', // blue-600
    secondary: '#60a5fa', // blue-400
    secondaryLight: '#eff6ff', // blue-50
    secondaryDark: '#3b82f6', // blue-500
    accent: '#93c5fd', // blue-300
    accentLight: '#dbeafe', // blue-100
    accentDark: '#3b82f6', // blue-500
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-100
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-100
    negativeDark: '#dc2626', // red-600
  },
  gold: {
    name: 'Gold',
    primary: '#f59e0b', // amber-500
    primaryLight: '#fffbeb', // amber-50
    primaryDark: '#d97706', // amber-600
    secondary: '#fbbf24', // amber-400
    secondaryLight: '#fef3c7', // amber-100
    secondaryDark: '#f59e0b', // amber-500
    accent: '#fcd34d', // amber-300
    accentLight: '#fef3c7', // amber-100
    accentDark: '#f59e0b', // amber-500
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-100
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-100
    negativeDark: '#dc2626', // red-600
  },
  green: {
    name: 'Yeşil',
    primary: '#10b981', // emerald-500
    primaryLight: '#d1fae5', // emerald-100
    primaryDark: '#059669', // emerald-600
    secondary: '#34d399', // emerald-400
    secondaryLight: '#ecfdf5', // emerald-50
    secondaryDark: '#10b981', // emerald-500
    accent: '#6ee7b7', // emerald-300
    accentLight: '#d1fae5', // emerald-100
    accentDark: '#10b981', // emerald-500
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-100
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-100
    negativeDark: '#dc2626', // red-600
  }
};

type Theme = keyof typeof themes;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: typeof themes.default;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('default');
  
  const currentTheme = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}