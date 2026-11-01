import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@theme_v1';

export const LIGHT = {
  dark: false,
  bg: '#F5F5FA',
  card: '#FFFFFF',
  header: '#6C63FF',
  headerText: '#FFFFFF',
  text: '#1A1A2E',
  subtext: '#888888',
  muted: '#AAAAAA',
  border: '#E8E8E8',
  borderLight: '#E0E0E0',
  tabBg: '#EDEDF5',
  tabActive: '#FFFFFF',
  inputBg: '#FAFAFA',
  rowBg: '#F8F8FC',
  rowActiveBg: '#EEF0FE',
  pillBg: '#FFFFFF',
  spinnerBox: '#F0EFFE',
  overlay: 'rgba(0,0,0,0.45)',
};

export const DARK = {
  dark: true,
  bg: '#12121E',
  card: '#1E1E30',
  header: '#4A43CC',
  headerText: '#FFFFFF',
  text: '#F0F0FF',
  subtext: '#9090AA',
  muted: '#55556A',
  border: '#2E2E45',
  borderLight: '#2E2E45',
  tabBg: '#1A1A2C',
  tabActive: '#2D2D48',
  inputBg: '#252538',
  rowBg: '#252538',
  rowActiveBg: '#2D2D55',
  pillBg: '#1E1E30',
  spinnerBox: '#2D2D55',
  overlay: 'rgba(0,0,0,0.7)',
};

const ThemeContext = createContext({ theme: LIGHT, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [theme, setTheme] = useState(system === 'dark' ? DARK : LIGHT);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'dark') setTheme(DARK);
      else if (saved === 'light') setTheme(LIGHT);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme.dark ? LIGHT : DARK;
    setTheme(next);
    AsyncStorage.setItem(THEME_KEY, next.dark ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
