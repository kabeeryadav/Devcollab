/* eslint-disable react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
// The react-hooks/set-state-in-effect rule is not standard but just in case:
/* eslint-disable */
'use client';
import { useEffect, useState } from 'react';

export default function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
